"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { postAuthRequest } from "../../lib/auth-api";
import {
  getEntrepreneurProjects,
  type EntrepreneurProject,
} from "../../lib/entrepreneur-api";
import { getCurrentUser, type AuthenticatedUser } from "../../lib/session-api";

// ── Nav item type ───────────────────────────────────────────────────────────
type NavItem = {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "tableau-de-bord", label: "Tableau de bord", icon: "⊞", href: "/espace-entrepreneur" },
  { id: "profil", label: "Mon profil entreprise", icon: "👤", href: "/espace-entrepreneur" },
  { id: "projets", label: "Mes projets", icon: "📁", href: "/espace-entrepreneur" },
  { id: "financement", label: "Opportunités de financement", icon: "💎", badge: 3, href: "/espace-entrepreneur" },
  { id: "partenaires", label: "Partenaires & Réseaux", icon: "🤝", href: "/espace-entrepreneur" },
  { id: "marketplace", label: "Marketplace", icon: "🛒", href: "/espace-entrepreneur" },
  { id: "appui", label: "Demandes d'appui", icon: "🎯", href: "/espace-entrepreneur" },
  { id: "rdv", label: "Rendez-vous", icon: "📅", href: "/espace-entrepreneur" },
  { id: "messagerie", label: "Messagerie", icon: "✉️", badge: 5, href: "/espace-entrepreneur" },
  { id: "notifs", label: "Notifications", icon: "🔔", badge: 2, href: "/espace-entrepreneur" },
  { id: "ressources", label: "Ressources", icon: "📚", href: "/espace-entrepreneur" },
  { id: "parametres", label: "Paramètres", icon: "⚙️", href: "/espace-entrepreneur" },
];

const TOOLS = [
  { id: "bp", color: "#2468B4", bg: "#EBF4FF", icon: "📄", label: "Business Plan", sub: "Modèles & conseils" },
  { id: "am", color: "#008F63", bg: "#D0F8E9", icon: "📊", label: "Analyse de marché", sub: "Données en Guinée" },
  { id: "cj", color: "#7C3AED", bg: "#EDE9FE", icon: "⚖️", label: "Conseils juridiques", sub: "Cadre légal" },
  { id: "cf", color: "#D97706", bg: "#FEF3C7", icon: "🧮", label: "Calculateur financier", sub: "Estimez vos besoins" },
];

const OPPORTUNITIES = [
  {
    id: 1,
    img: "🌾",
    imgBg: "#D0F8E9",
    title: "Appel à projets : Agriculture durable",
    sub: "Financement jusqu'à 100 millions GNF",
    time: "Il y a 2 jours",
    timeBg: "#D0F8E9",
    timeColor: "#008F63",
  },
  {
    id: 2,
    img: "💻",
    imgBg: "#EBF4FF",
    title: "Concours Innovation Digitale",
    sub: "Prix : 50 millions GNF",
    time: "Il y a 1 semaine",
    timeBg: "#F0F6FF",
    timeColor: "#2468B4",
  },
  {
    id: 3,
    img: "🏗️",
    imgBg: "#FEF3C7",
    title: "Marché public : Construction d'infrastructures",
    sub: "Consultation ouverte",
    time: "Il y a 1 semaine",
    timeBg: "#F0F6FF",
    timeColor: "#2468B4",
  },
];

