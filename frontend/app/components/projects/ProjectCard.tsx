import Image from "next/image";
import Link from "next/link";
import type { CatalogProject } from "../../data/project-catalog";
import ProjectIcon from "./ProjectIcon";

const categoryTone = ["green", "blue", "amber"];

function formatAmount(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} GNF`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function ProjectCard({
  project,
  isFavorite,
  onToggleFavorite,
  projectHrefBase = "/projets",
  favoriteDisabled = false,
}: {
  project: CatalogProject;
  isFavorite: boolean;
  onToggleFavorite: (project: CatalogProject) => void;
  projectHrefBase?: string;
  favoriteDisabled?: boolean;
}) {
  const statusClass = project.status.toLowerCase().replaceAll(" ", "-");
  const projectHref = `${projectHrefBase}/${project.slug}`;

  return (
    <article className="catalog-card">
      <Link
        className="catalog-card__overlay-link"
        href={projectHref}
        aria-label={`Consulter le projet ${project.title}`}
      />
      <div className="catalog-card__image">
        <Image
          src={project.images[0]}
          alt={`Illustration du projet ${project.title}`}
          fill
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
        />
        <span className={`catalog-card__status catalog-card__status--${statusClass}`}>
          <span aria-hidden="true" />
          {project.status}
        </span>
        <button
          className={`catalog-card__favorite${isFavorite ? " catalog-card__favorite--active" : ""}`}
          type="button"
          disabled={favoriteDisabled}
          aria-label={isFavorite ? `Retirer ${project.title} des favoris` : `Ajouter ${project.title} aux favoris`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(project)}
        >
          <ProjectIcon name="heart" size={19} filled={isFavorite} />
        </button>
      </div>

      <div className="catalog-card__body">
        <div className="catalog-card__title-row">
          <Link className="catalog-card__title" href={projectHref}>
            {project.title}
          </Link>
          <span className="catalog-card__owner">{project.owner}</span>
        </div>
        <p className="catalog-card__description">{project.description}</p>
        <div className="catalog-card__categories">
          {project.sectors.map((sector, index) => (
            <span className={`catalog-chip catalog-chip--${categoryTone[index % categoryTone.length]}`} key={sector}>
              {sector}
            </span>
          ))}
        </div>
        <div className="catalog-card__facts">
          <span><ProjectIcon name="location" size={15} />{project.location}</span>
          <span className="catalog-card__amount"><ProjectIcon name="folder" size={15} />{formatAmount(project.amountRequested)}</span>
        </div>
        {project.fundingPercentage !== undefined && project.amountCollected !== undefined && (
          <div className="catalog-card__funding">
            <div className="catalog-card__funding-label">
              <span>Financement collecté</span>
              <strong>{project.fundingPercentage} %</strong>
            </div>
            <div
              className="catalog-card__progress"
              role="progressbar"
              aria-label={`Financement collecté pour ${project.title}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={project.fundingPercentage}
            >
              <span style={{ width: `${project.fundingPercentage}%` }} />
            </div>
            <div className="catalog-card__collected">
              <span>Collecté</span>
              <strong>{formatAmount(project.amountCollected)}</strong>
            </div>
          </div>
        )}
        <div className="catalog-card__footer">
          <span><ProjectIcon name="calendar" size={14} />{formatDate(project.publishedAt)}</span>
          {project.views !== undefined && <span><ProjectIcon name="eye" size={14} />{new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(project.views)} vues</span>}
          <Link href={projectHref} aria-label={`Voir le projet ${project.title}`}>
            Détails <ProjectIcon name="arrow" size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
