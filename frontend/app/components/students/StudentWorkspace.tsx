"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { postAuthRequest } from "../../lib/auth-api";
import {
  getStudentProfile,
  updateStudentProfile,
  type StudentProfile,
} from "../../lib/student-api";
import { getCurrentUser, type AuthenticatedUser } from "../../lib/session-api";

export default function StudentWorkspace() {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile>({
    institution: "",
    studyField: "",
  });
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
        router.replace("/connexion?next=%2Fespace-etudiant");
        return;
      }
      if (currentUser.role !== "STUDENT") {
        router.replace(
          currentUser.role === "INVESTOR"
            ? "/espace-investisseur"
            : currentUser.role === "ENTREPRENEUR"
              ? "/espace-entrepreneur"
              : "/",
        );
        return;
      }
      const studentProfile = await getStudentProfile();
      setUser(currentUser);
      setProfile(studentProfile);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger votre espace. Veuillez réessayer.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadWorkspace(), 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const savedProfile = await updateStudentProfile(profile);
      setProfile(savedProfile);
      setNotice("Votre profil étudiant a bien été mis à jour.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Votre profil n’a pas pu être enregistré. Veuillez réessayer.",
      );
    } finally {
      setIsSaving(false);
    }
  };

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

  if (isLoading) {
    return (
      <main className="student-workspace-state" aria-live="polite">
        <span className="investor-dashboard-state__spinner" />
        <p>Vérification de votre session…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="student-workspace-state">
        <h1>Votre espace étudiant</h1>
        <p role="alert">{error || "La session n’a pas pu être vérifiée."}</p>
        {error && <button type="button" onClick={() => void loadWorkspace()}>Réessayer</button>}
        <Link href="/etudiants">Découvrir l’espace étudiants</Link>
        <Link href="/connexion">Retour à la connexion</Link>
      </main>
    );
  }

  const firstName = user.firstName || user.fullName.split(" ")[0] || "Étudiant";
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="student-workspace">
      <aside className="student-workspace__sidebar">
        <Link className="student-workspace__brand" href="/espace-etudiant">
          <span className="student-workspace__brand-mark" aria-hidden="true">IG</span>
          <span><strong>InvestGuinée</strong><small>ESPACE ÉTUDIANT</small></span>
        </Link>
        <nav aria-label="Navigation de l’espace étudiant">
          <a className="student-workspace__nav-link--active" href="#overview">Vue d’ensemble</a>
          <a href="#profile">Mon profil</a>
          <Link href="/etudiants#student-resources">Ressources</Link>
          <Link href="/projets">Explorer les projets</Link>
        </nav>
        <div className="student-workspace__sidebar-user">
          <span className="student-workspace__avatar">{initials}</span>
          <span><strong>{user.fullName}</strong><small>Étudiant</small></span>
          <button type="button" onClick={() => void handleLogout()} disabled={isLoggingOut}>
            {isLoggingOut ? "Déconnexion…" : "Se déconnecter"}
          </button>
        </div>
      </aside>

      <main className="student-workspace__main">
        <header className="student-workspace__topbar">
          <span>InvestGuinée <span aria-hidden="true">/</span> Espace étudiant</span>
          <span>{user.email}</span>
        </header>

        <div className="student-workspace__content">
          {error && <p className="student-workspace__message student-workspace__message--error" role="alert">{error}</p>}
          {notice && <p className="student-workspace__message" role="status">{notice}</p>}

          <section className="student-workspace__welcome" id="overview">
            <div>
              <span>VOTRE ESPACE PERSONNEL</span>
              <h1>Bienvenue, {firstName}.</h1>
              <p>Retrouvez vos informations et explorez les ressources InvestGuinée dédiées aux étudiants.</p>
            </div>
            <div className="student-workspace__welcome-mark" aria-hidden="true">
              <span>IG</span>
              <i /><i /><i />
            </div>
          </section>

          <div className="student-workspace__notice">
            <span aria-hidden="true">i</span>
            <p><strong>Les formations ne sont pas encore ouvertes.</strong> Les ressources présentées sont des exemples de démonstration ; aucun cours ni certificat n’est actuellement disponible.</p>
          </div>

          <div className="student-workspace__grid">
            <section className="student-workspace__panel student-workspace__profile-panel" id="profile">
              <div className="student-workspace__panel-heading">
                <div><span>VOS INFORMATIONS</span><h2>Mon profil étudiant</h2></div>
                <span className="student-workspace__profile-icon" aria-hidden="true">{initials || "É"}</span>
              </div>
              <form className="student-workspace__form" onSubmit={(event) => void handleProfileSubmit(event)}>
                <label>
                  <span>Nom complet</span>
                  <input value={user.fullName} readOnly aria-readonly="true" />
                  <small>Pour modifier votre nom, contactez l’assistance.</small>
                </label>
                <label>
                  <span>Adresse email</span>
                  <input type="email" value={user.email} readOnly aria-readonly="true" />
                </label>
                <label>
                  <span>Établissement <small>(facultatif)</small></span>
                  <input
                    autoComplete="organization"
                    maxLength={150}
                    value={profile.institution}
                    onChange={(event) => setProfile((current) => ({ ...current, institution: event.target.value }))}
                    placeholder="Votre université ou établissement"
                  />
                </label>
                <label>
                  <span>Domaine d’études <small>(facultatif)</small></span>
                  <input
                    maxLength={150}
                    value={profile.studyField}
                    onChange={(event) => setProfile((current) => ({ ...current, studyField: event.target.value }))}
                    placeholder="Ex. Finance, informatique, agriculture…"
                  />
                </label>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? "Enregistrement…" : "Enregistrer mon profil"}
                </button>
              </form>
            </section>

            <section className="student-workspace__panel student-workspace__discover-panel">
              <div className="student-workspace__panel-heading">
                <div><span>POUR ALLER PLUS LOIN</span><h2>À découvrir</h2></div>
              </div>
              <Link className="student-workspace__discovery-card" href="/etudiants#student-resources">
                <span className="student-workspace__discovery-icon">01</span>
                <span><strong>Ressources de découverte</strong><small>Entrepreneuriat, finance et compétences — aperçus uniquement.</small></span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link className="student-workspace__discovery-card" href="/projets">
                <span className="student-workspace__discovery-icon student-workspace__discovery-icon--blue">02</span>
                <span><strong>Projets guinéens</strong><small>Explorez le catalogue de projets et leurs initiatives.</small></span>
                <span aria-hidden="true">→</span>
              </Link>
              <div className="student-workspace__next">
                <strong>Votre espace évoluera avec vous.</strong>
                <p>Les programmes d’apprentissage et d’accompagnement seront annoncés lorsqu’ils seront disponibles.</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
