"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, LockKeyhole, Search, Send } from "lucide-react";
import {
  createInvestorAccessRequest,
  getInvestorAccessRequests,
  getRestrictedProjects,
  type InvestorProjectAccessRequest,
  type RestrictedProject,
} from "../../lib/investor-access-api";
import ProjectIcon from "../projects/ProjectIcon";

const amountFormatter = new Intl.NumberFormat("fr-FR");

function getLocalDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(parsed);
}

export default function InvestorAccessRequests() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<RestrictedProject[]>([]);
  const [requests, setRequests] = useState<InvestorProjectAccessRequest[]>([]);
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [justifications, setJustifications] = useState<Record<number, string>>({});
  const [projectPage, setProjectPage] = useState(1);
  const [projectPageCount, setProjectPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void Promise.all([
        getRestrictedProjects(query, projectPage, controller.signal),
        getInvestorAccessRequests(controller.signal),
      ])
        .then(([projectCatalog, requestCatalog]) => {
          if (controller.signal.aborted) return;
          setProjects(projectCatalog.projects);
          setProjectPageCount(projectCatalog.pagination.totalPages);
          setRequests(requestCatalog.requests);
          setRequestsLoaded(true);
        })
        .catch((loadError: unknown) => {
          if (!controller.signal.aborted) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "Impossible de charger les demandes d’accès.",
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
  }, [projectPage, query, retryCount]);

  const submitRequest = async (project: RestrictedProject) => {
    setSubmittingId(project.id);
    setError("");
    setNotice("");
    try {
      await createInvestorAccessRequest(
        project.id,
        justifications[project.id] ?? "",
      );
      setJustifications((current) => ({ ...current, [project.id]: "" }));
      setNotice(`Votre demande pour « ${project.title} » a été envoyée.`);
      setRetryCount((count) => count + 1);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d’envoyer la demande d’accès.",
      );
    } finally {
      setSubmittingId(null);
    }
  };

  const latestRequestByProject = new Map<number, InvestorProjectAccessRequest>();
  for (const accessRequest of requests) {
    if (!latestRequestByProject.has(accessRequest.projectId)) {
      latestRequestByProject.set(accessRequest.projectId, accessRequest);
    }
  }
  const visibleProjects = projects.map((project) => {
    const accessRequest = latestRequestByProject.get(project.id);
    return accessRequest
      ? {
          ...project,
          request: {
            id: accessRequest.id,
            status: accessRequest.status,
            statusLabel: accessRequest.statusLabel,
          },
        }
      : project;
  });

  return (
    <div className="investor-access-requests">
      <p className="investor-access-requests__notice">
        Les projets restreints ne dévoilent pas leurs informations détaillées avant approbation par l’administration.
      </p>
      {notice && <p className="investor-access-requests__message is-success" role="status">{notice}</p>}
      {error && (
        <div className="investor-access-requests__message is-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Réessayer</button>
        </div>
      )}

      <label className="investor-access-requests__search">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">Rechercher un projet restreint</span>
        <input
          type="search"
          placeholder="Rechercher par projet, secteur ou région..."
          value={queryInput}
          onChange={(event) => {
            setQueryInput(event.target.value);
            setQuery(event.target.value.trim());
            setProjectPage(1);
          }}
        />
      </label>

      <section className="investor-access-requests__history" aria-labelledby="investor-access-history-title">
        <div className="investor-access-requests__section-heading">
          <div>
            <span>VOS DÉMARCHES</span>
            <h2 id="investor-access-history-title">Mes demandes</h2>
          </div>
          <strong>{requests.length}</strong>
        </div>
        {loading && !requestsLoaded ? (
          <p className="investor-access-requests__empty-history" role="status">
            Chargement de vos demandes…
          </p>
        ) : requests.length ? (
          <div className="investor-access-requests__history-list">
            {requests.map((accessRequest) => (
              <article key={accessRequest.id}>
                <span className={`investor-access-requests__status is-${accessRequest.status.toLowerCase()}`}>
                  {accessRequest.statusLabel}
                </span>
                <div>
                  <strong>{accessRequest.projectTitle}</strong>
                  <small>Envoyée le {getLocalDate(accessRequest.createdAt)}</small>
                  {accessRequest.reviewerNote && <p>Note de décision : {accessRequest.reviewerNote}</p>}
                </div>
                {accessRequest.status === "APPROVED" && (
                  <Link href={`/projets/${encodeURIComponent(accessRequest.projectSlug)}`}>
                    Ouvrir le projet <ProjectIcon name="arrow" size={14} />
                  </Link>
                )}
              </article>
            ))}
          </div>
        ) : requestsLoaded ? (
          <p className="investor-access-requests__empty-history">
            Aucune demande envoyée pour le moment.
          </p>
        ) : (
          <p className="investor-access-requests__empty-history" role="status">
            L’historique des demandes n’est pas disponible pour le moment.
          </p>
        )}
      </section>

      <section className="investor-access-requests__projects" aria-labelledby="investor-access-projects-title">
        <div className="investor-access-requests__section-heading">
          <div>
            <span>ACCÈS SUR AUTORISATION</span>
            <h2 id="investor-access-projects-title">Projets réservés</h2>
          </div>
          <LockKeyhole size={19} aria-hidden="true" />
        </div>
        {loading && visibleProjects.length === 0 ? (
          <p role="status">Chargement des projets réservés…</p>
        ) : visibleProjects.length ? (
          <div className="investor-access-requests__project-list" aria-busy={loading}>
            {visibleProjects.map((project) => (
              <article className="investor-access-project" key={project.id}>
                <div className="investor-access-project__meta">
                  <span>{project.sector}</span>
                  <span>{project.visibility === "MEMBERS_ONLY" ? "Membres" : "Restreint"}</span>
                </div>
                <h3>{project.title}</h3>
                <p>{project.region} · {project.stage}</p>
                <strong>
                  {amountFormatter.format(project.fundingGoal)} {project.currency}
                </strong>
                {project.request?.status === "APPROVED" ? (
                  <Link
                    className="investor-access-project__open"
                    href={`/projets/${encodeURIComponent(project.slug)}`}
                  >
                    <Check size={15} /> Accès accordé · Voir le projet
                  </Link>
                ) : project.request?.status === "PENDING" ? (
                  <p className="investor-access-project__pending" role="status">
                    Votre demande est en attente de décision.
                  </p>
                ) : (
                  <div className="investor-access-project__form">
                    {project.request?.status === "REJECTED" && (
                      <p>Votre précédente demande a été refusée. Vous pouvez en soumettre une nouvelle.</p>
                    )}
                    <label>
                      <span>Présentez brièvement votre intérêt (10 caractères minimum)</span>
                      <textarea
                        minLength={10}
                        maxLength={2000}
                        value={justifications[project.id] ?? ""}
                        onChange={(event) =>
                          setJustifications((current) => ({
                            ...current,
                            [project.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <button
                      type="button"
                      disabled={
                        submittingId !== null ||
                        (justifications[project.id] ?? "").trim().length < 10
                      }
                      onClick={() => void submitRequest(project)}
                    >
                      <Send size={14} />
                      {submittingId === project.id ? "Envoi…" : "Demander l’accès"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="investor-access-requests__empty-projects" role="status">
            <LockKeyhole size={23} />
            <h3>Aucun projet réservé disponible</h3>
            <p>Les projets publiés avec accès restreint apparaîtront ici.</p>
          </div>
        )}
        {projectPageCount > 1 && (
          <nav className="investor-access-requests__pagination" aria-label="Pagination des projets restreints">
            <button
              type="button"
              disabled={projectPage <= 1 || loading}
              onClick={() => setProjectPage((value) => value - 1)}
            >
              Précédent
            </button>
            <span>Page {projectPage} sur {projectPageCount}</span>
            <button
              type="button"
              disabled={projectPage >= projectPageCount || loading}
              onClick={() => setProjectPage((value) => value + 1)}
            >
              Suivant
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
