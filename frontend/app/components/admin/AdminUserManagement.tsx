"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Search, ShieldCheck, UsersRound } from "lucide-react";
import { getAdminUsers, type AdminUser } from "../../lib/admin-api";

const pageSize = 10;

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

function initials(user: AdminUser) {
  const names = user.fullName.trim().split(/\s+/);
  return names.length > 1
    ? `${names[0][0] ?? ""}${names[names.length - 1][0] ?? ""}`.toUpperCase()
    : (names[0]?.slice(0, 2) ?? "U").toUpperCase();
}

export default function AdminUserManagement() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<{ role: string; label: string }[]>([]);
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
      void getAdminUsers(
        { query, role, status, page, pageSize },
        controller.signal,
      )
        .then((catalog) => {
          if (controller.signal.aborted) return;
          setUsers(catalog.users);
          setRoles(catalog.roles);
          setPage(catalog.pagination.page);
          setPageCount(catalog.pagination.totalPages);
          setTotalResults(catalog.pagination.totalResults);
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Impossible de charger les utilisateurs.",
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
  }, [page, query, retryCount, role, status]);

  const visiblePages = getVisiblePages(page, pageCount);
  const resultStart = totalResults ? (page - 1) * pageSize + 1 : 0;
  const resultEnd = Math.min(page * pageSize, totalResults);

  return (
    <section className="admin-users-management">
      <div className="admin-users-management__heading">
        <div>
          <div className="admin-section-placeholder__breadcrumb">
            <span>Administration</span><span aria-hidden="true">›</span><strong>Utilisateurs</strong>
          </div>
          <h1>Gestion des utilisateurs</h1>
          <p>Consultez les comptes enregistrés et filtrez par rôle ou statut.</p>
        </div>
      </div>

      <div className="admin-users-toolbar">
        <label className="admin-users-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Rechercher un utilisateur</span>
          <input
            type="search"
            placeholder="Nom ou adresse e-mail..."
            value={queryInput}
            onChange={(event) => {
              setQueryInput(event.target.value);
              setQuery(event.target.value.trim());
              setPage(1);
            }}
          />
        </label>
        <label>
          <span className="sr-only">Filtrer par rôle</span>
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous les rôles</option>
            {roles.map((item) => <option key={item.role} value={item.role}>{item.label}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Filtrer par statut</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Désactivés</option>
          </select>
        </label>
      </div>

      <p className="admin-users-count" aria-live="polite">
        {loading && totalResults === 0
          ? "Chargement des comptes…"
          : `${totalResults} utilisateur${totalResults > 1 ? "s" : ""}`}
      </p>

      {error ? (
        <div className="admin-users-state" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            Réessayer
          </button>
        </div>
      ) : loading && users.length === 0 ? (
        <p className="admin-users-state" role="status">Chargement des comptes…</p>
      ) : users.length ? (
        <div className="admin-users-list" aria-busy={loading}>
          {users.map((user) => (
            <article className="admin-user-row" key={user.id}>
              <span className="admin-user-row__avatar">{initials(user)}</span>
              <div className="admin-user-row__identity">
                <h2>{user.fullName}</h2>
                <p>{user.email}</p>
              </div>
              <span className="admin-user-row__role">{user.roleLabel}</span>
              <span className={`admin-user-row__status${user.isActive ? " is-active" : " is-inactive"}`}>
                <i aria-hidden="true" />
                {user.isActive ? "Actif" : "Désactivé"}
              </span>
              <span className={`admin-user-row__verification${user.isVerified ? " is-verified" : ""}`}>
                {user.isVerified ? <BadgeCheck size={15} /> : <ShieldCheck size={15} />}
                {user.isVerified ? "Vérifié" : "Non vérifié"}
              </span>
              <small>Inscrit le {getLocalDate(user.joinedAt)}</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-users-state" role="status">
          <UsersRound size={23} />
          <h2>Aucun utilisateur trouvé</h2>
          <p>Essayez une autre recherche ou modifiez les filtres.</p>
        </div>
      )}

      {totalResults > 0 && (
        <nav className="admin-users-pagination" aria-label="Pagination des utilisateurs">
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
