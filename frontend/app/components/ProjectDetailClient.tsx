"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type ProjectDetail } from "../data";
import ProjectGallery from "./ProjectGallery";

type Tab = "presentation" | "details" | "equipe" | "documents" | "historique";

const tabs: { id: Tab; label: string }[] = [
  { id: "presentation", label: "Présentation" },
  { id: "details", label: "Détails du projet" },
  { id: "equipe", label: "Équipe" },
  { id: "documents", label: "Documents (2)" },
  { id: "historique", label: "Historique" },
];

type Props = { project: ProjectDetail };

function CheckIcon({ color = "#008F63" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill={color} opacity="0.12"/>
      <path d="M7 12l3 3 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PresentationTab({ project }: Props) {
  return (
    <div className="pd-tab-content">
      <div className="pd-tab-grid">
        {/* Left column */}
        <div className="pd-tab-col">
          <div className="pd-section-block">
            <div className="pd-section-block__header">
              <CheckIcon color="#008F63" />
              <h3>Résumé du projet</h3>
            </div>
            <p>{project.summary}</p>
          </div>

          <div className="pd-section-block">
            <div className="pd-section-block__header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="12" fill="#ef4444" opacity="0.12"/>
                <path d="M12 8v4m0 4h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>Problème identifié</h3>
            </div>
            <p>{project.problem}</p>
          </div>
        </div>

        {/* Right column */}
        <div className="pd-tab-col">
          <div className="pd-section-block">
            <div className="pd-section-block__header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="12" fill="#f59e0b" opacity="0.15"/>
                <path d="M9 12l2 2 4-4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>Solution proposée</h3>
            </div>
            <p>{project.solution}</p>
          </div>

          <div className="pd-section-block">
            <div className="pd-section-block__header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="12" fill="#ef4444" opacity="0.12"/>
                <circle cx="12" cy="12" r="4" fill="#ef4444"/>
              </svg>
              <h3>Objectifs</h3>
            </div>
            <ul className="pd-objectives">
              {project.objectives.map((obj, i) => (
                <li key={i}>
                  <CheckIcon color="#008F63" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailsTab({ project }: Props) {
  return (
    <div className="pd-tab-content">
      <div className="pd-section-block">
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>Informations détaillées</h3>
        <table className="pd-details-table">
          <tbody>
            {Object.entries(project.keyInfo).map(([key, val]) => (
              <tr key={key}>
                <th>{key.charAt(0).toUpperCase() + key.slice(1)}</th>
                <td>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EquipeTab({ project }: Props) {
  return (
    <div className="pd-tab-content">
      <div className="pd-team-grid">
        {project.team.map((member, i) => (
          <div key={i} className="pd-team-card">
            <div className="pd-team-card__avatar">{member.avatar}</div>
            <div>
              <div className="pd-team-card__name">{member.name}</div>
              <div className="pd-team-card__role">{member.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentsTab({ project }: Props) {
  return (
    <div className="pd-tab-content">
      <div className="pd-docs-list">
        {project.documents.map((doc, i) => (
          <div key={i} className="pd-doc-item">
            <div className="pd-doc-item__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2468B4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="pd-doc-item__info">
              <div className="pd-doc-item__name">{doc.name}</div>
              <div className="pd-doc-item__meta">{doc.type} • {doc.size} • Ajouté le {doc.date}</div>
            </div>
            <button className="pd-doc-item__download" aria-label={`Télécharger ${doc.name}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Télécharger
            </button>
          </div>
        ))}
        <div className="pd-docs-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2468B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
          </svg>
          <span>Des documents supplémentaires sont disponibles après demande d&apos;accès.</span>
        </div>
      </div>
    </div>
  );
}

function HistoriqueTab({ project }: Props) {
  return (
    <div className="pd-tab-content">
      <div className="pd-timeline">
        {project.history.map((item, i) => (
          <div key={i} className="pd-timeline-item">
            <div className="pd-timeline-dot" />
            <div className="pd-timeline-content">
              <div className="pd-timeline-date">{item.date}</div>
              <div className="pd-timeline-event">{item.event}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectDetailClient({ project }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("presentation");
  const pct = Math.round((project.financing.raised / project.financing.goal) * 100);

  const tabComponents: Record<Tab, React.ReactNode> = {
    presentation: <PresentationTab project={project} />,
    details: <DetailsTab project={project} />,
    equipe: <EquipeTab project={project} />,
    documents: <DocumentsTab project={project} />,
    historique: <HistoriqueTab project={project} />,
  };

  return (
    <div className="pd-wrapper">
      {/* ── Hero Banner ── */}
      <div className="pd-hero-banner">
        <Image
          src={project.heroImage}
          alt={project.title}
          fill
          className="pd-hero-banner__img"
          sizes="100vw"
          priority
        />
        <div className="pd-hero-banner__overlay" />
        {/* Breadcrumb */}
        <div className="pd-breadcrumb">
          <Link href="/" className="pd-breadcrumb__link">Accueil</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
          <Link href="/projets" className="pd-breadcrumb__link">Projets</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
          <span className="pd-breadcrumb__current">Projet agricole intelligent</span>
        </div>
      </div>

      {/* ── Main content container ── */}
      <div className="pd-container">
        {/* ── Project Header ── */}
        <div className="pd-header">
          <div className="pd-header__left">
            {/* Status + actions */}
            <div className="pd-header__top-row">
              <span className="pd-status-badge pd-status-badge--published">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                {project.status}
              </span>
              <div className="pd-header__actions">
                <button className="pd-action-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                  Ajouter aux favoris
                </button>
                <button className="pd-action-btn pd-action-btn--primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Contacter le porteur
                </button>
              </div>
            </div>

            {/* Title */}
            <h1 className="pd-title">{project.title}</h1>
            <p className="pd-subtitle">{project.subtitle}</p>

            {/* Meta row */}
            <div className="pd-meta-row">
              <div className="pd-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008F63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2a7 7 0 015.292 11.586C15.796 15.415 12 22 12 22s-3.796-6.585-5.292-8.414A7 7 0 0112 2z"/><circle cx="12" cy="9" r="2.5"/>
                </svg>
                <span style={{ color: "#008F63", fontWeight: 600 }}>{project.category}</span>
              </div>
              <div className="pd-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {project.location}
              </div>
              <div className="pd-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                Stade : {project.stage}
              </div>
              <div className="pd-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Publié le {project.publishedAt}
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="pd-layout">
          {/* ── Left: gallery + tabs ── */}
          <div className="pd-main">
            {/* Gallery */}
            <div className="pd-card">
              <ProjectGallery project={project} />
            </div>

            {/* Tabs */}
            <div className="pd-card pd-card--no-pad">
              <nav className="pd-tabs" role="tablist" aria-label="Sections du projet">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-selected={activeTab === tab.id}
                    aria-controls={`panel-${tab.id}`}
                    className={`pd-tab${activeTab === tab.id ? " pd-tab--active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              <div
                role="tabpanel"
                id={`panel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
              >
                {tabComponents[activeTab]}
              </div>
            </div>
          </div>

          {/* ── Right: sidebar ── */}
          <aside className="pd-sidebar">
            {/* Owner card */}
            <div className="pd-card pd-owner-card">
              <div className="pd-card__title">Porteur du projet</div>
              <div className="pd-owner">
                <div className="pd-owner__logo">
                  <Image
                    src={project.owner.logo}
                    alt={`Logo de ${project.owner.name}`}
                    width={52}
                    height={52}
                    style={{ borderRadius: "50%", objectFit: "cover" }}
                  />
                </div>
                <div className="pd-owner__info">
                  <div className="pd-owner__name">
                    {project.owner.name}
                    {project.owner.verified && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#2468B4" aria-label="Vérifié" role="img">
                        <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                      </svg>
                    )}
                  </div>
                  <div className="pd-owner__type">{project.owner.type}</div>
                  <div className="pd-owner__badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#008F63" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Vérifié niveau {project.owner.level}
                  </div>
                  <div className="pd-owner__rating">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <span className="pd-owner__rating-val">{project.owner.rating}</span>
                    <span className="pd-owner__rating-count">({project.owner.reviews} avis)</span>
                  </div>
                </div>
              </div>
              <div className="pd-owner__stats">
                <div className="pd-owner__stat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Projets : <strong>{project.owner.projects}</strong>
                </div>
                <div className="pd-owner__stat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  Abonnés : <strong>{project.owner.subscribers}</strong>
                </div>
              </div>
              <a href="#profil" className="pd-owner__profile-btn">
                Voir le profil
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>

            {/* Financing card */}
            <div className="pd-card pd-financing-card">
              <div className="pd-financing__label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
                <span>Besoin de financement</span>
              </div>
              <div className="pd-financing__amount">
                {project.financing.goal.toLocaleString("fr-FR")} GNF
              </div>
              {/* Progress bar */}
              <div className="pd-financing__progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% financé`}>
                <div className="pd-financing__progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="pd-financing__meta">
                <span>Objectif : <strong>{project.financing.goal.toLocaleString("fr-FR")} GNF</strong></span>
                <span className="pd-financing__pct">{pct}%</span>
              </div>
              <div className="pd-financing__usage">
                Utilisation prévue des fonds : {project.financing.usage}
              </div>
              <button className="pd-access-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                Demander un accès<br/>
                <span>aux informations détaillées</span>
              </button>
            </div>

            {/* Key info card */}
            <div className="pd-card pd-keyinfo-card">
              <div className="pd-card__title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gray-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                </svg>
                Informations clés
              </div>
              <dl className="pd-keyinfo">
                {Object.entries(project.keyInfo).map(([key, val]) => {
                  const labels: Record<string, string> = {
                    sector: "Secteur",
                    location: "Localisation",
                    amount: "Montant recherché",
                    stage: "Stade",
                    visibility: "Visibilité",
                  };
                  return (
                    <div key={key} className="pd-keyinfo__row">
                      <dt>{labels[key] ?? key} :</dt>
                      <dd>{val}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
