"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { CatalogProject } from "../../data/project-catalog";
import { postAuthRequest } from "../../lib/auth-api";
import { getPublicProjects } from "../../lib/public-project-api";
import { getCurrentUser, type AuthenticatedUser } from "../../lib/session-api";
import ProjectIcon from "../projects/ProjectIcon";
import ProjectCard from "../projects/ProjectCard";
import { investorSections, type InvestorSection } from "./investor-sections";

const chartPeriods = {
  "7": {
    labels: ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."],
    visits: [18, 30, 25, 45, 37, 57, 48],
    interactions: [8, 14, 11, 23, 18, 31, 26],
  },
  "30": {
    labels: ["S1", "S2", "S3", "S4", "S5", "S6", "S7"],
    visits: [22, 38, 31, 53, 42, 67, 59],
    interactions: [9, 17, 15, 27, 21, 37, 30],
  },
  "90": {
    labels: ["Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc.", "Janv."],
    visits: [25, 36, 32, 54, 46, 70, 61],
    interactions: [11, 18, 16, 29, 23, 39, 33],
  },
  "180": {
    labels: ["Août", "Sept.", "Oct.", "Nov.", "Déc.", "Janv.", "Févr."],
    visits: [19, 34, 29, 50, 44, 66, 60],
    interactions: [8, 16, 13, 26, 22, 36, 32],
  },
  "365": {
    labels: ["Mars", "Mai", "Juil.", "Sept.", "Nov.", "Janv.", "Mars"],
    visits: [16, 29, 35, 48, 44, 64, 72],
    interactions: [7, 13, 17, 24, 21, 35, 40],
  },
} as const;

