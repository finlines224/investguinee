"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleUserRound,
  Compass,
  GraduationCap,
  Heart,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Search,
  Settings,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import { postAuthRequest } from "../../lib/auth-api";
import {
  getPublicProjects,
  type PublicProjectStats,
} from "../../lib/public-project-api";
import ProjectExplorer from "../projects/ProjectExplorer";
import {
  getStudentFavoriteIds,
  getStudentProfile,
  updateStudentFavoriteIds,
  updateStudentProfile,
  type StudentProfile,
} from "../../lib/student-api";
import { getCurrentUser, type AuthenticatedUser } from "../../lib/session-api";
import type { CatalogProject } from "../../data/project-catalog";
import StudentTrainingCatalog from "./StudentTrainingCatalog";
import StudentChallengeCatalog from "./StudentChallengeCatalog";
import StudentIdeaWorkspace from "./StudentIdeaWorkspace";
import StudentMentorshipWorkspace from "./StudentMentorshipWorkspace";
import StudentCommunityWorkspace from "./StudentCommunityWorkspace";
import StudentNotificationsWorkspace from "./StudentNotificationsWorkspace";
import StudentProfileWorkspace from "./StudentProfileWorkspace";
import StudentSettingsWorkspace from "./StudentSettingsWorkspace";

const NAV_ITEMS = [
  { id: "tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard, badge: 0 },
  { id: "projets", label: "Découvrir les projets", icon: Compass, badge: 0 },
  { id: "formations", label: "Formations", icon: GraduationCap, badge: 0 },
  { id: "defis", label: "Défis & concours", icon: Trophy, badge: 0 },
  { id: "idee", label: "Mon idée de projet", icon: Lightbulb, badge: 0 },
  { id: "mentorat", label: "Mentorat", icon: CircleUserRound, badge: 0 },
  { id: "communaute", label: "Communauté", icon: UsersRound, badge: 0 },
  { id: "favoris", label: "Favoris", icon: Heart, badge: 0 },
  { id: "notifications", label: "Notifications", icon: Bell, badge: 0 },
  { id: "profil", label: "Mon profil", icon: CircleUserRound, badge: 0 },
  { id: "parametres", label: "Paramètres", icon: Settings, badge: 0 },
];

export default function StudentDashboard({
  initialSection = "dashboard",
  projectSlug,
}: {
  initialSection?: "dashboard" | "projects" | "project" | "training" | "challenges" | "idea" | "mentorat" | "communaute" | "favorites" | "notifications" | "profile" | "settings";
  projectSlug?: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [projects, setProjects] = useState<CatalogProject[]>([]);
  const [projectStats, setProjectStats] = useState<PublicProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [favoritesSaving, setFavoritesSaving] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [activeNav, setActiveNav] = useState(
    initialSection === "dashboard"
      ? "tableau-de-bord"
      : initialSection === "training"
        ? "formations"
        : initialSection === "challenges"
          ? "defis"
          : initialSection === "idea"
            ? "idee"
            : initialSection === "mentorat"
              ? "mentorat"
                : initialSection === "communaute"
                  ? "communaute"
                  : initialSection === "favorites"
                    ? "favoris"
                    : initialSection === "notifications"
                      ? "notifications"
                      : initialSection === "profile"
                        ? "profil"
                        : initialSection === "settings"
                          ? "parametres"
                          : "projets",
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [favoritesError, setFavoritesError] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setProjectsLoaded(false);
    setFavoritesLoaded(false);
    setSessionError("");
    setProfileError("");
    setCatalogError("");
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) { router.replace("/connexion?next=%2Fespace-etudiant"); return; }
      if (currentUser.role !== "STUDENT") {
        router.replace(
          currentUser.role === "INVESTOR" ? "/espace-investisseur"
          : currentUser.role === "ENTREPRENEUR" ? "/espace-entrepreneur"
          : "/"
        );
        return;
      }
      setUser(currentUser);
      const projectsRequest =
        initialSection === "projects" ? Promise.resolve(null) : getPublicProjects();
      const results = await Promise.allSettled([
        getStudentProfile(),
        projectsRequest,
      ]);
      const [profileResult, projectsResult] = results;
      if (profileResult.status === "fulfilled") {
        setStudentProfile(profileResult.value);
      } else {
        setProfileError(
          profileResult.reason instanceof Error
            ? profileResult.reason.message
            : "Impossible de charger votre profil étudiant.",
        );
      }
      if (projectsResult.status === "fulfilled" && projectsResult.value) {
        setProjects(projectsResult.value.projects);
        setProjectStats(projectsResult.value.stats);
        setProjectsLoaded(true);
      } else if (projectsResult.status === "fulfilled") {
        setProjects([]);
        setProjectStats(null);
        setProjectsLoaded(true);
      } else {
        setCatalogError(
          projectsResult.reason instanceof Error
            ? projectsResult.reason.message
            : "Le catalogue est momentanément indisponible.",
        );
        setProjectsLoaded(true);
      }
    } catch (error) {
      setSessionError(
        error instanceof Error
          ? error.message
          : "Impossible de vérifier votre session. Veuillez réessayer.",
      );
    }
    finally { setIsLoading(false); }
  }, [initialSection, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const userId = user?.id;
  useEffect(() => {
    if (userId === undefined || !projectsLoaded) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setFavoritesLoaded(false);
      setFavoritesError("");
      void (async () => {
        const storageKey = `investguinee:student:${userId}:favorites`;
        const migrationKey = `${storageKey}:server-migrated`;
        let legacyIds: number[] = [];
        let migrationDone = false;
        let legacyWarning = "";

        try {
          migrationDone = window.localStorage.getItem(migrationKey) === "true";
          if (!migrationDone) {
            const savedFavorites = window.localStorage.getItem(storageKey);
            if (savedFavorites !== null) {
              const parsed: unknown = JSON.parse(savedFavorites);
              if (
                !Array.isArray(parsed) ||
                !parsed.every(
                  (id: unknown) =>
                    typeof id === "number" && Number.isSafeInteger(id) && id > 0,
                )
              ) {
                legacyWarning = "Les anciens favoris de cet appareil sont invalides.";
              } else {
                legacyIds = parsed;
              }
            }
          }
        } catch (error) {
          legacyWarning =
            error instanceof Error
              ? "Les anciens favoris de cet appareil n’ont pas pu être lus."
              : "Impossible de lire les anciens favoris de cet appareil.";
        }
        try {
          const serverIds = await getStudentFavoriteIds();
          let nextIds = serverIds;
          if (!migrationDone && !catalogError) {
            nextIds = [...new Set([...serverIds, ...legacyIds])];
            if (nextIds.length !== serverIds.length) {
              const migration = await updateStudentFavoriteIds(nextIds);
              nextIds = migration.projectIds;
              if (migration.unavailableProjectIds.length) {
                legacyWarning = "Certains anciens favoris ne sont plus disponibles et n’ont pas été transférés.";
              }
            }
            try {
              window.localStorage.setItem(migrationKey, "true");
            } catch {
              legacyWarning = "Vos favoris sont chargés depuis votre compte, mais la migration locale ne peut pas être mémorisée.";
            }
          }
          if (cancelled) return;
          setFavoriteIds(nextIds);
          setFavoritesError(legacyWarning);
          setFavoritesLoaded(true);
        } catch (error) {
          if (cancelled) return;
          setFavoriteIds([]);
          setFavoritesError(
            error instanceof Error
              ? error.message
              : "Impossible de charger vos projets favoris.",
          );
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [catalogError, projects, projectsLoaded, userId]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await postAuthRequest("logout/", {});
      router.replace("/connexion");
      router.refresh();
    } catch (error) {
      setSessionError(
        error instanceof Error ? error.message : "La déconnexion n’a pas abouti.",
      );
      setIsLoggingOut(false);
    }
  };

  const handleNavigation = (id: string) => {
    setActiveNav(id);
    setSidebarOpen(false);
    if (id === "tableau-de-bord") {
      if (initialSection !== "dashboard") {
        router.push("/espace-etudiant");
        return;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (id === "projets") {
      router.push("/espace-etudiant/projets");
      return;
    }
    if (id === "formations") {
      router.push("/espace-etudiant/formations");
      return;
    }
    if (id === "defis") {
      router.push("/espace-etudiant/defis");
      return;
    }
    if (id === "favoris") {
      router.push("/espace-etudiant/favoris");
      return;
    }
    if (id === "notifications") {
      router.push("/espace-etudiant/notifications");
      return;
    }
    if (id === "idee") {
      router.push("/espace-etudiant/idee");
      return;
    }
    if (id === "mentorat") {
      router.push("/espace-etudiant/mentorat");
      return;
    }
    if (id === "communaute") {
      router.push("/espace-etudiant/communaute");
      return;
    }
    if (id === "profil") {
      router.push("/espace-etudiant/profil");
      return;
    }
    if (id === "parametres") {
      router.push("/espace-etudiant/parametres");
    }
  };

  const handleProfileSave = async (profile: StudentProfile) => {
    const savedProfile = await updateStudentProfile(profile);
    setStudentProfile(savedProfile);
    return savedProfile;
  };

  if (isLoading) {
    return (
      <div className="sd-loading">
        <span className="sd-loading__spinner" />
        <p>Vérification de votre session…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="sd-loading" role="alert">
        <p>{sessionError || "Vérification de votre session…"}</p>
        {sessionError && <button type="button" className="sd-btn sd-btn--green" onClick={() => void load()}>Réessayer</button>}
      </div>
    );
  }

  const firstName = user.firstName || user.fullName.split(" ")[0] || "Étudiant(e)";
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "E";
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("fr");
  const matchesQuery = (value: string) => value.toLocaleLowerCase("fr").includes(normalizedQuery);
  const visibleProjects = projects.filter((project) =>
    matchesQuery(`${project.title} ${project.sectors.join(" ")} ${project.location} ${project.region}`),
  );
  const recentProjects = [...visibleProjects]
    .sort((first, second) => second.publishedAt.localeCompare(first.publishedAt))
    .slice(0, 3);
  const visibleFavoriteProjects = visibleProjects.filter((project) =>
    favoriteIds.includes(project.id),
  );
  const profileSteps = [
    { label: "Nom complet", done: Boolean(user.fullName.trim()) },
    { label: "Adresse email", done: Boolean(user.email.trim()) },
    { label: "Établissement", done: Boolean(studentProfile?.institution.trim()) },
    { label: "Domaine d’études", done: Boolean(studentProfile?.studyField.trim()) },
  ];
  const profileCompletion = studentProfile
    ? Math.round(
        (profileSteps.filter((step) => step.done).length / profileSteps.length) * 100,
      )
    : null;
  const dashboardStats = [
    { label: "Projets publiés", value: catalogError ? "—" : String(projects.length), note: catalogError ? "Catalogue momentanément indisponible" : "Dans le catalogue InvestGuinée", icon: BriefcaseBusiness, color: "#2468B4", background: "#EBF4FF" },
    { label: "Mes favoris", value: favoritesLoaded ? String(favoriteIds.length) : "—", note: favoritesLoaded ? "Enregistrés sur votre compte" : "Chargement de vos favoris", icon: Heart, color: "#7C3AED", background: "#F3F0FF" },
    { label: "Profil complété", value: profileCompletion === null ? "—" : `${profileCompletion} %`, note: profileError ? "Profil momentanément indisponible" : "Nom, email, établissement et domaine", icon: GraduationCap, color: "#008F63", background: "#D0F8E9" },
    { label: "Compte vérifié", value: user.isVerified ? "Oui" : "Non", note: user.isVerified ? "Votre adresse est vérifiée" : "Vérifiez votre adresse email", icon: Check, color: user.isVerified ? "#008F63" : "#D97706", background: user.isVerified ? "#D0F8E9" : "#FEF3C7" },
  ];
  const selectedProject = projectSlug
    ? projects.find((project) => project.slug === projectSlug)
    : undefined;

  const toggleFavorite = async (id: number): Promise<boolean> => {
    if (!favoritesLoaded || favoritesSaving) return false;
    const previousFavorites = favoriteIds;
    const isFavorite = previousFavorites.includes(id);
    const nextFavorites = isFavorite
      ? previousFavorites.filter((favoriteId) => favoriteId !== id)
      : [...previousFavorites, id];
    setFavoriteIds(nextFavorites);
    setFavoritesSaving(true);
    try {
      const update = await updateStudentFavoriteIds(nextFavorites);
      if (update.unavailableProjectIds.length) {
        throw new Error("Un projet n’est plus disponible et n’a pas été enregistré dans vos favoris.");
      }
      setFavoriteIds(update.projectIds);
      setFavoritesError("");
      try {
        window.localStorage.setItem(
          `investguinee:student:${user.id}:favorites`,
          JSON.stringify(update.projectIds),
        );
        window.localStorage.setItem(
          `investguinee:student:${user.id}:favorites:server-migrated`,
          "true",
        );
      } catch {
        setFavoritesError(
          "Vos favoris sont enregistrés sur votre compte, mais la copie de cet appareil n’a pas pu être mise à jour.",
        );
      }
      return true;
    } catch (error) {
      setFavoriteIds(previousFavorites);
      setFavoritesError(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer vos projets favoris.",
      );
      return false;
    } finally {
      setFavoritesSaving(false);
    }
  };

  return (
    <div className="sd-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sd-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ═══════════════════════════════
          SIDEBAR
      ═══════════════════════════════ */}
      <aside className={`sd-sidebar${sidebarOpen ? " sd-sidebar--open" : ""}`}>
        <Link className="sd-sidebar__brand" href="/">
          <span className="sd-sidebar__flag" aria-hidden="true">
            <i className="sd-sidebar__stripe sd-sidebar__stripe--red" />
            <i className="sd-sidebar__stripe sd-sidebar__stripe--yellow" />
            <i className="sd-sidebar__stripe sd-sidebar__stripe--green" />
          </span>
          <span className="sd-sidebar__brand-text">
            <strong>InvestGuinée</strong>
            <small>Innover · Financer · Bâtir la Guinée</small>
          </span>
        </Link>

        <nav className="sd-sidebar__nav" aria-label="Navigation étudiant">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sd-sidebar__nav-item${activeNav === item.id ? " sd-sidebar__nav-item--active" : ""}`}
              onClick={() => handleNavigation(item.id)}
              aria-current={activeNav === item.id ? "page" : undefined}
            >
              <item.icon className="sd-sidebar__nav-icon" size={17} aria-hidden="true" />
              <span className="sd-sidebar__nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="sd-sidebar__badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sd-sidebar__city" role="img" aria-label="Vue panoramique de Conakry">
          <Image src="/cta_banner_bg.png" alt="" fill sizes="276px" />
          <span className="sd-sidebar__city-overlay" />
          <span className="sd-sidebar__city-text">Ensemble pour une<br /><strong>Guinée prospère</strong></span>
        </div>
      </aside>

      {/* ═══════════════════════════════
          MAIN
      ═══════════════════════════════ */}
      <div className="sd-main">
        {/* Topbar */}
        <header className="sd-topbar">
          <button
            type="button"
            className="sd-topbar__menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menu"
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="sd-topbar__search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              placeholder="Rechercher un projet..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Rechercher un projet"
            />
            {searchQuery && (
              <button type="button" className="sd-topbar__clear" aria-label="Effacer la recherche" onClick={() => setSearchQuery("")}>
                <X size={15} />
              </button>
            )}
          </div>
          <div className="sd-topbar__actions">
            <div className="sd-topbar__popover-wrap">
              <button
                type="button"
                className="sd-topbar__icon-btn"
                aria-label="Notifications"
                aria-current={initialSection === "notifications" ? "page" : undefined}
                onClick={() => {
                  setAccountOpen(false);
                  router.push("/espace-etudiant/notifications");
                }}
              >
                <Bell size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="sd-topbar__popover-wrap">
              <button
                type="button"
                className="sd-topbar__user"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <span className="sd-topbar__avatar">{initials}</span>
                <span className="sd-topbar__user-info">
                  <strong>{user.fullName}</strong>
                  <small>Étudiante</small>
                </span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              {accountOpen && (
                <div className="sd-popover sd-account-popover">
                  <Link href="/espace-etudiant/profil" onClick={() => setAccountOpen(false)}>
                    <CircleUserRound size={15} /> Mon profil
                  </Link>
                  <button type="button" onClick={() => void handleLogout()} disabled={isLoggingOut}>
                    <LogOut size={15} /> {isLoggingOut ? "Déconnexion…" : "Se déconnecter"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="sd-content">
          {sessionError && <p className="student-workspace__message student-workspace__message--error" role="alert">{sessionError}</p>}
          {catalogError && (
            <p className="student-workspace__message student-workspace__message--error" role="alert">
              {catalogError} <button type="button" onClick={() => void load()}>Réessayer</button>
            </p>
          )}
          {profileError && initialSection !== "profile" && (
            <p className="student-workspace__message student-workspace__message--error" role="alert">
              {profileError} <button type="button" onClick={() => void load()}>Réessayer</button>
            </p>
          )}
          {favoritesError && (
            <p className="student-workspace__message student-workspace__message--error" role="alert">
              {favoritesError}{" "}
              <button type="button" onClick={() => void load()}>Réessayer</button>
            </p>
          )}

          {initialSection === "settings" ? (
            <StudentSettingsWorkspace
              user={user}
              isLoggingOut={isLoggingOut}
              onLogout={() => void handleLogout()}
            />
          ) : initialSection === "profile" ? (
            <StudentProfileWorkspace
              key={studentProfile ? `${studentProfile.institution}\u0000${studentProfile.studyField}` : "unavailable"}
              user={user}
              profile={studentProfile}
              loadError={profileError}
              onRetry={() => void load()}
              onSave={handleProfileSave}
            />
          ) : initialSection === "notifications" ? (
            <StudentNotificationsWorkspace />
          ) : initialSection === "favorites" ? (
            <section className="student-favorites-view" aria-labelledby="student-favorites-heading">
              <header className="student-favorites-hero">
                <div className="student-favorites-hero__copy">
                  <span>VOTRE ESPACE ÉTUDIANT</span>
                  <h1 id="student-favorites-heading">Mes projets favoris</h1>
                  <p>
                    Retrouvez ici les projets que vous avez enregistrés pour les
                    consulter à tout moment.
                  </p>
                </div>
                <span className="student-favorites-hero__icon" aria-hidden="true">
                  <Heart size={36} />
                </span>
              </header>

              <div className="student-favorites-summary">
                <span className="student-favorites-summary__icon" aria-hidden="true">
                  <Heart size={18} />
                </span>
                <div>
                  <strong>{favoritesLoaded ? favoriteIds.length : "—"}</strong>
                  <span>{favoriteIds.length > 1 ? "projets enregistrés" : "projet enregistré"}</span>
                </div>
                <p>Vos favoris sont associés à votre compte étudiant et disponibles sur vos appareils.</p>
              </div>

              {favoritesLoaded ? (
                favoriteIds.length > 0 ? (
                  <div className="student-favorites-catalog">
                    <ProjectExplorer
                      projects={projects.filter((project) => favoriteIds.includes(project.id))}
                      stats={projectStats}
                      loadError={catalogError}
                      favoriteProjectIds={favoriteIds}
                      onToggleFavorite={(project) => toggleFavorite(project.id)}
                      projectHrefBase="/espace-etudiant/projets"
                      showFooter={false}
                      showHero={false}
                      favoritesDisabled={!favoritesLoaded || favoritesSaving}
                      resultsEyebrow="VOTRE SÉLECTION"
                      resultsTitle="Projets enregistrés"
                    />
                  </div>
                ) : (
                  <div className="student-favorites-empty">
                    <span className="student-favorites-empty__icon" aria-hidden="true">
                      <Heart size={25} />
                    </span>
                    <span className="student-favorites-empty__eyebrow">VOTRE SÉLECTION</span>
                    <h2>Vous n’avez pas encore de favoris.</h2>
                    <p>
                      Parcourez les projets et touchez le cœur d’un projet pour
                      le retrouver ici.
                    </p>
                    <Link className="sd-btn sd-btn--green" href="/espace-etudiant/projets">
                      Découvrir les projets <ArrowRight size={15} />
                    </Link>
                  </div>
                )
              ) : (
                <p className="student-favorites-loading" role="status">Chargement de vos favoris…</p>
              )}
            </section>
          ) : initialSection === "communaute" ? (
            <StudentCommunityWorkspace />
          ) : initialSection === "mentorat" ? (
            <StudentMentorshipWorkspace />
          ) : initialSection === "idea" ? (
            <StudentIdeaWorkspace userId={user.id} />
          ) : initialSection === "challenges" ? (
            <StudentChallengeCatalog />
          ) : initialSection === "training" ? (
            <StudentTrainingCatalog />
          ) : initialSection === "projects" ? (
            <section className="student-projects-view" aria-labelledby="student-projects-heading">
              <div className="student-projects-view__heading">
                <span>VOTRE ESPACE ÉTUDIANT</span>
                <h1 id="student-projects-heading">Découvrir les projets</h1>
                <p>Explorez les initiatives publiées sur InvestGuinée, filtrez le catalogue et gardez vos projets favoris à portée de main.</p>
              </div>
              <ProjectExplorer
                projects={projects}
                stats={projectStats}
                loadError={catalogError}
                serverCatalog
                favoriteProjectIds={favoriteIds}
                onToggleFavorite={(project) => toggleFavorite(project.id)}
                projectHrefBase="/espace-etudiant/projets"
                showFooter={false}
                showHero={false}
                favoritesDisabled={!favoritesLoaded || favoritesSaving}
              />
            </section>
          ) : initialSection === "project" ? (
            <section className="student-project-detail" aria-labelledby="student-project-title">
              <Link className="student-project-detail__back" href="/espace-etudiant/projets">
                ← Retour aux projets
              </Link>
              {catalogError ? (
                <p className="student-workspace__message student-workspace__message--error" role="alert">{catalogError}</p>
              ) : selectedProject ? (
                <article className="student-project-detail__card">
                  <div className="student-project-detail__image">
                    <Image
                      src={selectedProject.images[0] ?? "/project_agriculture.png"}
                      alt={`Illustration du projet ${selectedProject.title}`}
                      fill
                      priority
                      sizes="(max-width: 800px) 100vw, 900px"
                    />
                  </div>
                  <div className="student-project-detail__content">
                    <div className="catalog-card__categories">
                      {selectedProject.sectors.map((sector) => (
                        <span className="catalog-chip catalog-chip--green" key={sector}>{sector}</span>
                      ))}
                    </div>
                    <h1 id="student-project-title">{selectedProject.title}</h1>
                    <p>{selectedProject.description}</p>
                    <div className="student-project-detail__facts">
                      <span>{selectedProject.location}, Guinée</span>
                      <span>{selectedProject.developmentStage}</span>
                      <span>{new Intl.NumberFormat("fr-FR").format(selectedProject.amountRequested)} GNF recherchés</span>
                    </div>
                    <section>
                      <h2>À propos de ce projet</h2>
                      <p>{selectedProject.summary}</p>
                    </section>
                    <p className="student-project-detail__owner">Porté par <strong>{selectedProject.owner}</strong></p>
                    <p className="student-project-detail__notice">Les informations sont publiées par le porteur du projet et ne constituent pas une offre d’investissement.</p>
                  </div>
                </article>
              ) : (
                <div className="sd-card" role="status">
                  <h1 id="student-project-title">Projet introuvable</h1>
                  <p>Ce projet n’est plus disponible dans le catalogue.</p>
                </div>
              )}
            </section>
          ) : (
            <>
          {/* ── Hero banner ── */}
          <section className="sd-hero" aria-label="Bienvenue">
            <div className="sd-hero__left">
              <h1 className="sd-hero__title">Bonjour {firstName} !</h1>
              <p className="sd-hero__sub">Faites grandir vos idées et préparez votre avenir entrepreneurial.</p>
            </div>
            <div className="sd-hero__profile-card">
              <GraduationCap className="sd-hero__profile-icon" size={29} aria-hidden="true" />
              <div>
                <p className="sd-hero__profile-label">Profil étudiant</p>
                <div className="sd-hero__verified-row">
                  <span className="sd-hero__check" aria-hidden="true">
                    {user.isVerified ? <Check size={12} /> : <X size={12} />}
                  </span>
                  <span className="sd-hero__check-label">
                    {user.isVerified ? "Compte vérifié" : "Email à vérifier"}
                  </span>
                </div>
                <Link href="/espace-etudiant/profil" className="sd-hero__profile-link">
                  Voir mon profil <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>

          {/* ── KPI strip ── */}
          <section className="sd-kpis" aria-label="Indicateurs">
            {dashboardStats.map((stat) => (
              <article className="sd-kpi" key={stat.label}>
                <span className="sd-kpi__icon" style={{ background: stat.background, color: stat.color }}>
                  <stat.icon size={22} aria-hidden="true" />
                </span>
                <div>
                  <p className="sd-kpi__label">{stat.label}</p>
                  <strong className="sd-kpi__value" style={{ color: stat.color }}>{stat.value}</strong>
                  <p className="sd-kpi__note">{stat.note}</p>
                </div>
              </article>
            ))}
          </section>

          {/* ── Two-column grid ── */}
          <div className="sd-grid">
            {/* LEFT */}
            <div className="sd-grid__left">

              {/* Complétion du profil */}
              <section className="sd-card" id="sd-journey">
                <div className="sd-card__header">
                  <div className="sd-card__title-group">
                    <GraduationCap size={17} aria-hidden="true" />
                    <h2 className="sd-card__title">Complétion de mon profil</h2>
                  </div>
                  <Link href="/espace-etudiant/profil" className="sd-link-more">Voir mon profil <ArrowRight size={14} /></Link>
                </div>
                {studentProfile ? (
                  <>
                    <div className="sd-journey__bar-row">
                      <div className="sd-journey__bar">
                        <div className="sd-journey__bar-fill" style={{ width: `${profileCompletion}%` }} />
                      </div>
                      <span className="sd-journey__pct">{profileCompletion} %</span>
                    </div>
                    <div className="sd-journey__steps">
                      {profileSteps.map((step, index) => (
                        <div key={step.label} className={`sd-journey__step${step.done ? " sd-journey__step--done" : ""}`}>
                          <div className="sd-journey__step-dot">
                            {step.done ? "✓" : index + 1}
                            {index < profileSteps.length - 1 && (
                              <div className={`sd-journey__connector${step.done ? " sd-journey__connector--done" : ""}`} />
                            )}
                          </div>
                          <span className="sd-journey__step-label">{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="sd-empty" role={profileError ? "alert" : "status"}>
                    {profileError || "Chargement des informations de votre profil…"}
                  </p>
                )}
              </section>

              {/* Formation */}
              <section className="sd-card" id="sd-course">
                <div className="sd-card__header">
                  <div className="sd-card__title-group">
                    <span className="sd-play-icon" aria-hidden="true"><BookOpen size={13} /></span>
                    <h2 className="sd-card__title">Mes formations</h2>
                  </div>
                </div>
                <p className="sd-empty">
                  Le suivi des inscriptions et de la progression des formations n’est pas encore disponible.
                </p>
                <Link href="/espace-etudiant/formations" className="sd-btn sd-btn--green">
                  Voir les ressources <ArrowRight size={15} />
                </Link>
              </section>

              {/* Activités récentes */}
              <section className="sd-card">
                <div className="sd-card__header">
                  <div className="sd-card__title-group">
                    <Activity size={17} aria-hidden="true" />
                    <h2 className="sd-card__title">Activités récentes</h2>
                  </div>
                </div>
                <p className="sd-empty">
                  L’historique de vos activités n’est pas encore disponible.
                </p>
              </section>
            </div>

            {/* RIGHT */}
            <div className="sd-grid__right">

              {/* Projets récents */}
              <section className="sd-card">
                <div className="sd-card__header">
                  <div className="sd-card__title-group">
                    <Compass size={17} aria-hidden="true" />
                    <h2 className="sd-card__title">Projets récemment publiés</h2>
                  </div>
                  <Link href="/espace-etudiant/projets" className="sd-link-more">Voir tout <ArrowRight size={14} /></Link>
                </div>
                <ul className="sd-recs">
                  {recentProjects.map((project) => (
                    <li key={project.id} className="sd-rec">
                      <span className="sd-rec__img">
                        <Image src={project.images[0] ?? "/project_agriculture.png"} alt="" fill sizes="52px" />
                      </span>
                      <div className="sd-rec__body">
                        <Link className="sd-rec__title" href={`/espace-etudiant/projets/${project.slug}`}>
                          {project.title}
                        </Link>
                        <div className="sd-rec__meta">
                          <span className="sd-rec__tag" style={{ background: "#EBF4FF", color: "#2468B4" }}>
                            {project.sectors[0] ?? "Projet"}
                          </span>
                          <span className="sd-rec__date">{project.location}, {project.region}</span>
                        </div>
                      </div>
                      <Link className="sd-btn sd-btn--sm sd-btn--outline" href={`/espace-etudiant/projets/${project.slug}`}>
                        Voir
                      </Link>
                    </li>
                  ))}
                </ul>
                {recentProjects.length === 0 && (
                  <p className="sd-empty">
                    {catalogError
                      ? "Le catalogue n’est pas disponible pour le moment."
                      : searchQuery
                        ? "Aucun projet ne correspond à cette recherche."
                        : "Aucun projet publié pour le moment."}
                  </p>
                )}
              </section>

              {/* Favoris */}
              <section className="sd-card" id="sd-projects">
                <div className="sd-card__header">
                  <div className="sd-card__title-group">
                    <Heart size={17} aria-hidden="true" />
                    <h2 className="sd-card__title">Mes projets favoris</h2>
                  </div>
                  <div className="sd-projects__actions">
                    <Link href="/espace-etudiant/favoris" className="sd-link-more">Voir tout <ArrowRight size={14} /></Link>
                  </div>
                </div>
                <ul className="sd-inspiring">
                  {visibleFavoriteProjects.map((project) => (
                    <li key={project.id} className="sd-inspiring__item">
                      <span className="sd-inspiring__img">
                        <Image src={project.images[0] ?? "/project_agriculture.png"} alt="" fill sizes="38px" />
                      </span>
                      <Link className="sd-inspiring__title" href={`/espace-etudiant/projets/${project.slug}`}>
                        {project.title}
                      </Link>
                      <span className="sd-inspiring__sector">{project.sectors[0] ?? "Projet"} · {project.location}</span>
                      <button
                        type="button"
                        className="sd-inspiring__heart sd-inspiring__heart--active"
                        aria-label={`Retirer ${project.title} des favoris`}
                        aria-pressed="true"
                        disabled={!favoritesLoaded || favoritesSaving}
                        onClick={() => void toggleFavorite(project.id)}
                      >
                        <Heart size={18} fill="currentColor" />
                      </button>
                    </li>
                  ))}
                </ul>
                {!favoritesLoaded ? (
                  <p className="sd-empty" role="status">Chargement de vos favoris…</p>
                ) : catalogError ? (
                  <p className="sd-empty">Le catalogue est indisponible ; vos favoris ne peuvent pas être affichés.</p>
                ) : visibleFavoriteProjects.length === 0 ? (
                  <p className="sd-empty">
                    {searchQuery && favoriteIds.length > 0
                      ? "Aucun favori ne correspond à cette recherche."
                      : favoriteIds.length > 0
                        ? "Vos projets favoris ne sont plus présents dans le catalogue."
                        : "Vous n’avez pas encore de projets favoris."}
                  </p>
                ) : null}
              </section>

              {/* CTA banner */}
              <section className="sd-cta-card">
                <Image className="sd-cta-card__image" src="/cta_banner_bg.png" alt="Conakry au coucher du soleil" fill sizes="(max-width: 768px) 100vw, 420px" />
                <span className="sd-cta-card__overlay" />
                <div className="sd-cta-card__content">
                  <h3 className="sd-cta-card__title">Une idée peut changer la Guinée.</h3>
                  <p className="sd-cta-card__sub">Apprenez, échangez et passez à l’action.</p>
                  <button type="button" className="sd-btn sd-btn--green" onClick={() => handleNavigation("idee")}>
                    Présenter mon idée <ArrowRight size={15} />
                  </button>
                </div>
                <div className="sd-cta-card__deco" aria-hidden="true"><span /><span /><span /></div>
              </section>
            </div>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Logout FAB */}
      <button
        type="button"
        className="sd-logout-fab"
        onClick={() => void handleLogout()}
        disabled={isLoggingOut}
        aria-label="Se déconnecter"
        title="Se déconnecter"
      >
        {isLoggingOut ? "…" : <LogOut size={17} />}
      </button>

    </div>
  );
}
