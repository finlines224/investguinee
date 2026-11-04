"use client";

import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartLine,
  ChartPie,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileChartColumnIncreasing,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminTrainingManagement from "./AdminTrainingManagement";
import AdminUserManagement from "./AdminUserManagement";
import AdminProjectManagement from "./AdminProjectManagement";
import AdminOrganizationManagement from "./AdminOrganizationManagement";
import AdminAccessRequestManagement from "./AdminAccessRequestManagement";
import AdminPendingAccessRequests from "./AdminPendingAccessRequests";
import AppointmentManagement from "../appointments/AppointmentManagement";
import AdminConversationManagement from "./AdminConversationManagement";
import AdminNotificationManagement from "./AdminNotificationManagement";
import {
  adminSearchRecords,
  demoActivities,
  platformSeries,
  type AdminPeriod,
  type AdminSearchRecord,
  type DemoActivity,
} from "../../data/admin-dashboard";
import { getAdminOverview, type AdminOverview, type AdminRole } from "../../lib/admin-api";
import { postAuthRequest } from "../../lib/auth-api";
import { getCurrentUser, type AuthenticatedUser } from "../../lib/session-api";

type AdminSection =
  | "overview"
  | "users"
  | "organizations"
  | "projects"
  | "access-requests"
  | "trainings"
  | "appointments"
  | "messages"
  | "notifications"
  | "payments"
  | "reports"
  | "settings"
  | "audit";

type AdminDialog = {
  title: string;
  message: string;
  confirmLabel?: string;
};

const adminNavigation: { id: AdminSection; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "users", label: "Utilisateurs", icon: UsersRound },
  { id: "organizations", label: "Entreprises & Organisations", icon: Building2 },
  { id: "projects", label: "Projets", icon: BriefcaseBusiness },
  { id: "access-requests", label: "Demandes d'accès", icon: Clock3 },
  { id: "trainings", label: "Formations & Événements", icon: GraduationCap },
  { id: "appointments", label: "Rendez-vous", icon: CalendarDays },
  { id: "messages", label: "Messages", icon: MessageSquareText },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "payments", label: "Abonnements & Paiements", icon: CircleDollarSign },
  { id: "reports", label: "Rapports & Analyses", icon: FileChartColumnIncreasing },
  { id: "settings", label: "Paramètres", icon: Settings },
  { id: "audit", label: "Audit & Logs", icon: ShieldCheck },
];

const sectionCopy: Record<Exclude<AdminSection, "overview">, { title: string; description: string }> = {
  users: { title: "Gestion des utilisateurs", description: "Consultez les comptes enregistrés et filtrez par rôle ou statut." },
  organizations: { title: "Entreprises & Organisations", description: "Consultez les organisations enregistrées et leur statut de vérification." },
  projects: { title: "Gestion des projets", description: "Consultez les projets enregistrés, leur statut et les informations publiées par leur porteur." },
  "access-requests": { title: "Demandes d'accès", description: "Consultez les demandes d’accès réelles et enregistrez une décision d’approbation ou de refus." },
  trainings: { title: "Formations & Événements", description: "Créez, modifiez et publiez les ressources proposées dans l’espace étudiant." },
  appointments: { title: "Rendez-vous", description: "Consultez les demandes et les créneaux proposés sur la plateforme." },
  messages: { title: "Messages", description: "Consultez les métadonnées des conversations privées entre investisseurs et entrepreneurs." },
  notifications: { title: "Notifications", description: "Consultez les alertes et diffusez des annonces aux comptes actifs." },
  payments: { title: "Abonnements & Paiements", description: "Les données de paiement ne sont pas chargées depuis le backend; aucune information financière réelle n'est affichée." },
  reports: { title: "Rapports & Analyses", description: "Les rapports de production devront être calculés à partir des données persistantes et des autorisations Django." },
  settings: { title: "Paramètres", description: "Les réglages administratifs ne sont pas encore connectés à des endpoints sécurisés." },
  audit: { title: "Audit & Logs", description: "Les journaux d'audit ne sont pas encore exposés par le backend." },
};

const activityIcons: Record<DemoActivity["kind"], LucideIcon> = {
  user: UsersRound,
  project: FolderKanban,
  access: BadgeCheck,
  payment: CircleDollarSign,
  message: MessageSquareText,
};

