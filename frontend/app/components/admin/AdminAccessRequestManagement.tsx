"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, RefreshCw, Search, X } from "lucide-react";
import {
  decideAdminAccessRequest,
  getAdminAccessRequests,
  type AdminAccessRequest,
} from "../../lib/admin-api";

const pageSize = 10;

function getVisiblePages(page: number, pageCount: number) {
  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  return Array.from({ length: Math.min(pageCount, 5) }, (_, index) => firstPage + index);
}

function getLocalDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(parsed);
}

export default function AdminAccessRequestManagement() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AdminAccessRequest["status"]>("PENDING");
  const [requests, setRequests] = useState<AdminAccessRequest[]>([]);
  const [statuses, setStatuses] = useState<
    { status: AdminAccessRequest["status"]; label: string }[]
  >([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void getAdminAccessRequests(
        { query, status, page, pageSize },
        controller.signal,
      )
        .then((catalog) => {
          if (controller.signal.aborted) return;
          setRequests(catalog.requests);
          setStatuses(catalog.statuses);
          setPage(catalog.pagination.page);
          setPageCount(catalog.pagination.totalPages);
          setTotalResults(catalog.pagination.totalResults);
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setError(
              requestError instanceof Error
                ? requestError.message
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
  }, [page, query, retryCount, status]);

  const decide = async (
    accessRequest: AdminAccessRequest,
    decision: "APPROVED" | "REJECTED",
  ) => {
    setSavingId(accessRequest.id);
    setError("");
    setNotice("");
    try {
      await decideAdminAccessRequest(
        accessRequest.id,
        decision,
        notes[accessRequest.id] ?? "",
      );
      setNotice(
        decision === "APPROVED"
          ? "La demande est approuvée. L’investisseur autorisé peut maintenant consulter le projet."
          : "La demande a été refusée. L’investisseur pourra soumettre une nouvelle demande.",
      );
      setRetryCount((count) => count + 1);
    } catch (decisionError) {
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : "Impossible d’enregistrer la décision.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const visiblePages = getVisiblePages(page, pageCount);
  const resultStart = totalResults ? (page - 1) * pageSize + 1 : 0;
  const resultEnd = Math.min(page * pageSize, totalResults);

  return (
    <section className="admin-access-requests">
      <div className="admin-access-requests__heading">
        <div>
          <div className="admin-section-placeholder__breadcrumb">
            <span>Administration</span><span aria-hidden="true">›</span><strong>Demandes d’accès</strong>
          </div>
          <h1>Demandes d’accès aux projets</h1>
          <p>Examinez les demandes des investisseurs pour les projets réservés ou restreints.</p>
        </div>
      </div>

      {notice && <p className="admin-access-requests__message is-success" role="status">{notice}</p>}
      {error && (
        <div className="admin-access-requests__message is-error" role="alert">
          <span>{error}</span>
          {!loading && (
            <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
              <RefreshCw size={14} /> Actualiser
            </button>
          )}
        </div>
      )}

      <div className="admin-access-requests__toolbar">
        <label className="admin-access-requests__search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Rechercher une demande</span>
          <input
            type="search"
            placeholder="Projet, investisseur ou justification..."
            value={queryInput}
            onChange={(event) => {
              setQueryInput(event.target.value);
              setQuery(event.target.value.trim());
              setPage(1);
            }}
          />
        </label>
        <label>
          <span className="sr-only">Filtrer les demandes par statut</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
          >
            <option value="all">Tous les statuts</option>
            {statuses.map((item) => (
              <option key={item.status} value={item.status}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="admin-access-requests__count" aria-live="polite">
        {loading && totalResults === 0
          ? "Chargement des demandes…"
          : `${totalResults} demande${totalResults > 1 ? "s" : ""}`}
      </p>

      {error && requests.length === 0 ? (
        <div className="admin-access-requests__state" role="alert">{error}</div>
      ) : loading && requests.length === 0 ? (
        <p className="admin-access-requests__state" role="status">Chargement des demandes…</p>
      ) : requests.length ? (
        <div className="admin-access-requests__list" aria-busy={loading}>
          {requests.map((accessRequest) => (
            <article className="admin-access-request" key={accessRequest.id}>
              <div className="admin-access-request__meta">
                <span>{accessRequest.sector}</span>
                <span className={`admin-access-request__status is-${accessRequest.status.toLowerCase()}`}>
                  {accessRequest.statusLabel}
                </span>
              </div>
              <h2>{accessRequest.projectTitle}</h2>
              <p className="admin-access-request__applicant">
                {accessRequest.investor} · {accessRequest.investorEmail}
              </p>
              <p className="admin-access-request__justification">{accessRequest.justification}</p>
              <small>
                {accessRequest.region} · Demande reçue le {getLocalDate(accessRequest.createdAt)}
              </small>
              {accessRequest.status === "PENDING" ? (
                <div className="admin-access-request__actions">
                  <label>
                    <span>Note de décision (facultative)</span>
                    <textarea
                      maxLength={2000}
                      value={notes[accessRequest.id] ?? ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [accessRequest.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div>
                    <button
                      type="button"
                      className="admin-access-request__approve"
                      disabled={savingId !== null}
                      onClick={() => void decide(accessRequest, "APPROVED")}
                    >
                      <Check size={15} />{savingId === accessRequest.id ? "Enregistrement…" : "Approuver"}
                    </button>
                    <button
                      type="button"
                      className="admin-access-request__reject"
                      disabled={savingId !== null}
                      onClick={() => void decide(accessRequest, "REJECTED")}
                    >
                      <X size={15} /> Refuser
                    </button>
                  </div>
                </div>
              ) : (
                <div className="admin-access-request__decision">
                  <Clock3 size={15} />
                  <span>
                    {accessRequest.reviewedBy ? `Décision par ${accessRequest.reviewedBy}` : "Demande traitée"}
                    {accessRequest.decidedAt ? ` · ${getLocalDate(accessRequest.decidedAt)}` : ""}
                    {accessRequest.reviewerNote ? ` · ${accessRequest.reviewerNote}` : ""}
                  </span>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-access-requests__state" role="status">
          <Clock3 size={24} />
          <h2>Aucune demande trouvée</h2>
          <p>Les nouvelles demandes d’accès apparaîtront ici.</p>
        </div>
      )}

      {pageCount > 1 && (
        <nav className="admin-access-requests__pagination" aria-label="Pagination des demandes">
          <span>{resultStart}–{resultEnd} sur {totalResults}</span>
          <div>
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Précédent</button>
            {visiblePages.map((visiblePage) => (
              <button
                key={visiblePage}
                type="button"
                className={visiblePage === page ? "is-current" : ""}
                aria-current={visiblePage === page ? "page" : undefined}
                onClick={() => setPage(visiblePage)}
              >
                {visiblePage}
              </button>
            ))}
            <button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Suivant</button>
          </div>
        </nav>
      )}
    </section>
  );
}
