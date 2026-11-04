"use client";

import { useEffect, useState } from "react";
import {
  getInvestorSubscriptions,
  type InvestorSubscription,
  type InvestorSubscriptionCatalog,
  type InvestorSubscriptionFilter,
} from "../../lib/investor-subscriptions-api";
import ProjectIcon from "../projects/ProjectIcon";

function isSubscriptionFilter(value: string): value is InvestorSubscriptionFilter {
  return (
    value === "all" ||
    value === "ACTIVE" ||
    value === "EXPIRED" ||
    value === "CANCELLED"
  );
}

function formatSubscriptionDate(value: string | null) {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}

function formatAmount(subscription: InvestorSubscription) {
  return `${subscription.amountPaid.replace(/\.00$/, "")} ${subscription.currency}`;
}

export default function InvestorSubscriptionsWorkspace() {
  const [catalog, setCatalog] = useState<InvestorSubscriptionCatalog | null>(null);
  const [status, setStatus] = useState<InvestorSubscriptionFilter>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    getInvestorSubscriptions(page, status)
      .then((result) => {
        if (active) setCatalog(result);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de charger l’historique des abonnements.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, retryCount, status]);

  const updateFilter = (nextStatus: InvestorSubscriptionFilter) => {
    setLoading(true);
    setError("");
    setPage(1);
    setStatus(nextStatus);
  };

  const updatePage = (nextPage: number) => {
    setLoading(true);
    setError("");
    setPage(nextPage);
  };

  const retry = () => {
    setLoading(true);
    setError("");
    setRetryCount((count) => count + 1);
  };

  if (loading) {
    return <p role="status">Chargement de votre historique d’abonnements…</p>;
  }

  if (error || !catalog) {
    return (
      <div className="investor-subscriptions__state" role="alert">
        <p>{error || "Votre historique d’abonnements est indisponible."}</p>
        <button type="button" onClick={retry}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="investor-subscriptions">
      <p className="investor-subscriptions__notice">
        Historique en lecture seule. Les dossiers affichés sont enregistrés dans l’administration;
        aucun abonnement ni paiement n’est créé depuis cette page.
      </p>

      <section className="investor-subscriptions__summary" aria-label="Résumé des abonnements">
        <article>
          <span>Total des abonnements</span>
          <strong>{catalog.summary.totalCount}</strong>
          <small>Enregistrements de votre compte</small>
        </article>
        <article>
          <span>Abonnements actifs</span>
          <strong>{catalog.summary.activeCount}</strong>
          <small>Statut enregistré</small>
        </article>
      </section>

      <div className="investor-subscriptions__toolbar">
        <div>
          <span>VOTRE COMPTE</span>
          <h2>Historique des abonnements</h2>
        </div>
        <label>
          Statut
          <select
            value={status}
            onChange={(event) => {
              const nextStatus = event.target.value;
              if (isSubscriptionFilter(nextStatus)) updateFilter(nextStatus);
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="ACTIVE">Actifs</option>
            <option value="EXPIRED">Expirés</option>
            <option value="CANCELLED">Résiliés</option>
          </select>
        </label>
      </div>

      {catalog.subscriptions.length ? (
        <div className="investor-subscriptions__list" aria-busy={loading}>
          {catalog.subscriptions.map((subscription) => (
            <article className="investor-subscriptions__item" key={subscription.id}>
              <div className="investor-subscriptions__item-main">
                <div>
                  <span className="investor-subscriptions__eyebrow">OFFRE ENREGISTRÉE</span>
                  <h3>{subscription.planName}</h3>
                </div>
                <span
                  className={`investor-subscriptions__status investor-subscriptions__status--${subscription.status.toLowerCase()}`}
                >
                  {subscription.statusLabel}
                </span>
              </div>
              <div className="investor-subscriptions__details">
                <div><span>Montant enregistré</span><strong>{formatAmount(subscription)}</strong></div>
                <div><span>Début</span><strong>{formatSubscriptionDate(subscription.startedAt)}</strong></div>
                <div><span>Fin</span><strong>{formatSubscriptionDate(subscription.expiresAt)}</strong></div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="investor-subscriptions__empty">
          <ProjectIcon name="folder" size={23} />
          <h2>
            {catalog.summary.totalCount === 0
              ? "Aucun abonnement enregistré"
              : "Aucun abonnement pour ce statut"}
          </h2>
          <p>
            {catalog.summary.totalCount === 0
              ? "Les abonnements réels associés à votre compte apparaîtront ici lorsqu’ils auront été enregistrés."
              : "Essayez un autre filtre pour consulter votre historique."}
          </p>
        </div>
      )}

      {catalog.pagination.totalResults > 0 && (
        <nav className="investor-subscriptions__pagination" aria-label="Pagination de l’historique">
          <span>
            {catalog.pagination.totalResults} résultat{catalog.pagination.totalResults > 1 ? "s" : ""}
            {" · "}Page {catalog.pagination.page} sur {catalog.pagination.totalPages}
          </span>
          <div>
            <button
              type="button"
              disabled={catalog.pagination.page <= 1}
              onClick={() => updatePage(catalog.pagination.page - 1)}
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={catalog.pagination.page >= catalog.pagination.totalPages}
              onClick={() => updatePage(catalog.pagination.page + 1)}
            >
              Suivant
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
