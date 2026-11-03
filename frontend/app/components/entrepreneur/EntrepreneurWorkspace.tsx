"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  developmentStages,
  guineanRegions,
  projectSectors,
} from "../../data/project-catalog";
import { postAuthRequest } from "../../lib/auth-api";
import {
  createEntrepreneurProject,
  getEntrepreneurProjects,
  updateEntrepreneurProject,
  type EntrepreneurProject,
  type EntrepreneurProjectInput,
} from "../../lib/entrepreneur-api";
import { getCurrentUser, type AuthenticatedUser } from "../../lib/session-api";

type Props = {
  mode: "list" | "form";
  projectId?: number;
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function EntrepreneurWorkspace({ mode, projectId }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [projects, setProjects] = useState<EntrepreneurProject[]>([]);
  const [editingProject, setEditingProject] = useState<EntrepreneurProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace("/connexion?next=%2Fespace-entrepreneur");
        return;
      }
      if (currentUser.role !== "ENTREPRENEUR") {
        router.replace(
          currentUser.role === "INVESTOR"
            ? "/espace-investisseur"
            : currentUser.role === "STUDENT"
              ? "/etudiants"
              : "/",
        );
        return;
      }
      const entrepreneurProjects = await getEntrepreneurProjects();
      setUser(currentUser);
      setProjects(entrepreneurProjects);
      if (projectId !== undefined) {
        const selectedProject = entrepreneurProjects.find(
          (project) => project.id === projectId,
        );
        if (!selectedProject) {
          setError("Ce projet est introuvable ou ne vous appartient pas.");
        } else if (
          selectedProject.status !== "DRAFT" &&
          selectedProject.status !== "REJECTED"
        ) {
          setError("Seuls les brouillons et les projets à compléter peuvent être modifiés.");
        } else {
          setEditingProject(selectedProject);
        }
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger votre espace. Veuillez réessayer.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadWorkspace(), 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError("");
    try {
      await postAuthRequest("logout/", {});
      router.replace("/connexion");
      router.refresh();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "La déconnexion n’a pas abouti. Veuillez réessayer.",
      );
      setIsLoggingOut(false);
    }
  };

  const handleSave = async (action: "save" | "submit") => {
    const form = formRef.current;
    if (!form) return;
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const input: EntrepreneurProjectInput = {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      sector: String(formData.get("sector") ?? ""),
      region: String(formData.get("region") ?? ""),
      fundingGoal: Number(formData.get("fundingGoal")),
      stage: String(formData.get("stage") ?? ""),
    };

    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const savedProject = editingProject
        ? await updateEntrepreneurProject(editingProject.id, input, action)
        : await createEntrepreneurProject(input, action);
      setProjects((currentProjects) => [
        savedProject,
        ...currentProjects.filter((project) => project.id !== savedProject.id),
      ]);
      if (action === "submit") {
        setNotice("Votre projet a été transmis pour examen. Il n’est pas encore publié.");
      } else {
        setNotice("Votre brouillon a été enregistré.");
      }
      if (savedProject.status === "DRAFT") {
        router.replace(`/espace-entrepreneur/modifier/${savedProject.id}`);
        setEditingProject(savedProject);
      } else {
        router.replace("/espace-entrepreneur");
      }
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Le projet n’a pas pu être enregistré. Veuillez réessayer.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSave("save");
  };

  if (isLoading) {
    return (
      <main className="entrepreneur-state" aria-live="polite">
        <span className="investor-dashboard-state__spinner" />
        <p>Vérification de votre session…</p>
      </main>
    );
  }

  if (!user || error && !editingProject && projectId !== undefined) {
    return (
      <main className="entrepreneur-state">
        <h1>Votre espace entrepreneur</h1>
        <p role="alert">{error || "La session n’a pas pu être vérifiée."}</p>
        <Link href="/espace-entrepreneur">Retour à mes projets</Link>
        <Link href="/connexion">Retour à la connexion</Link>
      </main>
    );
  }

  const firstName = user.firstName || user.fullName.split(" ")[0] || "Entrepreneur";
  const drafts = projects.filter((project) => project.status === "DRAFT").length;
  const submitted = projects.filter((project) => project.status === "SUBMITTED").length;
  const needsChanges = projects.filter((project) => project.status === "REJECTED").length;

  return (
    <div className="entrepreneur-space">
      <aside className="entrepreneur-space__sidebar">
        <Link className="entrepreneur-space__brand" href="/espace-entrepreneur">
          <span className="entrepreneur-space__flag" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>InvestGuinée</strong><small>ESPACE ENTREPRENEUR</small></span>
        </Link>
        <nav aria-label="Navigation de l’espace entrepreneur">
          <Link className={mode === "list" ? "entrepreneur-space__nav-link--active" : ""} href="/espace-entrepreneur">Mes projets</Link>
          <Link className={mode === "form" ? "entrepreneur-space__nav-link--active" : ""} href="/espace-entrepreneur/nouveau">Créer un projet</Link>
          <Link href="/projets">Explorer le catalogue</Link>
        </nav>
        <div className="entrepreneur-space__sidebar-user">
          <span className="entrepreneur-space__avatar">{`${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()}</span>
          <span><strong>{user.fullName}</strong><small>Entrepreneur</small></span>
          <button type="button" onClick={() => void handleLogout()} disabled={isLoggingOut}>Quitter</button>
        </div>
      </aside>

      <main className="entrepreneur-space__main">
        <header className="entrepreneur-space__topbar">
          <span>InvestGuinée <span aria-hidden="true">/</span> Espace entrepreneur</span>
          <span>{user.fullName}</span>
        </header>

        <div className="entrepreneur-space__content">
          {mode === "list" ? (
            <>
              <section className="entrepreneur-space__welcome">
                <div>
                  <span>VOTRE ESPACE DE TRAVAIL</span>
                  <h1>Bonjour {firstName},</h1>
                  <p>Structurez vos projets et suivez leur avancement vers le financement.</p>
                </div>
                <Link href="/espace-entrepreneur/nouveau">+ Créer un projet</Link>
              </section>

              <section className="entrepreneur-space__stats" aria-label="Résumé des projets">
                <article><span>Total de projets</span><strong>{projects.length}</strong></article>
                <article><span>Brouillons</span><strong>{drafts}</strong></article>
                <article><span>En examen</span><strong>{submitted}</strong></article>
                <article><span>À compléter</span><strong>{needsChanges}</strong></article>
              </section>

              <section className="entrepreneur-space__projects">
                <div className="entrepreneur-space__section-heading">
                  <div><span>VOTRE PORTEFEUILLE</span><h2>Mes projets</h2></div>
                  <Link href="/espace-entrepreneur/nouveau">Nouveau projet <span aria-hidden="true">+</span></Link>
                </div>
                {error && <p className="entrepreneur-space__message entrepreneur-space__message--error" role="alert">{error}</p>}
                {notice && <p className="entrepreneur-space__message" role="status">{notice}</p>}
                {projects.length === 0 ? (
                  <div className="entrepreneur-space__empty">
                    <span aria-hidden="true">＋</span>
                    <h3>Votre premier projet commence ici</h3>
                    <p>Présentez votre activité, votre besoin de financement et votre stade d’avancement.</p>
                    <Link href="/espace-entrepreneur/nouveau">Créer mon premier projet</Link>
                  </div>
                ) : (
                  <div className="entrepreneur-space__project-list">
                    {projects.map((project) => (
                      <article className="entrepreneur-space__project-card" key={project.id}>
                        <div className="entrepreneur-space__project-card-main">
                          <div>
                            <span className={`entrepreneur-space__status entrepreneur-space__status--${project.status.toLowerCase()}`}>{project.statusLabel}</span>
                            <h3>{project.title}</h3>
                            <p>{project.sector} · {project.region} · {project.stage}</p>
                          </div>
                          <div className="entrepreneur-space__goal">
                            <span>Objectif de financement</span>
                            <strong>{formatAmount(project.fundingGoal)} GNF</strong>
                          </div>
                        </div>
                        <div className="entrepreneur-space__project-card-footer">
                          <span>Mis à jour le {formatDate(project.updatedAt)}</span>
                          {project.status === "DRAFT" || project.status === "REJECTED" ? (
                            <>
                              <Link href={`/espace-entrepreneur/modifier/${project.id}`}>Modifier</Link>
                              <button type="button" onClick={() => void updateEntrepreneurProject(project.id, project, "submit").then((submittedProject) => {
                                setProjects((currentProjects) => currentProjects.map((item) => item.id === submittedProject.id ? submittedProject : item));
                                setNotice("Votre projet a été transmis pour examen. Il n’est pas encore publié.");
                              }).catch((submitError: unknown) => setError(submitError instanceof Error ? submitError.message : "La soumission a échoué."))}>
                                Soumettre pour examen
                              </button>
                            </>
                          ) : (
                            <span>Vous serez informé après l’examen de votre dossier.</span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="entrepreneur-space__form-page">
              <div className="entrepreneur-space__form-heading">
                <Link href="/espace-entrepreneur">← Retour à mes projets</Link>
                <span>PRÉSENTATION DU PROJET</span>
                <h1>{editingProject ? "Modifier le projet" : "Créer un projet"}</h1>
                <p>Les champs marqués d’un astérisque sont obligatoires. Votre projet reste privé tant qu’il n’a pas été examiné.</p>
              </div>
              {error && <p className="entrepreneur-space__message entrepreneur-space__message--error" role="alert">{error}</p>}
              <form className="entrepreneur-space__form" ref={formRef} onSubmit={handleFormSubmit}>
                <label>
                  <span>Nom du projet *</span>
                  <input name="title" required maxLength={160} defaultValue={editingProject?.title} placeholder="Ex. Transformation agricole à Kindia" />
                </label>
                <div className="entrepreneur-space__form-row">
                  <label>
                    <span>Secteur d’activité *</span>
                    <select name="sector" required defaultValue={editingProject?.sector ?? ""}>
                      <option value="" disabled>Sélectionner un secteur</option>
                      {projectSectors.map((sector) => <option key={sector}>{sector}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Région *</span>
                    <select name="region" required defaultValue={editingProject?.region ?? ""}>
                      <option value="" disabled>Sélectionner une région</option>
                      {guineanRegions.map((region) => <option key={region}>{region}</option>)}
                    </select>
                  </label>
                </div>
                <div className="entrepreneur-space__form-row">
                  <label>
                    <span>Stade d’avancement *</span>
                    <select name="stage" required defaultValue={editingProject?.stage ?? ""}>
                      <option value="" disabled>Sélectionner un stade</option>
                      {developmentStages.map((stage) => <option key={stage}>{stage}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Objectif de financement (GNF) *</span>
                    <input name="fundingGoal" type="number" min="1" max="999999999999999" step="1" required defaultValue={editingProject?.fundingGoal} placeholder="Ex. 250000000" />
                  </label>
                </div>
                <label>
                  <span>Description du projet * <small>(30 caractères minimum)</small></span>
                  <textarea name="description" rows={6} required minLength={30} maxLength={5000} defaultValue={editingProject?.description} placeholder="Présentez le besoin, la solution proposée, les bénéficiaires et l’utilisation du financement." />
                </label>
                <div className="entrepreneur-space__form-note">
                  <strong>Après la soumission</strong>
                  <p>Votre dossier sera transmis pour examen. Il ne sera pas visible dans le catalogue public avant validation.</p>
                </div>
                <div className="entrepreneur-space__form-actions">
                  <button type="submit" disabled={isSaving}>{isSaving ? "Enregistrement…" : "Enregistrer le brouillon"}</button>
                  <button type="button" disabled={isSaving} onClick={() => void handleSave("submit")}>{isSaving ? "Transmission…" : "Soumettre pour examen"}</button>
                </div>
              </form>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
