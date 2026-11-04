"use client";

import { useEffect, useState } from "react";
import {
  getAdminConversations,
  type AdminConversation,
} from "../../lib/messaging-api";

const pageSize = 10;

function formatDate(value: string | null) {
  if (!value) return "Aucun message";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export default function AdminConversationManagement() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(queryInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void getAdminConversations(query, page, pageSize, controller.signal)
        .then((catalog) => {
          if (controller.signal.aborted) return;
          setConversations(catalog.conversations);
          setPage(catalog.pagination.page);
          setPageCount(catalog.pagination.totalPages);
          setTotalResults(catalog.pagination.totalResults);
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Impossible de charger les conversations.",
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
  }, [page, query, retryCount]);

  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  const visiblePages = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => firstPage + index,
  );

  return (
    <section className="admin-conversations-management">
      <header className="admin-conversations-management__heading">
        <div>
          <div className="admin-section-placeholder__breadcrumb">
            <span>Administration</span><span aria-hidden="true">›</span><strong>Messages</strong>
          </div>
          <h1>Conversations</h1>
          <p>Consultez les métadonnées des échanges sans accéder à leur contenu privé.</p>
        </div>
      </header>

      <p className="admin-conversations-management__privacy">
        Les messages et pièces privées ne sont pas affichés aux administrateurs.
      </p>

      <div className="admin-conversations-management__toolbar">
        <label>
          <span>Rechercher</span>
          <input
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Projet, investisseur, entrepreneur…"
          />
        </label>
        <p aria-live="polite">
          {loading && totalResults === 0
            ? "Chargement…"
            : `${totalResults} conversation${totalResults === 1 ? "" : "s"}`}
        </p>
      </div>

      {error ? (
        <div className="admin-conversations-management__state" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            Réessayer
          </button>
        </div>
      ) : loading && !conversations.length ? (
        <p className="admin-conversations-management__state" role="status">
          Chargement des conversations…
        </p>
      ) : conversations.length ? (
        <div className="admin-conversations-list" aria-busy={loading}>
          {conversations.map((conversation) => (
            <article className="admin-conversation-row" key={conversation.id}>
              <div>
                <span>PROJET</span>
                <h2>{conversation.projectTitle}</h2>
              </div>
              <div>
                <span>PARTICIPANTS</span>
                <p>{conversation.investor}</p>
                <p>{conversation.entrepreneur}</p>
              </div>
              <div>
                <span>ACTIVITÉ</span>
                <p>{conversation.messageCount} message{conversation.messageCount === 1 ? "" : "s"}</p>
                <small>Dernier échange : {formatDate(conversation.lastMessageAt)}</small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-conversations-management__state">
          <h2>Aucune conversation</h2>
          <p>Les nouvelles conversations apparaîtront ici sous forme de métadonnées uniquement.</p>
        </div>
      )}

      {!error && totalResults > 0 ? (
        <nav className="admin-conversations-pagination" aria-label="Pagination des conversations">
          <span>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalResults)} sur {totalResults}
          </span>
          <div>
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>
              Précédent
            </button>
            {visiblePages.map((number) => (
              <button
                type="button"
                key={number}
                className={page === number ? "is-current" : ""}
                aria-current={page === number ? "page" : undefined}
                disabled={loading}
                onClick={() => setPage(number)}
              >
                {number}
              </button>
            ))}
            <button type="button" disabled={page >= pageCount || loading} onClick={() => setPage((value) => value + 1)}>
              Suivant
            </button>
          </div>
        </nav>
      ) : null}
    </section>
  );
}
