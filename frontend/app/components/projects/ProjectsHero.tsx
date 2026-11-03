import type { PublicProjectStats } from "../../lib/public-project-api";
import ProjectIcon from "./ProjectIcon";

export default function ProjectsHero({ stats }: { stats: PublicProjectStats | null }) {
  const displayStats = [
    { label: "Projets publiés", value: stats?.publishedProjects, icon: "folder" },
    { label: "Investisseurs", value: stats?.investors, icon: "handshake" },
    { label: "Entrepreneurs", value: stats?.entrepreneurs, icon: "rocket" },
  ] as const;

  return (
    <section className="projects-hero" aria-labelledby="projects-heading">
      <div className="projects-hero__inner">
        <div className="projects-hero__content">
          <span className="projects-hero__eyebrow">Investir autrement, bâtir ensemble</span>
          <h1 id="projects-heading">Explorer les projets</h1>
          <p>Découvrez des projets innovants et trouvez vos opportunités d’investissement en Guinée.</p>
        </div>
        {stats && (
          <div className="projects-hero__stats" aria-label="Statistiques du catalogue">
            {displayStats.map((stat) => (
              <div className="projects-hero__stat" key={stat.label}>
                <span className="projects-hero__stat-icon">
                  <ProjectIcon name={stat.icon} size={26} />
                </span>
                <strong>{stat.value?.toLocaleString("fr-FR") ?? "—"}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        )}
        {stats && <span className="projects-hero__disclaimer">Compteurs issus des données publiées.</span>}
      </div>
    </section>
  );
}