const activityColors: Record<DemoActivity["kind"], string> = {
  user: "blue",
  project: "green",
  access: "violet",
  payment: "orange",
  message: "sky",
};

const quickActions: { label: string; description: string; icon: LucideIcon; section: AdminSection; color: string }[] = [
  { label: "Gérer les utilisateurs", description: "Comptes et rôles", icon: UsersRound, section: "users", color: "blue" },
  { label: "Voir les rapports", description: "Indicateurs de la plateforme", icon: ChartLine, section: "reports", color: "green" },
  { label: "Modérer les contenus", description: "Projets et publications", icon: ShieldCheck, section: "projects", color: "violet" },
  { label: "Gérer les rendez-vous", description: "Planning et demandes", icon: CalendarDays, section: "appointments", color: "orange" },
];

const periodLabels: Record<AdminPeriod, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "90 derniers jours",
  "12m": "12 derniers mois",
};

const adminRoleColors: Record<AdminRole["role"], string> = {
  INVESTOR: "#0875FF",
  ENTREPRENEUR: "#00A66A",
  STUDENT: "#7038E8",
  ADMIN: "#FFA500",
};

const adminOverviewCards: {
  label: string;
  color: string;
  icon: LucideIcon;
  getValue: (overview: AdminOverview) => number;
  description: string;
}[] = [
  {
    label: "Utilisateurs inscrits",
    color: "blue",
    icon: UsersRound,
    getValue: (overview) => overview.totalUsers,
    description: "Comptes enregistrés",
  },
  {
    label: "Projets publiés",
    color: "violet",
    icon: BriefcaseBusiness,
    getValue: (overview) => overview.publishedProjects,
    description: "Projets publics publiés",
  },
  {
    label: "Entreprises",
    color: "green",
    icon: Building2,
    getValue: (overview) => overview.organizations,
    description: "Organisations enregistrées",
  },
];

const adminCountFormatter = new Intl.NumberFormat("fr-FR");

function getRoleDestination(user: AuthenticatedUser) {
  if (user.role === "STUDENT") return "/espace-etudiant";
  if (user.role === "INVESTOR") return "/espace-investisseur";
  if (user.role === "ENTREPRENEUR") return "/espace-entrepreneur";
  return "/";
}

