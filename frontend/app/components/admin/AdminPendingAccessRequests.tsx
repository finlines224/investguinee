"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, RefreshCw, X } from "lucide-react";
import {
  decideAdminAccessRequest,
  getAdminAccessRequests,
  type AdminAccessRequest,
} from "../../lib/admin-api";

export default function AdminPendingAccessRequests({
  onViewAll,
}: {
  onViewAll: () => void;
}) {
  const [requests, setRequests] = useState<AdminAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void getAdminAccessRequests(
        { query: "", status: "PENDING", page: 1, pageSize: 3 },
        controller.signal,
      )
        .then((catalog) => {
          if (!controller.signal.aborted) setRequests(catalog.requests);
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Impossible de charger les demandes en attente.",
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
  }, [retryCount]);

  const decide = async (
    accessRequest: AdminAccessRequest,
    decision: "APPROVED" | "REJECTED",
  ) => {
    setSavingId(accessRequest.id);
    setError("");
    try {
      await decideAdminAccessRequest(accessRequest.id, decision, "");
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

  return (
    <section className="admin-card admin-requests-card">
      <div className="admin-card__heading">
        <div className="admin-card__title">
          <span className="admin-card__title-icon admin-card__title-icon--orange"><Clock3 size={18} /></span>
          <span><h2>Demandes en attente</h2><small>Données du service de demandes d’accès</small></span>
        </div>
        <button className="admin-text-button" type="button" onClick={onViewAll}>
          Voir toutes <Clock3 size={14} />
        </button>
      </div>
      {error && (
        <p className="admin-request-list__error" role="alert">
          {error}
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            <RefreshCw size={13} /> Réessayer
          </button>
        </p>
      )}
      {loading && requests.length === 0 ? (
        <p className="admin-request-list__empty" role="status">Chargement des demandes…</p>
      ) : requests.length ? (
        <div className="admin-request-list">
          {requests.map((accessRequest) => (
            <article className="admin-request" key={accessRequest.id}>
              <span className="admin-request__avatar">
                {`${accessRequest.investor[0] ?? ""}${accessRequest.investor.split(" ").at(-1)?.[0] ?? ""}`.toUpperCase()}
              </span>
              <span className="admin-request__person">
                <strong>{accessRequest.investor}</strong>
                <small>{accessRequest.projectTitle}</small>
                <em><span />En attente · {accessRequest.investorEmail}</em>
              </span>
              <div className="admin-request__actions">
                <button
                  className="admin-request__approve"
                  type="button"
                  disabled={savingId !== null}
                  onClick={() => void decide(accessRequest, "APPROVED")}
                  aria-label={`Approuver la demande de ${accessRequest.investor}`}
                >
                  <Check size={16} /><span>Approuver</span>
                </button>
                <button
                  className="admin-request__reject"
                  type="button"
                  disabled={savingId !== null}
                  onClick={() => void decide(accessRequest, "REJECTED")}
                  aria-label={`Refuser la demande de ${accessRequest.investor}`}
                >
                  <X size={16} /><span>Refuser</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="admin-request-list__empty" role="status">
          Aucune demande d’accès en attente.
        </p>
      )}
    </section>
  );
}
