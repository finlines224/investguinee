import Link from "next/link";
import ProjectCard from "./ProjectCard";
import WhyInvestGuineePanel from "./WhyInvestGuineePanel";
import type { HomepageProject } from "../lib/homepage-api";

const sectorStyles: Record<string, { color: string; background: string; image: string }> = {
  Agriculture: { color: "#008F63", background: "#D0F8E9", image: "/project_agriculture.png" },
  Énergie: { color: "#d97706", background: "#fef3c7", image: "/project_solar.png" },
  Technologie: { color: "#2468B4", background: "#D9EDFF", image: "/project_edtech.png" },
};

function toCardProject(project: HomepageProject) {
  const style = sectorStyles[project.sector] ?? {
    color: "#008F63",
    background: "#D0F8E9",
    image: "/project_agriculture.png",
  };
  return {
    id: project.id,
    image: style.image,
    tag: project.sector,
    tagColor: style.color,
    tagBg: style.background,
    title: project.title,
    location: project.location,
    amount: `${new Intl.NumberFormat("fr-FR").format(project.fundingGoal)} GNF`,
    status: "Publié" as const,
  };
}

export default function RecentProjectsSection({
  projects,
  isAvailable,
}: {
  projects: HomepageProject[];
  isAvailable: boolean;
}) {
  return (
    <section className="projects-section" id="projets" aria-label="Projets récents">
      <div className="projects-section__inner">
        {/* Header */}
        <div className="projects-section__header">
          <div>
            <h2 className="projects-section__title">
              Projets récents
              <span className="projects-section__title-line" aria-hidden="true" />
            </h2>
          </div>
          <Link href="/projets" className="projects-section__view-all">
            Voir tous les projets
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {/* Main grid: project cards + side panel */}
        <div className="projects-section__layout">
          {/* Project cards grid */}
          <div className="projects-grid">
            {!isAvailable ? (
              <p role="status">Les projets sont momentanément indisponibles.</p>
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <ProjectCard key={project.id} project={toCardProject(project)} />
              ))
            ) : (
              <p role="status">Aucun projet n’est publié pour le moment.</p>
            )}
          </div>

          {/* Why InvestGuinée panel */}
          <WhyInvestGuineePanel />
        </div>
      </div>
    </section>
  );
}
