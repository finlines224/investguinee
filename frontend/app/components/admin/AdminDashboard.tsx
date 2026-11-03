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
  MoreHorizontal,
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
import {
  adminDemoNotice,
  adminSearchRecords,
  adminStats,
  demoAccessRequests,
  demoActivities,
  platformSeries,
  roleDistribution,
  type AdminPeriod,
  type AdminSearchRecord,
  type DemoActivity,
} from "../../data/admin-dashboard";
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

const adminNavigation: { id: AdminSection; label: string; icon: LucideIcon; badge?: number }[] = [
  { id: "overview", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "users", label: "Utilisateurs", icon: UsersRound, badge: 12 },
  { id: "organizations", label: "Entreprises & Organisations", icon: Building2 },
  { id: "projects", label: "Projets", icon: BriefcaseBusiness },
  { id: "access-requests", label: "Demandes d'accès", icon: Clock3, badge: 8 },
  { id: "trainings", label: "Formations & Événements", icon: GraduationCap },
  { id: "appointments", label: "Rendez-vous", icon: CalendarDays },
  { id: "messages", label: "Messages", icon: MessageSquareText, badge: 5 },
  { id: "notifications", label: "Notifications", icon: Bell, badge: 7 },
  { id: "payments", label: "Abonnements & Paiements", icon: CircleDollarSign },
  { id: "reports", label: "Rapports & Analyses", icon: FileChartColumnIncreasing },
  { id: "settings", label: "Paramètres", icon: Settings },
  { id: "audit", label: "Audit & Logs", icon: ShieldCheck },
];

const sectionCopy: Record<Exclude<AdminSection, "overview">, { title: string; description: string }> = {
  users: { title: "Gestion des utilisateurs", description: "La liste, les filtres et les opérations sur les comptes seront activés avec une API admin autorisée." },
  organizations: { title: "Entreprises & Organisations", description: "La vérification des organisations nécessite une API Django dédiée et une journalisation côté serveur." },
  projects: { title: "Gestion des projets", description: "La consultation et la modération des projets ne sont pas encore reliées à une API admin." },
  "access-requests": { title: "Demandes d'accès", description: "Les demandes illustrées sur le tableau de bord sont des données de démonstration. Aucune décision ne peut être enregistrée pour le moment." },
  trainings: { title: "Formations & Événements", description: "La gestion des formations nécessite une API d'administration qui n'est pas encore présente." },
  appointments: { title: "Rendez-vous", description: "Aucun endpoint de gestion des rendez-vous n'est configuré dans le backend actuel." },
  messages: { title: "Messages", description: "Les messages d'administration apparaîtront ici lorsque l'API correspondante sera disponible." },
  notifications: { title: "Notifications", description: "Les notifications affichées sont des exemples et ne proviennent pas d'un journal serveur." },
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

  const showUnavailableAction = (title: string, subject?: string) => {
    setDialog({
      title,
      message: subject
        ? `« ${subject} » provient du jeu de données de démonstration. Le backend ne fournit pas d'API administrative pour cette action; aucune décision n'a été enregistrée.`
        : "Cette rubrique n'est pas encore reliée à l'API Django. Aucune donnée ni opération réelle n'est simulée.",
      confirmLabel: "Compris",
    });
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
          {adminNavigation.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              className={`admin-nav__item${activeSection === id ? " admin-nav__item--active" : ""}`}
              aria-current={activeSection === id ? "page" : undefined}
              onClick={() => { setActiveSection(id); setSidebarOpen(false); }}
            >
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
              {badge !== undefined && <span className="admin-nav__badge">{badge}</span>}
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
              <AdminWelcome onStatusClick={() => setDialog({ title: "État de la plateforme", message: "Cet indicateur est une démonstration visuelle. Aucun service de supervision n'est connecté.", confirmLabel: "Compris" })} />
              <div className="admin-demo-notice"><Activity size={15} /><span>{adminDemoNotice}</span></div>
              <section className="admin-stats" aria-label="Indicateurs clés">
                {adminStats.map((stat) => <AdminStatCard key={stat.label} stat={stat} />)}
              </section>
              <div className="admin-overview-grid">
                <PlatformChart period={period} onPeriodChange={setPeriod} />
                <RecentActivity onViewAll={() => setActiveSection("audit")} />
              </div>
              <div className="admin-lower-grid">
                <PendingRequests onAction={showUnavailableAction} onViewAll={() => setActiveSection("access-requests")} />
                <RoleChart />
                <QuickActions onSelect={setActiveSection} />
              </div>
            </>
          ) : (
            <AdminSectionPlaceholder section={activeSection} onBack={() => setActiveSection("overview")} />
          )}
          <footer className="admin-content__footer"><span>InvestGuinée · Administration</span><span>Interface de démonstration · {new Date().getFullYear()}</span></footer>
        </main>
      </div>

      {dialog && <div className="admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title"><span className="admin-dialog__icon"><ShieldCheck size={22} /></span><h2 id="admin-dialog-title">{dialog.title}</h2><p>{dialog.message}</p><button className="admin-button admin-button--primary" type="button" onClick={() => setDialog(null)}>{dialog.confirmLabel ?? "Fermer"}</button><button className="admin-dialog__close" type="button" aria-label="Fermer la fenêtre" onClick={() => setDialog(null)}><X size={18} /></button></section></div>}
    </div>
  );
}

