"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, Search } from "lucide-react";
import { getAdminProjects, type AdminProject } from "../../lib/admin-api";

const pageSize = 10;

const amountFormatter = new Intl.NumberFormat("fr-FR");

function getVisiblePages(page: number, pageCount: number) {
  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  return Array.from({ length: Math.min(pageCount, 5) }, (_, index) => firstPage + index);
}

function getLocalDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(parsed);
}

function ProjectRow({ project }: { project: AdminProject }) {
  return (
    <article className="admin-project-row">
      <div className="admin-project-row__main">
        <div className="admin-project-row__meta">
          <span>{project.sector}</span>
          <span>{project.statusLabel}</span>
          <span>{project.visibility === "PUBLIC" ? "Public" : project.visibility === "MEMBERS_ONLY" ? "Membres" : "Restreint"}</span>
        </div>
        <h2>{project.title}</h2>
        <p>{project.description}</p>
        <small>
          Porteur : {project.owner}
          {project.organization ? ` · ${project.organization}` : ""}
        </small>
      </div>
      <details className="admin-project-row__details">
        <summary>Voir les détails</summary>
        <dl>
          <div><dt>Région</dt><dd>{project.city ? `${project.city}, ` : ""}{project.region}</dd></div>
          <div><dt>Stade</dt><dd>{project.stage}</dd></div>
          <div><dt>Financement demandé</dt><dd>{amountFormatter.format(project.fundingGoal)} {project.currency}</dd></div>
          <div><dt>Créé le</dt><dd>{getLocalDate(project.createdAt)}</dd></div>
          <div><dt>Mis à jour le</dt><dd>{getLocalDate(project.updatedAt)}</dd></div>
          {project.publishedAt && (
            <div><dt>Publié le</dt><dd>{getLocalDate(project.publishedAt)}</dd></div>
          )}
        </dl>
      </details>
    </article>
  );
}

export default function AdminProjectManagement() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sector, setSector] = useState("");
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [statuses, setStatuses] = useState<{ status: string; label: string }[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void getAdminProjects(
        { query, status, sector, page, pageSize },
        controller.signal,
      )
        .then((catalog) => {
          if (controller.signal.aborted) return;
          setProjects(catalog.projects);
          setStatuses(catalog.statuses);
          setSectors(catalog.sectors);
          setPage(catalog.pagination.page);
          setPageCount(catalog.pagination.totalPages);
          setTotalResults(catalog.pagination.totalResults);
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Impossible de charger les projets.",
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 200);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, query, retryCount, sector, status]);

  const visiblePages = getVisiblePages(page, pageCount);
  const resultStart = totalResults ? (page - 1) * pageSize + 1 : 0;
  const resultEnd = Math.min(page * pageSize, totalResults);

  return (
    <section className="admin-projects-management">
      <div className="admin-projects-management__heading">
        <div>
          <div className="admin-section-placeholder__breadcrumb">
            <span>Administration</span><span aria-hidden="true">›</span><strong>Projets</strong>
          </div>
          <h1>Gestion des projets</h1>
          <p>Consultez les projets enregistrés, leur statut et les informations publiées par leur porteur.</p>
        </div>
      </div>

      <div className="admin-projects-toolbar">
        <label className="admin-projects-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Rechercher un projet</span>
          <input
            type="search"
            placeholder="Projet, porteur, secteur ou région..."
            value={queryInput}
            onChange={(event) => {
              setQueryInput(event.target.value);
              setQuery(event.target.value.trim());
              setPage(1);
            }}
          />
        </label>
        <label>
          <span className="sr-only">Filtrer par statut</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous les statuts</option>
            {statuses.map((item) => <option key={item.status} value={item.status}>{item.label}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Filtrer par secteur</span>
          <select
            value={sector}
            onChange={(event) => {
              setSector(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous les secteurs</option>
            {sectors.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <p className="admin-projects-count" aria-live="polite">
        {loading && totalResults === 0
          ? "Chargement des projets…"
          : `${totalResults} projet${totalResults > 1 ? "s" : ""}`}
      </p>

      {error ? (
        <div className="admin-projects-state" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Réessayer</button>
        </div>
      ) : loading && projects.length === 0 ? (
        <p className="admin-projects-state" role="status">Chargement des projets…</p>
      ) : projects.length ? (
        <div className="admin-projects-list" aria-busy={loading}>
          {projects.map((project) => <ProjectRow key={project.id} project={project} />)}
        </div>
      ) : (
        <div className="admin-projects-state" role="status">
          <BriefcaseBusiness size={23} />
          <h2>Aucun projet trouvé</h2>
          <p>Essayez une autre recherche ou modifiez les filtres.</p>
        </div>
      )}

      {totalResults > 0 && (
        <nav className="admin-projects-pagination" aria-label="Pagination des projets">
          <p>Affichage de <strong>{resultStart}–{resultEnd}</strong> sur <strong>{totalResults}</strong></p>
          <div>
            <button type="button" disabled={page === 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Précédent</button>
            {visiblePages.map((pageNumber) => (
              <button
                key={pageNumber}
                className={pageNumber === page ? "is-current" : ""}
                type="button"
                aria-current={pageNumber === page ? "page" : undefined}
                disabled={loading}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button type="button" disabled={page === pageCount || loading} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Suivant</button>
          </div>
        </nav>
      )}
    </section>
  );
}