function DashboardIcon({
  name,
  size = 19,
}: {
  name: "bell" | "briefcase" | "chart" | "clock" | "home" | "logout" | "mail" | "menu" | "user";
  size?: number;
}) {
  const paths = {
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1Z" /></>,
    logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function getInitials(user: AuthenticatedUser) {
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() || "IG";
}

export default function InvestorDashboard({
  initialSection = "dashboard",
}: {
  initialSection?: InvestorSection;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [catalogProjects, setCatalogProjects] = useState<CatalogProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [favoriteNotice, setFavoriteNotice] = useState("");
  const [chartPeriod, setChartPeriod] = useState<keyof typeof chartPeriods>("30");
  const section = initialSection;

  useEffect(() => {
    let active = true;
    getPublicProjects()
      .then((catalog) => {
        if (active) setCatalogProjects(catalog.projects);
      })
      .catch((error: unknown) => {
        if (active) {
          setProjectsError(error instanceof Error ? error.message : "Le catalogue est momentanément indisponible.");
        }
      })
      .finally(() => {
        if (active) setProjectsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace("/connexion?next=%2Fespace-investisseur");
        return;
      }
      if (currentUser.role !== "INVESTOR") {
        router.replace(
          currentUser.role === "STUDENT"
            ? "/etudiants"
            : currentUser.role === "ADMIN"
              ? "/"
              : "/",
        );
        return;
      }
      setUser(currentUser);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Impossible de charger votre espace. Veuillez réessayer.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSession(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSession]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("investguinee-investor-favorites");
        if (!stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (
          Array.isArray(parsed) &&
          parsed.every((id) => typeof id === "number")
        ) {
          setFavorites(parsed);
        }
      } catch {
        setFavoriteNotice("Les favoris enregistrés localement n’ont pas pu être lus.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError("");
    try {
      await postAuthRequest("logout/", {});
      router.replace("/connexion");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "La déconnexion n’a pas abouti. Veuillez réessayer.",
      );
      setIsLoggingOut(false);
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const search = query.trim();
    router.push(search ? `/projets?q=${encodeURIComponent(search)}` : "/projets");
  };

  const toggleFavorite = (projectId: number, title: string) => {
    const removing = favorites.includes(projectId);
    const updated = removing
      ? favorites.filter((id) => id !== projectId)
      : [...favorites, projectId];
    setFavorites(updated);
    try {
      window.localStorage.setItem(
        "investguinee-investor-favorites",
        JSON.stringify(updated),
      );
    } catch {
      setFavoriteNotice("Le navigateur n’a pas pu enregistrer vos favoris.");
      return;
    }
    setFavoriteNotice(
      `${title} ${removing ? "a été retiré" : "a été ajouté"} à vos favoris sur cet appareil.`,
    );
  };

  if (isLoading) {
    return (
      <main className="investor-dashboard-state" aria-live="polite">
        <span className="investor-dashboard-state__spinner" />
        <p>Vérification de votre session…</p>
      </main>
    );
  }

  if (loadError || !user) {
    return (
      <main className="investor-dashboard-state">
        <DashboardIcon name="briefcase" size={30} />
        <h1>Votre espace investisseur</h1>
        <p role="alert">{loadError || "La session n’a pas pu être vérifiée."}</p>
        <button type="button" onClick={() => void loadSession()}>Réessayer</button>
        <Link href="/connexion">Retour à la connexion</Link>
      </main>
    );
  }

  const firstName = user.firstName || user.fullName.split(" ")[0] || "Investisseur";
  const userInitials = getInitials(user);

  return (
    <div className="investor-dashboard">
      {mobileMenuOpen && (
        <button
          className="investor-dashboard__backdrop"
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside className={`investor-dashboard__sidebar${mobileMenuOpen ? " investor-dashboard__sidebar--open" : ""}`}>
        <Link className="investor-dashboard__brand" href="/espace-investisseur">
          <span className="investor-dashboard__flag" aria-hidden="true"><i /><i /><i /></span>
          <span>
            <strong>InvestGuinée</strong>
            <small>Innover · Financer · Bâtir la Guinée</small>
          </span>
        </Link>
        <p className="investor-dashboard__nav-label">ESPACE INVESTISSEUR</p>
        <nav className="investor-dashboard__nav" aria-label="Navigation de l’espace investisseur">
          {investorSections.map((item) => (
            <Link
              className={`investor-dashboard__nav-link${section === item.id ? " investor-dashboard__nav-link--active" : ""}`}
              href={item.id === "dashboard" ? "/espace-investisseur" : `/espace-investisseur/${item.id}`}
              aria-current={section === item.id ? "page" : undefined}
              key={item.id}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.icon === "search" ? (
                <ProjectIcon name="search" />
              ) : item.icon === "folder" ||
                item.icon === "handshake" ||
                item.icon === "calendar" ||
                item.icon === "heart" ? (
                <ProjectIcon name={item.icon} />
              ) : (
                <DashboardIcon name={item.icon} />
              )}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="investor-dashboard__sidebar-promo">
          <div className="investor-dashboard__sidebar-promo-image">
            <Image src="/conakry_hero.png" alt="" fill sizes="240px" />
          </div>
          <div className="investor-dashboard__sidebar-promo-copy">
            <strong>Ensemble pour une Guinée prospère</strong>
            <Link href="/projets">Voir les projets <ProjectIcon name="arrow" size={14} /></Link>
          </div>
        </div>
        <div className="investor-dashboard__sidebar-user">
          <span className="investor-dashboard__avatar">{userInitials}</span>
          <span><strong>{user.fullName}</strong><small>Investisseur</small></span>
          <button type="button" onClick={() => void handleLogout()} disabled={isLoggingOut} aria-label="Se déconnecter">
            <DashboardIcon name="logout" size={17} />
          </button>
        </div>
      </aside>

      <div className="investor-dashboard__main">
        <header className="investor-dashboard__header">
          <button
            className="investor-dashboard__menu-button"
            type="button"
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <DashboardIcon name="menu" size={21} />
          </button>
          <form className="investor-dashboard__search" onSubmit={submitSearch}>
            <ProjectIcon name="search" size={18} />
            <input
              aria-label="Rechercher un projet"
              placeholder="Rechercher un projet, une entreprise…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit">Rechercher</button>
          </form>
          <Link className="investor-dashboard__header-explore" href="/espace-investisseur/notifications">
            <DashboardIcon name="bell" size={17} /> Notifications
          </Link>
          <details className="investor-dashboard__account-menu">
            <summary className="investor-dashboard__header-profile">
              <span className="investor-dashboard__avatar">{userInitials}</span>
              <span><strong>{user.fullName}</strong><small>Investisseur</small></span>
            </summary>
            <div className="investor-dashboard__account-menu-items">
              <Link href="/espace-investisseur/profile">
                <DashboardIcon name="user" size={16} /> Profil & paramètres
              </Link>
              <button type="button" onClick={() => void handleLogout()} disabled={isLoggingOut}>
                <DashboardIcon name="logout" size={16} />
                {isLoggingOut ? "Déconnexion…" : "Se déconnecter"}
              </button>
            </div>
          </details>
        </header>

        <main className="investor-dashboard__content">
          {section !== "dashboard" && (
            <InvestorSectionContent
              section={section}
              user={user}
              catalogProjects={catalogProjects}
              projectsLoading={projectsLoading}
              projectsError={projectsError}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          )}
          {section === "dashboard" && (
          <>
          <section className="investor-dashboard__welcome">
            <div className="investor-dashboard__welcome-copy">
              <span className="investor-dashboard__eyebrow">Votre espace personnel</span>
              <h1>Bonjour {firstName},</h1>
              <p>Découvrez les opportunités, suivez vos démarches et développez vos projets en Guinée.</p>
              <Link href="/projets">Explorer les projets <ProjectIcon name="arrow" size={16} /></Link>
            </div>
            <section className="investor-dashboard__verification" id="verification" aria-labelledby="investor-verification-title">
              <span className={`investor-dashboard__verification-icon${user.isVerified ? " investor-dashboard__verification-icon--verified" : ""}`}>
                {user.isVerified ? "✓" : "!"}
              </span>
              <div>
                <h2 id="investor-verification-title">
                  {user.isVerified ? "Profil vérifié" : "Profil à vérifier"}
                </h2>
                <p>
                  {user.isVerified
                    ? "Votre identité a été vérifiée."
                    : "Complétez la vérification pour accéder aux prochaines fonctionnalités."}
                </p>
                <span>{user.isVerified ? "Investisseur vérifié" : "Vérification en attente"}</span>
              </div>
              <Link href="/espace-investisseur#verification">
                {user.isVerified ? "Voir le profil" : "Compléter le profil"}
                <ProjectIcon name="arrow" size={14} />
              </Link>
            </section>
          </section>

          <section className="investor-dashboard__stats" aria-label="Indicateurs de votre espace">
            {[
              { label: "Mes projets", icon: "folder" as const, detail: "Aucune donnée synchronisée", target: "projects" },
              { label: "Demandes d’accès", icon: "handshake" as const, detail: "Aucune donnée synchronisée", target: "requests" },
              { label: "Rendez-vous", icon: "calendar" as const, detail: "Aucune donnée synchronisée", target: "appointments" },
              { label: "Favoris", icon: "heart" as const, detail: "Enregistrés sur cet appareil", target: "favorites" },
            ].map((stat) => (
              <Link className="investor-dashboard__stat" key={stat.label} href={`/espace-investisseur/${stat.target}`}>
                <span className={`investor-dashboard__stat-icon investor-dashboard__stat-icon--${stat.icon}`}>
                  <ProjectIcon name={stat.icon} size={21} />
                </span>
                <div><span>{stat.label}</span><strong>{stat.label === "Favoris" ? favorites.length : "—"}</strong><small>{stat.detail}</small></div>
              </Link>
            ))}
          </section>

          {favoriteNotice && (
            <p className="investor-dashboard__notice" role="status">
              {favoriteNotice} Les favoris de cette session ne sont pas encore synchronisés à votre compte.
              <button type="button" onClick={() => setFavoriteNotice("")}>Fermer</button>
            </p>
          )}
          <div className="investor-dashboard__lower-grid">
            <section className="investor-dashboard__panel">
              <div className="investor-dashboard__panel-heading">
                <div><span>VOTRE ACTIVITÉ · EXEMPLE</span><h2>Vue d’ensemble</h2></div>
                <label className="investor-dashboard__period">
                  <span className="sr-only">Période du graphique</span>
                  <select value={chartPeriod} onChange={(event) => setChartPeriod(event.target.value as keyof typeof chartPeriods)}>
                    <option value="7">7 derniers jours</option>
                    <option value="30">30 derniers jours</option>
                    <option value="90">3 derniers mois</option>
                    <option value="180">6 derniers mois</option>
                    <option value="365">12 derniers mois</option>
                  </select>
                </label>
              </div>
              <p className="investor-dashboard__chart-disclaimer">Illustration uniquement : ces courbes ne représentent pas votre activité réelle.</p>
              <InvestorActivityChart period={chartPeriod} />
            </section>
            <section className="investor-dashboard__panel">
              <div className="investor-dashboard__panel-heading">
                <div><span>CATALOGUE PUBLIC</span><h2>Projets récents</h2></div>
                <Link href="/projets" aria-label="Explorer tous les projets">
                  <ProjectIcon name="arrow" size={17} />
                </Link>
              </div>
              <p className="investor-dashboard__demo-note">
                Sélection publique, indépendante de votre historique personnel.
              </p>
              <div className="investor-dashboard__recent-projects">
                {projectsLoading ? <p role="status">Chargement des projets publiés…</p> : projectsError ? (
                  <p role="alert">{projectsError}</p>
                ) : catalogProjects.length === 0 ? (
                  <p>Aucun projet n’est publié pour le moment.</p>
                ) : catalogProjects.slice(0, 3).map((project) => (
                  <Link
                    className="investor-dashboard__recent-project"
                    href={`/projets/${project.slug}`}
                    key={project.id}
                  >
                    <Image
                      src={project.images[0]}
                      alt=""
                      width={52}
                      height={52}
                      sizes="52px"
                    />
                    <span className="investor-dashboard__recent-project-copy">
                      <strong>{project.title}</strong>
                      <small>{project.sectors[0]} · {project.location}</small>
                      <small>
                        Publié le {new Intl.DateTimeFormat("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        }).format(new Date(`${project.publishedAt}T00:00:00Z`))}
                      </small>
                    </span>
                    <span className={`investor-dashboard__recent-project-status investor-dashboard__recent-project-status--${project.status === "Publié" ? "published" : "progress"}`}>
                      {project.status}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="investor-dashboard__bottom-grid">
            <section className="investor-dashboard__panel">
              <div className="investor-dashboard__panel-heading">
                <div><span>VOTRE PARCOURS</span><h2>Activités récentes</h2></div>
                <DashboardIcon name="clock" />
              </div>
              <div className="investor-dashboard__empty">
                <DashboardIcon name="mail" size={26} />
                <p>Vous n’avez pas encore d’activité synchronisée sur votre espace.</p>
              </div>
            </section>
            <section className="investor-dashboard__promo">
              <div><span>INVESTGUINÉE</span><h2>Investir en Guinée, c’est construire l’avenir.</h2><p>Ensemble, faisons grandir les opportunités locales.</p></div>
              <Link href="/projets">Explorer les projets <ProjectIcon name="arrow" size={16} /></Link>
            </section>
          </div>
          </>
          )}
          {logoutError && <p className="investor-dashboard__error" role="alert">{logoutError}</p>}
        </main>
      </div>
    </div>
  );
}

function InvestorActivityChart({
  period,
}: {
  period: keyof typeof chartPeriods;
}) {
  const data = chartPeriods[period];
  const getPoints = (values: readonly number[]) =>
    values.map((value, index) => `${32 + index * 92},${174 - value * 1.65}`).join(" ");

  return (
    <div className="investor-dashboard__chart">
      <div className="investor-dashboard__chart-legend">
        <span><i className="investor-dashboard__chart-dot investor-dashboard__chart-dot--visits" /> Visites</span>
        <span><i className="investor-dashboard__chart-dot investor-dashboard__chart-dot--interactions" /> Interactions</span>
      </div>
      <svg viewBox="0 0 620 215" role="img" aria-label="Graphique illustratif des visites et interactions">
        {[30, 70, 110, 150, 190].map((y) => (
          <line key={y} x1="30" x2="584" y1={y} y2={y} className="investor-dashboard__chart-grid" />
        ))}
        <polyline points={getPoints(data.visits)} className="investor-dashboard__chart-line investor-dashboard__chart-line--visits" />
        <polyline points={getPoints(data.interactions)} className="investor-dashboard__chart-line investor-dashboard__chart-line--interactions" />
        {data.visits.map((value, index) => {
          const x = 32 + index * 92;
          const visitsY = 174 - value * 1.65;
          const interactionsY = 174 - data.interactions[index] * 1.65;
          return (
            <g key={`${data.labels[index]}-${index}`}>
              <circle cx={x} cy={visitsY} r="4" className="investor-dashboard__chart-point investor-dashboard__chart-point--visits">
                <title>{`${data.labels[index]} : ${value} visites (illustration)`}</title>
              </circle>
              <circle cx={x} cy={interactionsY} r="4" className="investor-dashboard__chart-point investor-dashboard__chart-point--interactions">
                <title>{`${data.labels[index]} : ${data.interactions[index]} interactions (illustration)`}</title>
              </circle>
              <text x={x} y="207" textAnchor="middle" className="investor-dashboard__chart-label">{data.labels[index]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function InvestorSectionContent({
  section,
  user,
  catalogProjects,
  projectsLoading,
  projectsError,
  favorites,
  onToggleFavorite,
}: {
  section: InvestorSection;
  user: AuthenticatedUser;
  catalogProjects: CatalogProject[];
  projectsLoading: boolean;
  projectsError: string;
  favorites: number[];
  onToggleFavorite: (projectId: number, title: string) => void;
}) {
  const sectionInfo = investorSections.find((item) => item.id === section);
  const [projectSearch, setProjectSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState("Tous les secteurs");
  const availableSectors = [...new Set(catalogProjects.flatMap((project) => project.sectors))];
  const favoriteProjects = catalogProjects.filter((project) => favorites.includes(project.id));
  const projects = (section === "favorites" ? favoriteProjects : catalogProjects).filter((project) => {
    const queryMatch = `${project.title} ${project.description} ${project.owner}`
      .toLocaleLowerCase("fr")
      .includes(projectSearch.trim().toLocaleLowerCase("fr"));
    const sectorMatch =
      selectedSector === "Tous les secteurs" || project.sectors.includes(selectedSector);
    return queryMatch && sectorMatch;
  });
  const publicCatalogSection = section === "explore" || section === "favorites";

  return (
    <section className="investor-workspace">
      <div className="investor-workspace__heading">
        <div>
          <span>ESPACE INVESTISSEUR</span>
          <h1>{sectionInfo?.label ?? "Espace investisseur"}</h1>
          <p>
            {section === "dashboard"
              ? `Bienvenue ${user.firstName || user.fullName}.`
              : "Retrouvez ici les informations et outils associés à votre compte."}
          </p>
        </div>
        {section === "explore" && (
          <Link href="/projets">Ouvrir l’explorateur complet <ProjectIcon name="arrow" size={15} /></Link>
        )}
      </div>

      {publicCatalogSection ? (
        <>
          <p className="investor-workspace__notice">
            {section === "favorites"
              ? "Vos favoris sont conservés sur cet appareil. Ils ne sont pas encore synchronisés avec votre compte."
              : "Projets publiés par leurs porteurs; ces informations ne constituent pas une offre d’investissement."}
          </p>
          <div className="investor-workspace__filters">
            <label>
              <span>Rechercher</span>
              <input
                type="search"
                placeholder="Projet, entreprise…"
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
              />
            </label>
            <label>
              <span>Secteur</span>
              <select value={selectedSector} onChange={(event) => setSelectedSector(event.target.value)}>
                <option>Tous les secteurs</option>
                {availableSectors.map((sector) => (
                  <option key={sector}>{sector}</option>
                ))}
              </select>
            </label>
          </div>
          {projectsLoading ? (
            <p role="status">Chargement des projets publiés…</p>
          ) : projectsError ? (
            <p role="alert">{projectsError}</p>
          ) : projects.length ? (
            <div className="investor-dashboard__projects">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isFavorite={favorites.includes(project.id)}
                  onToggleFavorite={(selected) => onToggleFavorite(selected.id, selected.title)}
                />
              ))}
            </div>
          ) : (
            <div className="investor-workspace__empty">
              <ProjectIcon name={section === "favorites" ? "heart" : "search"} size={28} />
              <h2>{section === "favorites" ? "Aucun favori pour le moment" : "Aucun projet correspondant"}</h2>
              <p>{section === "favorites" ? "Ajoutez un projet au moyen du bouton cœur pour le retrouver ici." : "Modifiez les critères de recherche ou consultez tout le catalogue."}</p>
            </div>
          )}
        </>
      ) : section === "profile" ? (
        <div className="investor-workspace__profile">
          <div className="investor-workspace__profile-avatar">{`${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()}</div>
          <div><span>Nom complet</span><strong>{user.fullName}</strong></div>
          <div><span>Adresse email</span><strong>{user.email}</strong></div>
          <div><span>Type de compte</span><strong>Investisseur</strong></div>
          <div><span>Vérification</span><strong>{user.isVerified ? "Profil vérifié" : "Vérification à compléter"}</strong></div>
          <p>La modification du profil sera disponible lorsque l’API de profil sera intégrée.</p>
        </div>
      ) : section === "subscriptions" ? (
        <div className="investor-workspace__empty">
          <ProjectIcon name="folder" size={28} />
          <h2>Aucun abonnement enregistré</h2>
          <p>Les offres et l’historique d’abonnement ne sont pas encore reliés à votre compte. Aucun paiement n’a été effectué.</p>
        </div>
      ) : (
        <div className="investor-workspace__empty">
          {section === "notifications" ? (
            <DashboardIcon name="bell" size={28} />
          ) : (
            <ProjectIcon
              name={
                section === "projects" ? "folder" :
                section === "requests" ? "handshake" :
                section === "messages" ? "search" : "calendar"
              }
              size={28}
            />
          )}
          <h2>
            {section === "projects" ? "Aucun projet personnel synchronisé" :
              section === "requests" ? "Aucune demande d’accès synchronisée" :
              section === "messages" ? "Aucune conversation disponible" :
              section === "appointments" ? "Aucun rendez-vous synchronisé" :
              "Aucune notification disponible"}
          </h2>
          <p>Cette rubrique est prête à être connectée, mais aucune donnée métier n’est encore fournie par le backend.</p>
          {section === "projects" || section === "requests" ? (
            <Link href="/espace-investisseur/explore">Découvrir les projets <ProjectIcon name="arrow" size={15} /></Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