function getInitials(user: AuthenticatedUser) {
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() || "SA";
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [overviewRetryCount, setOverviewRetryCount] = useState(0);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<AdminPeriod>("30d");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [dialog, setDialog] = useState<AdminDialog | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace("/connexion?next=%2Fespace-administrateur");
        return;
      }
      if (currentUser.role !== "ADMIN") {
        router.replace(getRoleDestination(currentUser));
        return;
      }
      setUser(currentUser);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Impossible de vérifier votre session.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSession(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSession]);

  const adminUserId = user?.id;
  useEffect(() => {
    if (adminUserId === undefined) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setOverviewLoading(true);
      setOverviewError("");
      void getAdminOverview(controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setOverview(data);
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setOverviewError(
              error instanceof Error
                ? error.message
                : "Impossible de charger les indicateurs administrateur.",
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setOverviewLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [adminUserId, overviewRetryCount]);

  const searchResults = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("fr");
    if (!normalized) return [];
    return adminSearchRecords.filter((record) =>
      `${record.title} ${record.detail} ${record.type}`.toLocaleLowerCase("fr").includes(normalized),
    );
  }, [search]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError("");
    try {
      await postAuthRequest("logout/", {});
      router.replace("/connexion");
      router.refresh();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "La déconnexion n'a pas abouti.");
      setIsLoggingOut(false);
    }
  };

  const selectSearchResult = (record: AdminSearchRecord) => {
    const destination: Record<AdminSearchRecord["type"], AdminSection> = {
      Utilisateur: "users",
      Entreprise: "organizations",
      Projet: "projects",
    };
    setActiveSection(destination[record.type]);
    setSearch("");
  };

  if (isLoading) {
    return <main className="admin-state"><span className="admin-spinner" /><p>Vérification de votre session administrateur…</p></main>;
  }

  if (!user) {
    return (
      <main className="admin-state">
        <div className="admin-state__icon"><ShieldCheck size={24} /></div>
        <h1>Accès administrateur</h1>
        <p role="alert">{loadError || "Votre session administrateur n'a pas pu être vérifiée."}</p>
        {loadError && <button className="admin-button admin-button--primary" type="button" onClick={() => void loadSession()}>Réessayer</button>}
        <button className="admin-button admin-button--quiet" type="button" onClick={() => router.replace("/connexion")}>Retour à la connexion</button>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      {sidebarOpen && <button className="admin-overlay" type="button" aria-label="Fermer la navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`admin-sidebar${sidebarOpen ? " admin-sidebar--open" : ""}`}>
        <Link className="admin-brand" href="/">
          <span className="admin-brand__flag" aria-hidden="true"><i /><i /><i /></span>
          <span className="admin-brand__text"><strong>InvestGuinée</strong><small>Innover · Financer · Bâtir la Guinée</small></span>
        </Link>
        <span className="admin-sidebar__section-label">ESPACE ADMINISTRATION</span>
        <nav className="admin-nav" aria-label="Navigation administrateur">
          {adminNavigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`admin-nav__item${activeSection === id ? " admin-nav__item--active" : ""}`}
              aria-current={activeSection === id ? "page" : undefined}
              onClick={() => { setActiveSection(id); setSidebarOpen(false); }}
            >
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar__landscape"><span>Espace Administrateur<br /><strong>InvestGuinée</strong></span></div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-icon-button admin-menu-button" type="button" aria-label="Ouvrir la navigation" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="admin-search-wrap">
            <Search size={17} aria-hidden="true" />
            <input
              aria-label="Rechercher un utilisateur, une entreprise ou un projet"
              type="search"
              placeholder="Rechercher un utilisateur, un projet..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Escape") setSearch(""); }}
            />
            {search && <button className="admin-search-clear" type="button" aria-label="Effacer la recherche" onClick={() => setSearch("")}><X size={15} /></button>}
            {search.trim() && (
              <div className="admin-search-results" role="listbox" aria-label="Résultats de démonstration">
                <span className="admin-popover__eyebrow">RÉSULTATS LOCAUX · DÉMO</span>
                {searchResults.length ? searchResults.map((record) => (
                  <button key={record.id} type="button" role="option" aria-selected={false} onClick={() => selectSearchResult(record)}>
                    <span><strong>{record.title}</strong><small>{record.detail}</small></span><em>{record.type}</em>
                  </button>
                )) : <p>Aucun résultat de démonstration pour « {search} ».</p>}
                <small className="admin-search-results__note">La recherche réelle sera disponible avec l&apos;API admin.</small>
              </div>
            )}
          </div>
          <div className="admin-topbar__actions">
            <div className="admin-popover-anchor">
              <button className="admin-icon-button admin-notification-button" type="button" aria-label="Notifications, 7 non lues" aria-expanded={showNotifications} onClick={() => { setShowNotifications(!showNotifications); setShowAccountMenu(false); }}>
                <Bell size={19} /><span>7</span>
              </button>
              {showNotifications && <div className="admin-popover admin-notifications"><div className="admin-popover__header"><strong>Notifications</strong><span>DÉMO</span></div>{demoActivities.slice(0, 3).map((activity) => <div className="admin-notifications__item" key={activity.id}><strong>{activity.title}</strong><small>{activity.time}</small></div>)}<p>Exemples locaux, non synchronisés.</p></div>}
            </div>
            <div className="admin-popover-anchor">
              <button className="admin-account-button" type="button" aria-expanded={showAccountMenu} onClick={() => { setShowAccountMenu(!showAccountMenu); setShowNotifications(false); }}>
                <span className="admin-avatar">{getInitials(user)}</span>
                <span className="admin-account-button__details"><strong>{user.fullName || "Super Admin"}</strong><small>Administrateur</small></span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              {showAccountMenu && <div className="admin-popover admin-account-menu"><span className="admin-popover__eyebrow">SESSION DJANGO</span><strong>{user.email}</strong><button type="button" onClick={() => void handleLogout()} disabled={isLoggingOut}><LogOut size={15} />{isLoggingOut ? "Déconnexion…" : "Se déconnecter"}</button>{logoutError && <p role="alert">{logoutError}</p>}</div>}
            </div>
          </div>
        </header>

        <main className="admin-content">
          {activeSection === "overview" ? (
            <>
              <AdminWelcome
                isConnected={overview !== null && !overviewError}
                isLoading={overviewLoading}
                onStatusClick={() =>
                  setDialog({
                    title: "État des données administrateur",
                    message: overviewError
                      ? overviewError
                      : overview
                        ? "Les indicateurs et les demandes d’accès sont chargés depuis l’API Django. Le graphique d’évolution et les activités récentes restent des exemples de démonstration."
                        : "Les indicateurs sont en cours de chargement depuis l’API Django.",
                    confirmLabel: "Compris",
                  })
                }
              />
              <div className="admin-demo-notice">
                <Activity size={15} />
                <span>
                  Les indicateurs et la répartition des rôles proviennent de la base de données.
                  Les demandes d’accès sont synchronisées; le graphique d’évolution et les activités restent des exemples.
                </span>
              </div>
              {overviewError && (
                <div className="admin-overview-error" role="alert">
                  <span>{overviewError}</span>
                  <button
                    className="admin-button admin-button--quiet"
                    type="button"
                    onClick={() => setOverviewRetryCount((count) => count + 1)}
                  >
                    Réessayer
                  </button>
                </div>
              )}
              <section className="admin-stats" aria-label="Indicateurs clés">
                {adminOverviewCards.map((card) => (
                  <AdminStatCard
                    key={card.label}
                    card={card}
                    value={overview ? adminCountFormatter.format(card.getValue(overview)) : null}
                    loading={overviewLoading}
                  />
                ))}
              </section>
              <div className="admin-overview-grid">
                <PlatformChart period={period} onPeriodChange={setPeriod} />
                <RecentActivity onViewAll={() => setActiveSection("audit")} />
              </div>
              <div className="admin-lower-grid">
                <AdminPendingAccessRequests onViewAll={() => setActiveSection("access-requests")} />
                <RoleChart overview={overview} />
                <QuickActions onSelect={setActiveSection} />
              </div>
            </>
          ) : activeSection === "users" ? (
            <AdminUserManagement />
          ) : activeSection === "projects" ? (
            <AdminProjectManagement />
          ) : activeSection === "organizations" ? (
            <AdminOrganizationManagement />
          ) : activeSection === "trainings" ? (
            <AdminTrainingManagement />
          ) : activeSection === "access-requests" ? (
            <AdminAccessRequestManagement />
          ) : activeSection === "appointments" ? (
            <AppointmentManagement role="admin" />
          ) : activeSection === "messages" ? (
            <AdminConversationManagement />
          ) : activeSection === "notifications" ? (
            <AdminNotificationManagement />
          ) : (
            <AdminSectionPlaceholder section={activeSection} onBack={() => setActiveSection("overview")} />
          )}
          <footer className="admin-content__footer"><span>InvestGuinée · Administration</span><span>{new Date().getFullYear()}</span></footer>
        </main>
      </div>

      {dialog && <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title"><span className="admin-dialog__icon"><ShieldCheck size={22} /></span><h2 id="admin-dialog-title">{dialog.title}</h2><p>{dialog.message}</p><button className="admin-button admin-button--primary" type="button" onClick={() => setDialog(null)}>{dialog.confirmLabel ?? "Fermer"}</button><button className="admin-dialog__close" type="button" aria-label="Fermer la fenêtre" onClick={() => setDialog(null)}><X size={18} /></button></section></div>}
    </div>
  );
}