const COMMUNITY_AVATARS = [
  { id: 1, initials: "AD", bg: "#2468B4" },
  { id: 2, initials: "KS", bg: "#008F63" },
  { id: 3, initials: "MB", bg: "#7C3AED" },
  { id: 4, initials: "FD", bg: "#D97706" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function EntrepreneurDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [projects, setProjects] = useState<EntrepreneurProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeNav, setActiveNav] = useState("tableau-de-bord");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) { router.replace("/connexion?next=%2Fespace-entrepreneur"); return; }
      if (currentUser.role !== "ENTREPRENEUR") {
        router.replace(currentUser.role === "INVESTOR" ? "/espace-investisseur" : "/");
        return;
      }
      const entrepreneurProjects = await getEntrepreneurProjects();
      setUser(currentUser);
      setProjects(entrepreneurProjects);
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await postAuthRequest("logout/", {});
      router.replace("/connexion");
      router.refresh();
    } catch { setIsLoggingOut(false); }
  };

  if (isLoading) {
    return (
      <div className="ed-loading">
        <span className="ed-loading__spinner" />
        <p>Vérification de votre session…</p>
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.firstName || user.fullName.split(" ")[0] || "Entrepreneur";
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "E";
  const featuredProject = projects[0] ?? null;
  const today = new Date();
  const todayDay = today.toLocaleDateString("fr-FR", { weekday: "short" });
  const todayDate = today.getDate();
  const todayMonth = today.toLocaleDateString("fr-FR", { month: "short" });

  return (
    <div className="ed-layout">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className="ed-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ═══════════════════════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════════════════════ */}
      <aside className={`ed-sidebar${sidebarOpen ? " ed-sidebar--open" : ""}`}>
        {/* Logo */}
        <Link className="ed-sidebar__brand" href="/">
          <span className="ed-sidebar__flag" aria-hidden="true">
            <i className="ed-sidebar__stripe ed-sidebar__stripe--red" />
            <i className="ed-sidebar__stripe ed-sidebar__stripe--yellow" />
            <i className="ed-sidebar__stripe ed-sidebar__stripe--green" />
          </span>
          <span className="ed-sidebar__brand-text">
            <strong>InvestGuinée</strong>
            <small>Innover · Financer · Bâtir la Guinée</small>
          </span>
        </Link>

        {/* Nav */}
        <nav className="ed-sidebar__nav" aria-label="Navigation entrepreneur">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ed-sidebar__nav-item${activeNav === item.id ? " ed-sidebar__nav-item--active" : ""}`}
              onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
            >
              <span className="ed-sidebar__nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="ed-sidebar__nav-label">{item.label}</span>
              {item.badge && (
                <span className="ed-sidebar__badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom city banner */}
        <div className="ed-sidebar__city">
          <div className="ed-sidebar__city-img" aria-hidden="true">
            <span className="ed-sidebar__city-overlay">Ensemble pour une<br /><strong>Guinée prospère</strong></span>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          MAIN
      ═══════════════════════════════════════════════════════ */}
      <div className="ed-main">
        {/* ── Topbar ── */}
        <header className="ed-topbar">
          <button
            type="button"
            className="ed-topbar__menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
          <div className="ed-topbar__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="search" placeholder="Rechercher une opportunité, un partenaire…" />
          </div>
          <div className="ed-topbar__actions">
            <button type="button" className="ed-topbar__icon-btn" aria-label="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="ed-topbar__notif-dot">2</span>
            </button>
            <div className="ed-topbar__user">
              <div className="ed-topbar__avatar" aria-label={user.fullName}>{initials}</div>
              <div className="ed-topbar__user-info">
                <strong>{user.fullName}</strong>
                <small>Entrepreneur</small>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </header>

        {/* ── Scrollable content ── */}
        <div className="ed-content">

          {/* ── Hero banner ── */}
          <section className="ed-hero" aria-label="Bienvenue">
            <div className="ed-hero__left">
              <h1 className="ed-hero__title">Bonjour {firstName},</h1>
              <p className="ed-hero__sub">Développez votre entreprise, trouvez des opportunités et innovez en Guinée !</p>
            </div>
            <div className="ed-hero__verified">
              <span className="ed-hero__check" aria-hidden="true">✓</span>
              <div>
                <p className="ed-hero__verified-label">Votre profil entreprise<br />est vérifié</p>
                <Link href="/espace-entrepreneur" className="ed-hero__verified-link">
                  Voir mon entreprise →
                </Link>
              </div>
            </div>
          </section>

          {/* ── KPI strip ── */}
          <section className="ed-kpis" aria-label="Indicateurs clés">
            <article className="ed-kpi" style={{ "--kpi-color": "#2468B4" } as React.CSSProperties}>
              <span className="ed-kpi__icon" style={{ background: "#EBF4FF" }}>💼</span>
              <div>
                <p className="ed-kpi__label">Mes projets</p>
                <strong className="ed-kpi__value">{projects.length || 4}</strong>
                <p className="ed-kpi__trend ed-kpi__trend--up">↑ +1 ce mois</p>
              </div>
            </article>
            <article className="ed-kpi" style={{ "--kpi-color": "#008F63" } as React.CSSProperties}>
              <span className="ed-kpi__icon" style={{ background: "#D0F8E9" }}>🤝</span>
              <div>
                <p className="ed-kpi__label">Opportunités trouvées</p>
                <strong className="ed-kpi__value">8</strong>
                <p className="ed-kpi__trend ed-kpi__trend--up">↑ +2 ce mois</p>
              </div>
            </article>
            <article className="ed-kpi" style={{ "--kpi-color": "#7C3AED" } as React.CSSProperties}>
              <span className="ed-kpi__icon" style={{ background: "#EDE9FE" }}>👥</span>
              <div>
                <p className="ed-kpi__label">Partenaires</p>
                <strong className="ed-kpi__value">12</strong>
                <p className="ed-kpi__trend ed-kpi__trend--up">↑ +3 ce mois</p>
              </div>
            </article>
            <article className="ed-kpi" style={{ "--kpi-color": "#D97706" } as React.CSSProperties}>
              <span className="ed-kpi__icon" style={{ background: "#FEF3C7" }}>📈</span>
              <div>
                <p className="ed-kpi__label">Croissance estimée</p>
                <strong className="ed-kpi__value" style={{ color: "#008F63" }}>+35%</strong>
                <p className="ed-kpi__trend" style={{ color: "#6B7280" }}>par rapport au mois dernier</p>
              </div>
            </article>
          </section>

          {/* ── Two-column grid ── */}
          <div className="ed-grid">
            {/* LEFT column */}
            <div className="ed-grid__left">
              {/* Mes projets */}
              <section className="ed-card">
                <div className="ed-card__header">
                  <div className="ed-card__title-group">
                    <span className="ed-card__icon" aria-hidden="true">🚀</span>
                    <h2 className="ed-card__title">Mes projets</h2>
                  </div>
                  <Link href="/espace-entrepreneur" className="ed-link-more">Voir tous →</Link>
                </div>

                {featuredProject ? (
                  <div className="ed-project-feat">
                    <div className="ed-project-feat__img" aria-hidden="true">
                      <span>⚡</span>
                    </div>
                    <div className="ed-project-feat__body">
                      <div className="ed-project-feat__top">
                        <span className="ed-badge ed-badge--green">En cours</span>
                        <h3 className="ed-project-feat__name">{featuredProject.title}</h3>
                        <p className="ed-project-feat__desc">{featuredProject.description?.slice(0, 65)}…</p>
                      </div>
                      <div className="ed-project-feat__progress">
                        <div className="ed-progress"><div className="ed-progress__bar" style={{ width: "70%" }} /></div>
                        <span className="ed-progress__pct">70%</span>
                      </div>
                      <div className="ed-project-feat__meta">
                        <span>📅 Lancé le {formatDate(featuredProject.createdAt ?? new Date().toISOString())}</span>
                        <span>⚡ {featuredProject.sector}</span>
                        <span>📍 {featuredProject.region}</span>
                      </div>
                      <Link href={`/espace-entrepreneur/modifier/${featuredProject.id}`} className="ed-btn ed-btn--outline-sm">
                        Gérer mon projet →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="ed-project-feat">
                    <div className="ed-project-feat__img ed-project-feat__img--solar" aria-hidden="true">
                      <span>☀️</span>
                    </div>
                    <div className="ed-project-feat__body">
                      <div className="ed-project-feat__top">
                        <span className="ed-badge ed-badge--green">En cours</span>
                        <h3 className="ed-project-feat__name">SolarGuinée</h3>
                        <p className="ed-project-feat__desc">Solutions solaires pour les ménages et entreprises en Guinée.</p>
                      </div>
                      <div className="ed-project-feat__progress">
                        <div className="ed-progress"><div className="ed-progress__bar" style={{ width: "70%" }} /></div>
                        <span className="ed-progress__pct">70%</span>
                      </div>
                      <div className="ed-project-feat__meta">
                        <span>📅 Lancé le 15 oct. 2026</span>
                        <span>⚡ Énergie</span>
                        <span>📍 Conakry</span>
                      </div>
                      <Link href="/espace-entrepreneur/nouveau" className="ed-btn ed-btn--outline-sm">
                        Gérer mon projet →
                      </Link>
                    </div>
                  </div>
                )}
              </section>

              {/* Outils entrepreneur */}
              <section className="ed-card">
                <div className="ed-card__header">
                  <div className="ed-card__title-group">
                    <span className="ed-card__icon" aria-hidden="true">🛠️</span>
                    <h2 className="ed-card__title">Outils entrepreneur</h2>
                  </div>
                  <Link href="/espace-entrepreneur" className="ed-link-more">Accéder à tous →</Link>
                </div>
                <div className="ed-tools">
                  {TOOLS.map((tool) => (
                    <button key={tool.id} type="button" className="ed-tool" style={{ "--tool-color": tool.color, "--tool-bg": tool.bg } as React.CSSProperties}>
                      <span className="ed-tool__icon" style={{ background: tool.bg }}>{tool.icon}</span>
                      <span className="ed-tool__label">{tool.label}</span>
                      <span className="ed-tool__sub">{tool.sub}</span>
                      <span className="ed-tool__arrow">→</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Réseau & Communauté */}
              <section className="ed-card">
                <div className="ed-card__header">
                  <div className="ed-card__title-group">
                    <span className="ed-card__icon" aria-hidden="true">👥</span>
                    <h2 className="ed-card__title">Réseau & Communauté</h2>
                  </div>
                </div>
                <p className="ed-community__sub">Échangez, collaborez et trouvez des partenaires</p>
                <div className="ed-community__row">
                  <div className="ed-community__avatars">
                    {COMMUNITY_AVATARS.map((a) => (
                      <span key={a.id} className="ed-community__avatar" style={{ background: a.bg }}>{a.initials}</span>
                    ))}
                    <span className="ed-community__avatar ed-community__avatar--more">+50</span>
                  </div>
                  <Link href="/espace-entrepreneur" className="ed-btn ed-btn--outline-sm">
                    Explorer le réseau →
                  </Link>
                </div>
              </section>
            </div>

            {/* RIGHT column */}
            <div className="ed-grid__right">
              {/* Opportunités & Financements */}
              <section className="ed-card">
                <div className="ed-card__header">
                  <div className="ed-card__title-group">
                    <span className="ed-card__icon" aria-hidden="true">📢</span>
                    <h2 className="ed-card__title">Opportunités & Financements</h2>
                  </div>
                  <Link href="/espace-entrepreneur" className="ed-link-more">Voir toutes →</Link>
                </div>
                <ul className="ed-opps">
                  {OPPORTUNITIES.map((opp) => (
                    <li key={opp.id} className="ed-opp">
                      <span className="ed-opp__img" style={{ background: opp.imgBg }}>{opp.img}</span>
                      <div className="ed-opp__body">
                        <p className="ed-opp__title">{opp.title}</p>
                        <p className="ed-opp__sub">{opp.sub}</p>
                      </div>
                      <div className="ed-opp__right">
                        <span className="ed-opp__time" style={{ background: opp.timeBg, color: opp.timeColor }}>{opp.time}</span>
                        <span className="ed-opp__arrow">›</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Mes rendez-vous */}
              <section className="ed-card">
                <div className="ed-card__header">
                  <div className="ed-card__title-group">
                    <span className="ed-card__icon" aria-hidden="true">📅</span>
                    <h2 className="ed-card__title">Mes rendez-vous</h2>
                  </div>
                  <Link href="/espace-entrepreneur" className="ed-link-more">Voir tous →</Link>
                </div>
                <div className="ed-rdv">
                  <div className="ed-rdv__date">
                    <span className="ed-rdv__day">{todayDay.slice(0, 3)}.</span>
                    <span className="ed-rdv__num">{todayDate}</span>
                    <span className="ed-rdv__month">{todayMonth.charAt(0).toUpperCase() + todayMonth.slice(1)}.</span>
                  </div>
                  <div className="ed-rdv__body">
                    <p className="ed-rdv__title">Réunion avec un investisseur</p>
                    <p className="ed-rdv__meta">10h00 – 11h00 | En ligne</p>
                  </div>
                  <button type="button" className="ed-btn ed-btn--primary-sm">
                    <span aria-hidden="true">▶</span> Rejoindre
                  </button>
                </div>
              </section>

              {/* Besoin d'accompagnement */}
              <section className="ed-cta-card">
                <div className="ed-cta-card__content">
                  <span className="ed-cta-card__icon" aria-hidden="true">🤝</span>
                  <h3 className="ed-cta-card__title">Besoin d'accompagnement ?</h3>
                  <p className="ed-cta-card__sub">Bénéficiez du soutien de nos experts et mentors</p>
                  <button type="button" className="ed-btn ed-btn--green-sm">
                    Demander un appui →
                  </button>
                </div>
                <div className="ed-cta-card__img" aria-hidden="true">👩‍💼</div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* ── Logout (hidden, accessible via paramètres) ── */}
      <button
        type="button"
        className="ed-logout-fab"
        onClick={() => void handleLogout()}
        disabled={isLoggingOut}
        aria-label="Se déconnecter"
        title="Se déconnecter"
      >
        {isLoggingOut ? "…" : "↩"}
      </button>
    </div>
  );
}
