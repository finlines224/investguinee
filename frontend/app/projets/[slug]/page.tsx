import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import Navbar from "../../components/Navbar";
import ProjectIcon from "../../components/projects/ProjectIcon";
import { getPublicProject } from "../../lib/public-project-api";

export const metadata: Metadata = {
  title: "Détail du projet | InvestGuinée",
  description: "Découvrez les informations détaillées de ce projet guinéen.",
};

async function ProjectOverviewContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let project;
  try {
    project = await getPublicProject(slug);
  } catch {
    return (
      <div className="page-wrapper">
        <Navbar />
        <main className="project-overview">
          <p role="alert">Cette fiche est momentanément indisponible.</p>
        </main>
      </div>
    );
  }
  if (!project) notFound();

  const amount = new Intl.NumberFormat("fr-FR").format(project.amountRequested);
  const date = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${project.publishedAt}T00:00:00Z`));

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="project-overview">
        <nav className="project-overview__breadcrumb" aria-label="Fil d’Ariane">
          <Link href="/">Accueil</Link>
          <span aria-hidden="true">/</span>
          <Link href="/projets">Explorer les projets</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{project.title}</span>
        </nav>
        <div className="project-overview__layout">
          <article className="project-overview__main">
            <div className="project-overview__image">
              <Image src={project.images[0]} alt={`Illustration du projet ${project.title}`} fill priority sizes="(max-width: 800px) 100vw, 70vw" />
              <span className={`catalog-card__status catalog-card__status--${project.status.toLowerCase().replaceAll(" ", "-")}`}>
                <span aria-hidden="true" />{project.status}
              </span>
            </div>
            <div className="project-overview__content">
              <div className="catalog-card__categories">
                {project.sectors.map((sector) => <span className="catalog-chip catalog-chip--green" key={sector}>{sector}</span>)}
              </div>
              <h1>{project.title}</h1>
              <p className="project-overview__description">{project.description}</p>
              <div className="project-overview__summary">
                <h2>À propos de ce projet</h2>
                <p>{project.summary}</p>
              </div>
              <div className="project-overview__meta">
                <span><ProjectIcon name="location" size={17} />{project.location}, Guinée</span>
                <span><ProjectIcon name="calendar" size={17} />Publié le {date}</span>
                <span><ProjectIcon name="folder" size={17} />{project.developmentStage}</span>
              </div>
              <div className="project-overview__owner">
                <span className="project-overview__owner-avatar" aria-hidden="true">{project.owner.slice(0, 1)}</span>
                <div><small>Porté par</small><strong>{project.owner}</strong></div>
              </div>
              <p className="project-overview__notice">Les informations sont publiées par le porteur du projet et ne constituent pas une offre d’investissement.</p>
            </div>
          </article>
          <aside className="project-overview__funding">
            <span className="project-overview__funding-label">Montant recherché</span>
            <strong className="project-overview__goal">{amount} GNF</strong>
            <Link href="/connexion" className="project-overview__contact">Contacter le porteur <ProjectIcon name="arrow" size={17} /></Link>
            <Link href="/projets" className="project-overview__back">← Retour aux projets</Link>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<main className="project-overview" aria-live="polite">Chargement du projet…</main>}>
      <ProjectOverviewContent params={params} />
    </Suspense>
  );
}
