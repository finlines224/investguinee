import Image from "next/image";
import { type Project } from "../data";

const statusConfig: Record<string, { bg: string; color: string; dot: string }> = {
  "En cours": { bg: "#D0F8E9", color: "#005C40", dot: "#008F63" },
  "Publié": { bg: "#D0F8E9", color: "#005C40", dot: "#008F63" },
  "En recherche": { bg: "#D9EDFF", color: "#0F3E7A", dot: "#2468B4" },
};

export default function ProjectCard({ project }: { project: Project }) {
  const status = statusConfig[project.status] ?? { bg: "#f3f4f6", color: "#374151", dot: "#6b7280" };

  return (
    <article
      className="project-card"
      role="article"
      aria-label={`Projet: ${project.title}`}
    >
      {/* Image area */}
      <div className="project-card__image-wrap">
        <Image
          src={project.image}
          alt={`Image du projet ${project.title}`}
          fill
          className="project-card__image"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />
        <span
          className="project-card__tag"
          style={{ background: project.tagBg, color: project.tagColor }}
        >
          {project.tag}
        </span>
      </div>

      {/* Content */}
      <div className="project-card__body">
        <h3 className="project-card__title">{project.title}</h3>

        <div className="project-card__meta">
          <div className="project-card__location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {project.location}
          </div>
        </div>

        <div className="project-card__footer">
          <div className="project-card__amount">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008F63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
            <span>{project.amount}</span>
          </div>
          <span
            className="project-card__status"
            style={{ background: status.bg, color: status.color }}
          >
            <span
              className="project-card__status-dot"
              style={{ background: status.dot }}
              aria-hidden="true"
            />
            {project.status}
          </span>
        </div>
      </div>
    </article>
  );
}