function AdminWelcome({ onStatusClick }: { onStatusClick: () => void }) {
  return (
    <section className="admin-welcome">
      <div className="admin-welcome__copy"><span>INVESTGUINÉE · VUE ADMINISTRATEUR</span><h1>Tableau de bord Administrateur</h1><p>Gérez, supervisez et faites grandir la plateforme InvestGuinée.</p></div>
      <div className="admin-system-card"><span className="admin-system-card__icon"><Check size={17} /></span><span className="admin-system-card__copy"><strong>Système opérationnel</strong><small>Indicateur de démonstration</small></span><button type="button" onClick={onStatusClick}>Voir le détail <ChevronRight size={14} /></button></div>
    </section>
  );
}

function AdminStatCard({ stat }: { stat: (typeof adminStats)[number] }) {
  const iconMap: Record<(typeof adminStats)[number]["icon"], LucideIcon> = {
    users: UsersRound,
    projects: BriefcaseBusiness,
    buildings: Building2,
    calendar: CalendarDays,
    transactions: CircleDollarSign,
  };
  const Icon = iconMap[stat.icon];
  return (
    <article className={`admin-stat-card admin-stat-card--${stat.color}`}>
      <div className="admin-stat-card__top"><span className="admin-stat-card__icon"><Icon size={19} strokeWidth={1.9} /></span><span className="admin-stat-card__change"><ArrowUpRight size={14} />{stat.change}</span></div>
      <p>{stat.label}</p><strong>{stat.value}</strong><small>vs période précédente <span>· démo</span></small>
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

function PendingRequests({ onAction, onViewAll }: { onAction: (title: string, subject?: string) => void; onViewAll: () => void }) {
  return (
    <section className="admin-card admin-requests-card">
      <div className="admin-card__heading"><div className="admin-card__title"><span className="admin-card__title-icon admin-card__title-icon--orange"><Clock3 size={18} /></span><span><h2>Demandes en attente</h2><small>Exemples non connectés au backend</small></span></div><button className="admin-text-button" type="button" onClick={onViewAll}>Voir toutes <ArrowUpRight size={14} /></button></div>
      <div className="admin-request-list">{demoAccessRequests.map((request) => <article className="admin-request" key={request.id}><span className="admin-request__avatar">{request.initials}</span><span className="admin-request__person"><strong>{request.name}</strong><small>{request.reason}</small><em><span />En attente · {request.age}</em></span><div className="admin-request__actions"><button className="admin-request__approve" type="button" onClick={() => onAction("Approbation non disponible", request.name)} aria-label={`Voir l'état de démonstration pour ${request.name}`}><Check size={16} /><span>Approuver</span></button><button className="admin-request__reject" type="button" onClick={() => onAction("Refus non disponible", request.name)} aria-label={`Voir l'état de démonstration pour ${request.name}`}><X size={16} /><span>Refuser</span></button></div></article>)}</div>
    </section>
  );
}

function RoleChart() {
  return (
    <section className="admin-card admin-role-card">
      <div className="admin-card__heading"><div className="admin-card__title"><span className="admin-card__title-icon admin-card__title-icon--violet"><ChartPie size={18} /></span><span><h2>Répartition par rôle</h2><small>Répartition de démonstration</small></span></div><button className="admin-more-button" type="button" aria-label="Informations sur le graphique" title="Données de démonstration"><MoreHorizontal size={19} /></button></div>
      <div className="admin-role-card__content"><div className="admin-donut-wrap" role="img" aria-label="Répartition de démonstration : investisseurs 32 %, entrepreneurs 40 %, étudiants 18 %, administrateurs 10 %"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={roleDistribution} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="92%" paddingAngle={3} stroke="none">{roleDistribution.map((role) => <Cell key={role.name} fill={role.color} />)}</Pie><Tooltip formatter={(value) => [`${value}%`, "Part"]} /></PieChart></ResponsiveContainer><span className="admin-donut-center"><strong>12 480</strong><small>utilisateurs</small></span></div><ul className="admin-role-legend">{roleDistribution.map((role) => <li key={role.name}><span><i style={{ backgroundColor: role.color }} />{role.name}</span><strong>{role.value}%</strong></li>)}</ul></div>
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
  return (
    <section className="admin-section-placeholder">
      <div className="admin-section-placeholder__breadcrumb"><span>Administration</span><ChevronRight size={14} /><strong>{title}</strong></div>
      <div className="admin-section-placeholder__content"><span className="admin-section-placeholder__icon"><Icon size={24} /></span><span className="admin-demo-chip">API NON CONNECTÉE</span><h1>{title}</h1><p>{description}</p><div className="admin-section-placeholder__notice"><ShieldCheck size={18} /><span>Les contrôles de permission et les opérations sensibles doivent être vérifiés par Django. Cette interface n&apos;exécute aucune modification.</span></div><button className="admin-button admin-button--primary" type="button" onClick={onBack}>Retour au tableau de bord</button></div>
    </section>
  );
}