function AdminWelcome({
  isConnected,
  isLoading,
  onStatusClick,
}: {
  isConnected: boolean;
  isLoading: boolean;
  onStatusClick: () => void;
}) {
  const statusLabel = isLoading
    ? "Synchronisation des données…"
    : isConnected
      ? "Données Django connectées"
      : "Données indisponibles";
  return (
    <section className="admin-welcome">
      <div className="admin-welcome__copy"><span>INVESTGUINÉE · VUE ADMINISTRATEUR</span><h1>Tableau de bord Administrateur</h1><p>Gérez, supervisez et faites grandir la plateforme InvestGuinée.</p></div>
      <div className="admin-system-card"><span className="admin-system-card__icon">{isConnected ? <Check size={17} /> : <Activity size={17} />}</span><span className="admin-system-card__copy"><strong>{statusLabel}</strong><small>Statistiques des comptes, projets et organisations</small></span><button type="button" onClick={onStatusClick}>Voir le détail <ChevronRight size={14} /></button></div>
    </section>
  );
}

function AdminStatCard({
  card,
  value,
  loading,
}: {
  card: (typeof adminOverviewCards)[number];
  value: string | null;
  loading: boolean;
}) {
  const Icon = card.icon;
  return (
    <article className={`admin-stat-card admin-stat-card--${card.color}`}>
      <div className="admin-stat-card__top"><span className="admin-stat-card__icon"><Icon size={19} strokeWidth={1.9} /></span></div>
      <p>{card.label}</p><strong>{value ?? (loading ? "…" : "—")}</strong><small>{card.description}</small>
    </article>
  );
}

