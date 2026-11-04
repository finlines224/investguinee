"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  getInvestorAccessRequests,
  type InvestorAccessRequestCatalog,
} from "../../lib/investor-access-api";
import ProjectIcon from "../projects/ProjectIcon";

const pageSize = 6;

function formatDecisionDate(value: string | null) {
  if (!value) return "Date indisponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

export default function InvestorProjects() {
  const [catalog, setCatalog] = useState<InvestorAccessRequestCatalog | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void getInvestorAccessRequests(
        controller.signal,
        "APPROVED",
        page,
        pageSize,
      )
        .then((result) => {
          if (!controller.signal.aborted) setCatalog(result);
        })
        .catch((loadError: unknown) => {
          if (!controller.signal.aborted) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Impossible de charger vos projets accessibles.",
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, retryCount]);

  const requests = catalog?.requests ?? [];
  const pagination = catalog?.pagination;

  return (
    <div className="investor-projects">
      <p className="investor-workspace__notice">
        Cette liste regroupe les projets dont l’accès a été approuvé. Une autorisation de consultation ne signifie pas qu’un investissement a été réalisé.
      </p>

      {error && (
        <div className="investor-projects__error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            Réessayer
          </button>
        </div>
      )}

      {catalog && (
        <div className="investor-projects__summary" aria-live="polite">
          <ProjectIcon name="folder" size={18} />
          <strong>{pagination?.totalResults ?? requests.length}</strong>
          <span>
            projet{(pagination?.totalResults ?? requests.length) === 1 ? "" : "s"} accessible
            {(pagination?.totalResults ?? requests.length) === 1 ? "" : "s"}
          </span>
        </div>
      )}

      {requests.length > 0 ? (
        <div className="investor-projects__grid" aria-busy={loading}>
          {requests.map((request) => (
            <article className="investor-project-card" key={request.id}>
              <div className="investor-project-card__status">
                <Check size={15} aria-hidden="true" />
                <span>{request.statusLabel}</span>
              </div>
              <h2>{request.projectTitle}</h2>
              <p>{request.sector} · {request.region}</p>
              <small>Autorisé le {formatDecisionDate(request.decidedAt)}</small>
              {request.reviewerNote && (
                <p className="investor-project-card__note">
                  Note de décision : {request.reviewerNote}
                </p>
              )}
              <Link href={`/projets/${encodeURIComponent(request.projectSlug)}`}>
                Consulter le projet <ProjectIcon name="arrow" size={14} />
              </Link>
            </article>
          ))}
        </div>
      ) : loading ? (
        <p className="investor-projects__state" role="status">
          Chargement de vos projets accessibles…
        </p>
      ) : error ? null : (
        <div className="investor-projects__state">
          <ProjectIcon name="folder" size={27} />
          <h2>Aucun accès approuvé pour le moment</h2>
          <p>Les projets apparaîtront ici lorsque l’administration aura approuvé vos demandes d’accès.</p>
          <Link href="/espace-investisseur/requests">
            Voir mes demandes <ProjectIcon name="arrow" size={14} />
          </Link>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <nav className="investor-projects__pagination" aria-label="Pagination des projets accessibles">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Précédent
          </button>
          <span>Page {pagination.page} sur {pagination.totalPages}</span>
          <button
            type="button"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Suivant
          </button>
        </nav>
      )}
    </div>
  );
}
