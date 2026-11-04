"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { CatalogProject } from "../../data/project-catalog";
import { postAuthRequest } from "../../lib/auth-api";
import { getPublicProjects } from "../../lib/public-project-api";
import { getInvestorAccessRequests } from "../../lib/investor-access-api";
import {
  getAppointmentCatalog,
} from "../../lib/appointment-api";
import { getConversations } from "../../lib/messaging-api";
import { getNotifications, type NotificationRecord } from "../../lib/notification-api";
import { getCurrentUser, type AuthenticatedUser } from "../../lib/session-api";
import type { InvestorProfile } from "../../lib/investor-profile-api";
import ProjectIcon from "../projects/ProjectIcon";
import ProjectExplorer from "../projects/ProjectExplorer";
import InvestorAccessRequests from "./InvestorAccessRequests";
import InvestorProjects from "./InvestorProjects";
import AppointmentManagement from "../appointments/AppointmentManagement";
import ConversationWorkspace from "../messaging/ConversationWorkspace";
import NotificationInbox from "../notifications/NotificationInbox";
import InvestorProfileWorkspace from "./InvestorProfileWorkspace";
import InvestorSubscriptionsWorkspace from "./InvestorSubscriptionsWorkspace";
import { investorSections, type InvestorSection } from "./investor-sections";

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

function formatActivityDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
      }).format(date);
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
  const [accessRequestCount, setAccessRequestCount] = useState<number | null>(null);
  const [accessRequestCountLoading, setAccessRequestCountLoading] = useState(true);
  const [accessRequestCountError, setAccessRequestCountError] = useState("");
  const [appointmentCount, setAppointmentCount] = useState<number | null>(null);
  const [appointmentCountError, setAppointmentCountError] = useState("");
  const [appointmentCountLoading, setAppointmentCountLoading] = useState(true);
  const [conversationCount, setConversationCount] = useState<number | null>(null);
  const [conversationCountError, setConversationCountError] = useState("");
  const [conversationCountLoading, setConversationCountLoading] = useState(true);
  const [recentNotifications, setRecentNotifications] = useState<NotificationRecord[]>([]);
  const [activityError, setActivityError] = useState("");
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityRetry, setActivityRetry] = useState(0);
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
    if (!user) return;
    const controller = new AbortController();
    void getInvestorAccessRequests(controller.signal)
      .then((catalog) => {
        if (!controller.signal.aborted) {
          setAccessRequestCount(catalog.pagination.totalResults);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setAccessRequestCountError(
            error instanceof Error
              ? error.message
              : "Impossible de charger le nombre de demandes.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setAccessRequestCountLoading(false);
      });
    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    void getConversations("investor", "", 1, 1, controller.signal)
      .then((catalog) => {
        if (!controller.signal.aborted) {
          setConversationCount(catalog.pagination.totalResults);
          setConversationCountError("");
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setConversationCountError(
            error instanceof Error ? error.message : "Impossible de charger les conversations.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setConversationCountLoading(false);
      });
    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setActivityLoading(true);
      setActivityError("");
      void getNotifications("", "all", 1, 5, controller.signal)
        .then((catalog) => {
          if (!controller.signal.aborted) setRecentNotifications(catalog.notifications);
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setActivityError(
              error instanceof Error ? error.message : "Impossible de charger votre activité récente.",
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setActivityLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [activityRetry, user]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    void getAppointmentCatalog(
      "investor/appointments/",
      { query: "", status: "all", page: 1, pageSize: 1 },
      controller.signal,
    )
      .then((catalog) => {
        if (!controller.signal.aborted) {
          setAppointmentCount(catalog.pagination.totalResults);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setAppointmentCountError(
            error instanceof Error ? error.message : "Impossible de charger le nombre de rendez-vous.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setAppointmentCountLoading(false);
      });
    return () => controller.abort();
  }, [user]);

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
      return false;
    }
    setFavoriteNotice(
      `${title} ${removing ? "a été retiré" : "a été ajouté"} à vos favoris sur cet appareil.`,
    );
    return true;
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
              onProfileSaved={(profile) =>
                setUser((current) =>
                  current
                    ? {
                        ...current,
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        fullName: profile.fullName,
                      }
                    : current,
                )
              }
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
              { label: "Conversations", icon: "mail" as const, value: conversationCountLoading ? "…" : conversationCount ?? "—", detail: conversationCountError ? "Synchronisation indisponible" : "Avec les porteurs de projets", target: "messages" },
              { label: "Demandes d’accès", icon: "handshake" as const, value: accessRequestCountLoading ? "…" : accessRequestCount ?? "—", detail: accessRequestCountError ? "Synchronisation indisponible" : "Demandes envoyées", target: "requests" },
              { label: "Rendez-vous", icon: "calendar" as const, value: appointmentCountLoading ? "…" : appointmentCount ?? "—", detail: appointmentCountError ? "Synchronisation indisponible" : "Demandes et réponses", target: "appointments" },
              { label: "Favoris", icon: "heart" as const, value: favorites.length, detail: "Enregistrés sur cet appareil", target: "favorites" },
            ].map((stat) => (
              <Link className="investor-dashboard__stat" key={stat.label} href={`/espace-investisseur/${stat.target}`}>
                <span className={`investor-dashboard__stat-icon investor-dashboard__stat-icon--${stat.icon}`}>
                  {stat.icon === "mail" ? (
                    <DashboardIcon name="mail" size={21} />
                  ) : (
                    <ProjectIcon name={stat.icon} size={21} />
                  )}
                </span>
                <div><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></div>
              </Link>
            ))}
          </section>

          {accessRequestCountError && (
            <p className="investor-dashboard__notice" role="alert">
              {accessRequestCountError}
            </p>
          )}
          {appointmentCountError && (
            <p className="investor-dashboard__notice" role="alert">
              {appointmentCountError}
            </p>
          )}
          {conversationCountError && (
            <p className="investor-dashboard__notice" role="alert">
              {conversationCountError}
            </p>
          )}
          {favoriteNotice && (
            <p className="investor-dashboard__notice" role="status">
              {favoriteNotice} Les favoris de cette session ne sont pas encore synchronisés à votre compte.
              <button type="button" onClick={() => setFavoriteNotice("")}>Fermer</button>
            </p>
          )}
          <div className="investor-dashboard__lower-grid">
            <section className="investor-dashboard__panel">
              <div className="investor-dashboard__panel-heading">
                <div><span>VOTRE ACTIVITÉ</span><h2>Activité récente</h2></div>
                <Link className="investor-dashboard__activity-link" href="/espace-investisseur/notifications">Tout voir <ProjectIcon name="arrow" size={15} /></Link>
              </div>
              <div className="investor-dashboard__activity-list" aria-busy={activityLoading}>
                {activityLoading ? (
                  <p role="status">Chargement de votre activité récente…</p>
                ) : activityError ? (
                  <div className="investor-dashboard__activity-state" role="alert">
                    <p>{activityError}</p>
                    <button type="button" onClick={() => setActivityRetry((count) => count + 1)}>Réessayer</button>
                  </div>
                ) : recentNotifications.length ? (
                  recentNotifications.map((notification) => (
                    <Link
                      className={`investor-dashboard__activity-item${notification.readAt ? "" : " investor-dashboard__activity-item--unread"}`}
                      href={notification.targetUrl || "/espace-investisseur/notifications"}
                      key={notification.id}
                    >
                      <span className="investor-dashboard__activity-dot" aria-hidden="true" />
                      <span><strong>{notification.title}</strong><small>{notification.body}</small></span>
                      <time dateTime={notification.createdAt}>{formatActivityDate(notification.createdAt)}</time>
                    </Link>
                  ))
                ) : (
                  <div className="investor-dashboard__activity-state">
                    <DashboardIcon name="clock" size={25} />
                    <p>Aucune activité récente pour le moment.</p>
                  </div>
                )}
              </div>
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

function InvestorSectionContent({
  section,
  user,
  onProfileSaved,
  catalogProjects,
  projectsLoading,
  projectsError,
  favorites,
  onToggleFavorite,
}: {
  section: InvestorSection;
  user: AuthenticatedUser;
  onProfileSaved: (profile: InvestorProfile) => void;
  catalogProjects: CatalogProject[];
  projectsLoading: boolean;
  projectsError: string;
  favorites: number[];
  onToggleFavorite: (projectId: number, title: string) => boolean;
}) {
  const sectionInfo = investorSections.find((item) => item.id === section);
  const favoriteProjects = catalogProjects.filter((project) => favorites.includes(project.id));
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
      </div>

      {section === "appointments" ? (
        <AppointmentManagement
          role="investor"
          projects={catalogProjects}
          projectsLoading={projectsLoading}
          projectsError={projectsError}
        />
      ) : publicCatalogSection ? (
        <>
          <p className="investor-workspace__notice">
            {section === "favorites"
              ? "Vos favoris sont conservés sur cet appareil. Ils ne sont pas encore synchronisés avec votre compte."
              : "Projets publiés par leurs porteurs; ces informations ne constituent pas une offre d’investissement."}
          </p>
          {section === "explore" ? (
            <ProjectExplorer
              projects={catalogProjects}
              stats={null}
              loadError={projectsError}
              serverCatalog
              favoriteProjectIds={favorites}
              onToggleFavorite={(project) =>
                onToggleFavorite(project.id, project.title)
              }
              projectHrefBase="/projets"
              showFooter={false}
              showHero={false}
              resultsEyebrow="CATALOGUE PUBLIC"
              resultsTitle="Projets disponibles"
            />
          ) : projectsLoading ? (
            <p role="status">Chargement de vos projets favoris…</p>
          ) : projectsError ? (
            <p role="alert">{projectsError}</p>
          ) : favoriteProjects.length ? (
            <ProjectExplorer
              projects={favoriteProjects}
              stats={null}
              favoriteProjectIds={favorites}
              onToggleFavorite={(project) =>
                onToggleFavorite(project.id, project.title)
              }
              projectHrefBase="/projets"
              showFooter={false}
              showHero={false}
              resultsEyebrow="VOTRE SÉLECTION"
              resultsTitle="Projets favoris"
            />
          ) : (
            <div className="investor-workspace__empty">
              <ProjectIcon name="heart" size={28} />
              <h2>Aucun favori pour le moment</h2>
              <p>Parcourez le catalogue et enregistrez les projets qui vous intéressent pour les retrouver ici.</p>
              <Link href="/espace-investisseur/explore">Explorer les projets <ProjectIcon name="arrow" size={15} /></Link>
            </div>
          )}
        </>
      ) : section === "messages" ? (
        <ConversationWorkspace
          role="investor"
          projects={catalogProjects}
          projectsLoading={projectsLoading}
          projectsError={projectsError}
        />
      ) : section === "notifications" ? (
        <NotificationInbox />
      ) : section === "requests" ? (
        <InvestorAccessRequests />
      ) : section === "profile" ? (
        <InvestorProfileWorkspace user={user} onSaved={onProfileSaved} />
      ) : section === "subscriptions" ? (
        <InvestorSubscriptionsWorkspace />
      ) : section === "projects" ? (
        <InvestorProjects />
      ) : (
        <div className="investor-workspace__empty">
          <ProjectIcon name="calendar" size={28} />
          <h2>Aucune donnée disponible</h2>
          <p>Les informations de cette rubrique apparaîtront ici lorsqu’elles seront disponibles.</p>
        </div>
      )}
    </section>
  );
}