function PlatformChart({ period, onPeriodChange }: { period: AdminPeriod; onPeriodChange: (period: AdminPeriod) => void }) {
  return (
    <section className="admin-card admin-platform-card">
      <div className="admin-card__heading"><div className="admin-card__title"><span className="admin-card__title-icon admin-card__title-icon--blue"><ChartLine size={18} /></span><span><h2>Vue d&apos;ensemble de la plateforme</h2><small>Évolution des principaux indicateurs · Démo</small></span></div><label className="admin-period-select"><span className="sr-only">Période du graphique</span><select value={period} onChange={(event) => onPeriodChange(event.target.value as AdminPeriod)}>{Object.entries(periodLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><ChevronDown size={15} /></label></div>
      <div className="admin-chart-legend"><span><i className="admin-legend-dot admin-legend-dot--blue" />Utilisateurs</span><span><i className="admin-legend-dot admin-legend-dot--green" />Projets</span><span><i className="admin-legend-dot admin-legend-dot--violet" />Activités</span></div>
      <div className="admin-line-chart" role="img" aria-label={`Graphique de démonstration, ${periodLabels[period]}, utilisateurs, projets et activités`}>
        <ResponsiveContainer width="100%" height="100%"><LineChart data={platformSeries[period]} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#EAF0F8" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#8292AA", fontSize: 10 }} dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8292AA", fontSize: 10 }} />
          <Tooltip contentStyle={{ border: "1px solid #DCE7F8", borderRadius: 9, boxShadow: "0 6px 20px #0A245510", fontSize: 12 }} />
          <Line type="monotone" dataKey="users" name="Utilisateurs" stroke="#0875FF" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="projects" name="Projets" stroke="#00A66A" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="activities" name="Activités" stroke="#7038E8" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        </LineChart></ResponsiveContainer>
      </div>
    </section>
  );
}

function RecentActivity({ onViewAll }: { onViewAll: () => void }) {
  return (
    <section className="admin-card admin-activity-card">
      <div className="admin-card__heading"><div className="admin-card__title"><span className="admin-card__title-icon admin-card__title-icon--green"><Activity size={18} /></span><span><h2>Activité récente</h2><small>Journal de démonstration</small></span></div><button className="admin-text-button" type="button" onClick={onViewAll}>Voir toutes <ArrowUpRight size={14} /></button></div>
      <ol className="admin-activity-list">{demoActivities.map((activity, index) => {
        const Icon = activityIcons[activity.kind];
        return <li className="admin-activity-item" key={activity.id}><span className={`admin-activity-item__icon admin-activity-item__icon--${activityColors[activity.kind]}`}><Icon size={16} /></span><span className="admin-activity-item__body"><strong>{activity.title}</strong><small>{activity.description}</small><time>{activity.time}</time></span>{index < demoActivities.length - 1 && <i className="admin-activity-item__line" />}</li>;
      })}</ol>
    </section>
  );
}

function RoleChart({ overview }: { overview: AdminOverview | null }) {
  const roles =
    overview?.roles.map((role) => ({
      ...role,
      percentage: overview.totalUsers
        ? Math.round((role.count / overview.totalUsers) * 100)
        : 0,
      color: adminRoleColors[role.role],
    })) ?? [];
  const roleDescription = overview
    ? roles.map((role) => `${role.label} ${role.percentage} %`).join(", ")
    : "Chargement de la répartition des rôles";

  return (
    <section className="admin-card admin-role-card">
      <div className="admin-card__heading"><div className="admin-card__title"><span className="admin-card__title-icon admin-card__title-icon--violet"><ChartPie size={18} /></span><span><h2>Répartition par rôle</h2><small>Comptes enregistrés par rôle</small></span></div></div>
      <div className="admin-role-card__content"><div className="admin-donut-wrap" role="img" aria-label={roleDescription}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={roles} dataKey="count" nameKey="label" innerRadius="68%" outerRadius="92%" paddingAngle={3} stroke="none">{roles.map((role) => <Cell key={role.role} fill={role.color} />)}</Pie><Tooltip formatter={(value) => [adminCountFormatter.format(Number(value ?? 0)), "Comptes"]} /></PieChart></ResponsiveContainer><span className="admin-donut-center"><strong>{overview ? adminCountFormatter.format(overview.totalUsers) : "—"}</strong><small>utilisateurs</small></span></div><ul className="admin-role-legend">{roles.map((role) => <li key={role.role}><span><i style={{ backgroundColor: role.color }} />{role.label}</span><strong>{role.percentage}%</strong></li>)}</ul></div>
    </section>
  );
}

function QuickActions({ onSelect }: { onSelect: (section: AdminSection) => void }) {
  return (
    <section className="admin-card admin-shortcuts-card">
      <div className="admin-card__heading"><div className="admin-card__title"><span className="admin-card__title-icon admin-card__title-icon--blue"><FolderKanban size={18} /></span><span><h2>Raccourcis admin</h2><small>Navigation de démonstration</small></span></div></div>
      <div className="admin-shortcuts-grid">{quickActions.map(({ label, description, icon: Icon, section, color }) => <button className="admin-shortcut" type="button" key={label} onClick={() => onSelect(section)}><span className={`admin-shortcut__icon admin-shortcut__icon--${color}`}><Icon size={17} /></span><span><strong>{label}</strong><small>{description}</small></span><ChevronRight size={15} /></button>)}</div>
    </section>
  );
}

function AdminSectionPlaceholder({ section, onBack }: { section: Exclude<AdminSection, "overview">; onBack: () => void }) {
  const { title, description } = sectionCopy[section];
  const navigationItem = adminNavigation.find((item) => item.id === section);
  const Icon = navigationItem?.icon ?? ShieldCheck;
  if (section === "audit") {
    return (
      <section className="admin-section-placeholder admin-audit">
        <div className="admin-section-placeholder__breadcrumb"><span>Administration</span><ChevronRight size={14} /><strong>{title}</strong></div>
        <header className="admin-audit__hero">
          <span className="admin-audit__hero-icon"><Icon size={25} /></span>
          <div>
            <span className="admin-audit__eyebrow">TRAÇABILITÉ & SÉCURITÉ</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <span className="admin-demo-chip">JOURNAL NON CONNECTÉ</span>
        </header>
        <div className="admin-audit__summary">
          <article><span className="admin-audit__summary-icon admin-audit__summary-icon--blue"><Activity size={19} /></span><div><span>Événements journalisés</span><strong>Indisponible</strong></div></article>
          <article><span className="admin-audit__summary-icon admin-audit__summary-icon--green"><Clock3 size={19} /></span><div><span>Dernière activité</span><strong>Non disponible</strong></div></article>
          <article><span className="admin-audit__summary-icon admin-audit__summary-icon--violet"><ShieldCheck size={19} /></span><div><span>Journal d’audit</span><strong>Non connecté</strong></div></article>
        </div>
        <section className="admin-audit__panel">
          <div className="admin-audit__panel-heading">
            <div><h2>Historique des événements</h2><p>Actions administratives et événements de sécurité</p></div>
            <span className="admin-audit__unavailable"><span />Données indisponibles</span>
          </div>
          <div className="admin-audit__table-wrap">
            <table className="admin-audit__table">
              <thead><tr><th>Date & heure</th><th>Acteur</th><th>Action</th><th>Ressource</th><th>Résultat</th></tr></thead>
              <tbody><tr><td colSpan={5}>
                <div className="admin-audit__empty">
                  <span className="admin-audit__empty-icon"><Icon size={23} /></span>
                  <strong>Aucun journal d’audit disponible</strong>
                  <span>Les événements apparaîtront ici après la connexion d’une source de journalisation.</span>
                </div>
              </td></tr></tbody>
            </table>
          </div>
        </section>
        <div className="admin-audit__notice">
          <ShieldCheck size={19} />
          <p>Cette page n’affiche aucun événement fictif. La journalisation devra être configurée côté serveur afin d’assurer la traçabilité et la protection des données.</p>
        </div>
        <button className="admin-button admin-button--quiet" type="button" onClick={onBack}>Retour au tableau de bord</button>
      </section>
    );
  }
  if (section === "settings") {
    return (
      <section className="admin-section-placeholder admin-settings">
        <div className="admin-section-placeholder__breadcrumb"><span>Administration</span><ChevronRight size={14} /><strong>{title}</strong></div>
        <header className="admin-settings__hero">
          <span className="admin-settings__hero-icon"><Icon size={25} /></span>
          <div>
            <span className="admin-settings__eyebrow">CONFIGURATION DE L’ESPACE</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <span className="admin-demo-chip">GESTION NON CONNECTÉE</span>
        </header>
        <div className="admin-settings__status">
          <span className="admin-settings__status-icon"><ShieldCheck size={19} /></span>
          <div><strong>Vos paramètres ne sont pas modifiables depuis cette page</strong><p>Les préférences et contrôles administrateur seront activés lorsqu’une API sécurisée sera disponible.</p></div>
        </div>
        <div className="admin-settings__grid">
          <article className="admin-settings__card">
            <span className="admin-settings__card-icon admin-settings__card-icon--blue"><Settings size={19} /></span>
            <div className="admin-settings__card-heading"><h2>Préférences générales</h2><span>À configurer</span></div>
            <p>Langue, fuseau horaire et préférences d’affichage de l’interface d’administration.</p>
            <div className="admin-settings__card-footer"><span>Connexion API requise</span></div>
          </article>
          <article className="admin-settings__card">
            <span className="admin-settings__card-icon admin-settings__card-icon--green"><ShieldCheck size={19} /></span>
            <div className="admin-settings__card-heading"><h2>Sécurité & accès</h2><span>À configurer</span></div>
            <p>Gestion des accès administrateur, des sessions et des paramètres de sécurité.</p>
            <div className="admin-settings__card-footer"><span>Connexion API requise</span></div>
          </article>
          <article className="admin-settings__card">
            <span className="admin-settings__card-icon admin-settings__card-icon--amber"><Bell size={19} /></span>
            <div className="admin-settings__card-heading"><h2>Notifications</h2><span>À configurer</span></div>
            <p>Choix des alertes administratives et des canaux de réception associés.</p>
            <div className="admin-settings__card-footer"><span>Connexion API requise</span></div>
          </article>
          <article className="admin-settings__card">
            <span className="admin-settings__card-icon admin-settings__card-icon--violet"><Activity size={19} /></span>
            <div className="admin-settings__card-heading"><h2>Configuration de la plateforme</h2><span>À configurer</span></div>
            <p>Paramètres généraux des services et des fonctionnalités de la plateforme.</p>
            <div className="admin-settings__card-footer"><span>Connexion API requise</span></div>
          </article>
        </div>
        <button className="admin-button admin-button--quiet" type="button" onClick={onBack}>Retour au tableau de bord</button>
      </section>
    );
  }
  if (section === "reports") {
    return (
      <section className="admin-section-placeholder admin-reports">
        <div className="admin-section-placeholder__breadcrumb"><span>Administration</span><ChevronRight size={14} /><strong>{title}</strong></div>
        <header className="admin-reports__hero">
          <span className="admin-reports__hero-icon"><Icon size={25} /></span>
          <div>
            <span className="admin-reports__eyebrow">PILOTAGE DE LA PLATEFORME</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <span className="admin-demo-chip">DONNÉES ANALYTIQUES NON CONNECTÉES</span>
        </header>
        <div className="admin-reports__metrics">
          <article className="admin-reports__metric">
            <span className="admin-reports__metric-icon admin-reports__metric-icon--blue"><UsersRound size={19} /></span>
            <div><span>Comptes inscrits</span><strong>—</strong><small>Indicateur non calculé</small></div>
          </article>
          <article className="admin-reports__metric">
            <span className="admin-reports__metric-icon admin-reports__metric-icon--green"><BriefcaseBusiness size={19} /></span>
            <div><span>Projets publiés</span><strong>—</strong><small>Indicateur non calculé</small></div>
          </article>
          <article className="admin-reports__metric">
            <span className="admin-reports__metric-icon admin-reports__metric-icon--violet"><Activity size={19} /></span>
            <div><span>Activité de la plateforme</span><strong>—</strong><small>Historique non disponible</small></div>
          </article>
        </div>
        <div className="admin-reports__grid">
          <section className="admin-reports__panel admin-reports__chart">
            <div className="admin-reports__panel-heading">
              <span className="admin-reports__panel-icon"><ChartLine size={18} /></span>
              <div><h2>Évolution de la plateforme</h2><p>Comptes, projets et activités au fil du temps</p></div>
            </div>
            <div className="admin-reports__chart-empty">
              <span className="admin-reports__chart-lines" aria-hidden="true"><i /><i /><i /><i /></span>
              <span>Aucune série de données à afficher</span>
            </div>
          </section>
          <section className="admin-reports__panel admin-reports__distribution">
            <div className="admin-reports__panel-heading">
              <span className="admin-reports__panel-icon admin-reports__panel-icon--violet"><ChartPie size={18} /></span>
              <div><h2>Répartition des comptes</h2><p>Par type de profil</p></div>
            </div>
            <div className="admin-reports__distribution-empty">
              <span className="admin-reports__donut-placeholder" aria-hidden="true"><i /></span>
              <span>Les statistiques apparaîtront lorsque les rapports seront connectés.</span>
            </div>
          </section>
        </div>
        <div className="admin-reports__notice">
          <ShieldCheck size={19} />
          <p>
            Les rapports affichés ici ne contiennent pas de données simulées.
            Les indicateurs seront calculés depuis les données persistantes et
            accessibles uniquement aux administrateurs autorisés.
          </p>
        </div>
        <button className="admin-button admin-button--primary" type="button" onClick={onBack}>Retour au tableau de bord</button>
      </section>
    );
  }
  if (section === "payments") {
    return (
      <section className="admin-section-placeholder admin-payments">
        <div className="admin-section-placeholder__breadcrumb"><span>Administration</span><ChevronRight size={14} /><strong>{title}</strong></div>
        <header className="admin-payments__hero">
          <span className="admin-payments__hero-icon"><Icon size={25} /></span>
          <div>
            <span className="admin-payments__eyebrow">SUIVI FINANCIER</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <span className="admin-demo-chip">API NON CONNECTÉE</span>
        </header>
        <div className="admin-payments__overview">
          <article className="admin-payments__card">
            <span className="admin-payments__card-icon admin-payments__card-icon--blue"><CircleDollarSign size={19} /></span>
            <div><span>Paiements enregistrés</span><strong>Indisponible</strong><small>Aucune transaction réelle affichée</small></div>
          </article>
          <article className="admin-payments__card">
            <span className="admin-payments__card-icon admin-payments__card-icon--green"><BriefcaseBusiness size={19} /></span>
            <div><span>Abonnements actifs</span><strong>Indisponible</strong><small>Les offres ne sont pas reliées à l’API</small></div>
          </article>
          <article className="admin-payments__card">
            <span className="admin-payments__card-icon admin-payments__card-icon--amber"><Clock3 size={19} /></span>
            <div><span>Historique</span><strong>Non disponible</strong><small>En attente de connexion des données</small></div>
          </article>
        </div>
        <section className="admin-payments__empty">
          <span className="admin-payments__empty-icon"><Icon size={25} /></span>
          <span className="admin-payments__eyebrow">AUCUNE DONNÉE FINANCIÈRE</span>
          <h2>Les paiements et abonnements apparaîtront ici</h2>
          <p>
            Cette rubrique est uniquement informative pour le moment. Aucun
            paiement n’a été effectué ni aucun abonnement créé depuis cet écran.
            La gestion sera activée lorsque les données et les contrôles côté
            serveur seront disponibles.
          </p>
          <div className="admin-section-placeholder__notice">
            <ShieldCheck size={18} />
            <span>Les opérations financières devront être sécurisées et vérifiées par l’API Django avant leur activation.</span>
          </div>
          <button className="admin-button admin-button--primary" type="button" onClick={onBack}>Retour au tableau de bord</button>
        </section>
      </section>
    );
  }
  return (
    <section className="admin-section-placeholder">
      <div className="admin-section-placeholder__breadcrumb"><span>Administration</span><ChevronRight size={14} /><strong>{title}</strong></div>
      <div className="admin-section-placeholder__content"><span className="admin-section-placeholder__icon"><Icon size={24} /></span><span className="admin-demo-chip">API NON CONNECTÉE</span><h1>{title}</h1><p>{description}</p><div className="admin-section-placeholder__notice"><ShieldCheck size={18} /><span>Les contrôles de permission et les opérations sensibles doivent être vérifiés par Django. Cette interface n&apos;exécute aucune modification.</span></div><button className="admin-button admin-button--primary" type="button" onClick={onBack}>Retour au tableau de bord</button></div>
    </section>
  );
}
