"use client";

import { useEffect, useState } from "react";
import { Building2, Search } from "lucide-react";
import {
  getAdminOrganizations,
  type AdminOrganization,
} from "../../lib/admin-api";

const pageSize = 10;

const statusClassNames: Record<string, string> = {
  APPROVED: "is-approved",
  REJECTED: "is-rejected",
  SUSPENDED: "is-suspended",
  IN_REVIEW: "is-reviewing",
  SUBMITTED: "is-reviewing",
  MORE_INFO_REQUIRED: "is-reviewing",
};

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

function OrganizationRow({
  organization,
}: {
  organization: AdminOrganization;
}) {
  const statusClass =
    statusClassNames[organization.verificationStatus] ?? "is-pending";
  return (
    <article className="admin-organization-row">
      <div className="admin-organization-row__main">
        <div className="admin-organization-row__meta">
          <span>{organization.type || "Type non renseigné"}</span>
          <span className={`admin-organization-row__status ${statusClass}`}>
            {organization.verificationStatusLabel}
          </span>
        </div>
        <h2>{organization.name}</h2>
        <p>
          {[organization.city, organization.region]
            .filter(Boolean)
            .join(", ") || "Localisation non renseignée"}
          {" · "}
          {organization.memberCount} membre{organization.memberCount > 1 ? "s" : ""}
        </p>
        <small>Créée par {organization.createdBy}</small>
      </div>
      <details className="admin-organization-row__details">
        <summary>Voir les détails</summary>
        <dl>
          <div><dt>Raison sociale</dt><dd>{organization.legalName}</dd></div>
          <div>
            <dt>Immatriculation</dt>
            <dd>{organization.registrationNumber || "Non renseignée"}</dd>
          </div>
          <div><dt>Pays</dt><dd>{organization.countryCode}</dd></div>
          <div><dt>Site web</dt><dd>{organization.websiteUrl || "Non renseigné"}</dd></div>
          <div><dt>Créée le</dt><dd>{getLocalDate(organization.createdAt)}</dd></div>
          <div><dt>Mise à jour le</dt><dd>{getLocalDate(organization.updatedAt)}</dd></div>
          {organization.description && (
            <div className="admin-organization-row__description">
              <dt>Description</dt><dd>{organization.description}</dd>
            </div>
          )}
        </dl>
      </details>
    </article>
  );
}

export default function AdminOrganizationManagement() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [statuses, setStatuses] = useState<{ status: string; label: string }[]>([]);
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
      void getAdminOrganizations(
        { query, status, page, pageSize },
        controller.signal,
      )
        .then((catalog) => {
          if (controller.signal.aborted) return;
          setOrganizations(catalog.organizations);
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
                : "Impossible de charger les organisations.",
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

  const visiblePages = getVisiblePages(page, pageCount);
  const resultStart = totalResults ? (page - 1) * pageSize + 1 : 0;
  const resultEnd = Math.min(page * pageSize, totalResults);

  return (
    <section className="admin-organizations-management">
      <div className="admin-organizations-management__heading">
        <div>
          <div className="admin-section-placeholder__breadcrumb">
            <span>Administration</span><span aria-hidden="true">›</span><strong>Entreprises &amp; Organisations</strong>
          </div>
          <h1>Entreprises &amp; Organisations</h1>
          <p>Consultez les organisations enregistrées et leur statut de vérification.</p>
        </div>
      </div>

      <div className="admin-organizations-toolbar">
        <label className="admin-organizations-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Rechercher une organisation</span>
          <input
            type="search"
            placeholder="Nom, immatriculation, région ou créateur..."
            value={queryInput}
            onChange={(event) => {
              setQueryInput(event.target.value);
              setQuery(event.target.value.trim());
              setPage(1);
            }}
          />
        </label>
        <label>
          <span className="sr-only">Filtrer par statut de vérification</span>
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
      </div>

      <p className="admin-organizations-count" aria-live="polite">
        {loading && totalResults === 0
          ? "Chargement des organisations…"
          : `${totalResults} organisation${totalResults > 1 ? "s" : ""}`}
      </p>

      {error ? (
        <div className="admin-organizations-state" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Réessayer</button>
        </div>
      ) : loading && organizations.length === 0 ? (
        <p className="admin-organizations-state" role="status">Chargement des organisations…</p>
      ) : organizations.length ? (
        <div className="admin-organizations-list" aria-busy={loading}>
          {organizations.map((organization) => (
            <OrganizationRow key={organization.id} organization={organization} />
          ))}
        </div>
      ) : (
        <div className="admin-organizations-state" role="status">
          <Building2 size={23} />
          <h2>Aucune organisation trouvée</h2>
          <p>Essayez une autre recherche ou modifiez le filtre de statut.</p>
        </div>
      )}

      {totalResults > 0 && (
        <nav className="admin-organizations-pagination" aria-label="Pagination des organisations">
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
