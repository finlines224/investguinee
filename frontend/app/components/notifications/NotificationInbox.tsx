"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRecord,
} from "../../lib/notification-api";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export default function NotificationInbox() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "unread" | "read">("all");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [busyId, setBusyId] = useState<number | "all" | null>(null);

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
      void getNotifications(query, status, page, 10, controller.signal)
        .then((catalog) => {
          if (controller.signal.aborted) return;
          setNotifications(catalog.notifications);
          setUnreadCount(catalog.unreadCount);
          setPage(catalog.pagination.page);
          setPageCount(catalog.pagination.totalPages);
          setTotalResults(catalog.pagination.totalResults);
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Impossible de charger les notifications.",
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
  }, [page, query, retryCount, status]);

  async function handleMarkRead(notification: NotificationRecord) {
    if (notification.readAt || busyId !== null) return;
    setBusyId(notification.id);
    setActionError("");
    try {
      await markNotificationRead(notification.id);
      if (status === "unread") {
        setNotifications((current) =>
          current.filter((item) => item.id !== notification.id),
        );
        setTotalResults((count) => Math.max(0, count - 1));
        if (totalResults === 1 && page > 1) setPage((current) => current - 1);
      } else {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, readAt: new Date().toISOString() }
              : item,
          ),
        );
      }
      setUnreadCount((count) =>
        count === null ? null : Math.max(0, count - 1),
      );
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de marquer la notification comme lue.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === null || unreadCount === 0 || busyId !== null) return;
    setBusyId("all");
    setActionError("");
    try {
      await markAllNotificationsRead();
      const readAt = new Date().toISOString();
      if (status === "unread") {
        setNotifications([]);
        setTotalResults(0);
      } else {
        setNotifications((current) =>
          current.map((item) => item.readAt ? item : { ...item, readAt }),
        );
      }
      setUnreadCount(0);
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de tout marquer comme lu.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(notification: NotificationRecord) {
    if (busyId !== null) return;
    setBusyId(notification.id);
    setActionError("");
    try {
      await deleteNotification(notification.id);
      setNotifications((current) =>
        current.filter((item) => item.id !== notification.id),
      );
      setTotalResults((count) => Math.max(0, count - 1));
      if (totalResults === 1 && page > 1) setPage((current) => current - 1);
      if (!notification.readAt) {
        setUnreadCount((count) =>
          count === null ? null : Math.max(0, count - 1),
        );
      }
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de supprimer cette notification.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const visiblePages = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => Math.max(1, Math.min(page - 2, pageCount - 4)) + index,
  );

  return (
    <section className="notification-center">
      <header className="notification-center__heading">
        <div>
          <span>VOTRE ACTIVITÉ</span>
          <h2>Notifications reçues</h2>
          <p>Les alertes liées à vos demandes, rendez-vous et messages.</p>
        </div>
        <div className="notification-center__unread">
          <strong>{unreadCount ?? "—"}</strong>
          <span>{unreadCount === 1 ? "notification non lue" : "notifications non lues"}</span>
        </div>
      </header>

      <div className="notification-center__toolbar">
        <label>
          <span className="sr-only">Rechercher une notification</span>
          <input
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Rechercher dans les notifications…"
          />
        </label>
        <label>
          <span className="sr-only">Filtrer les notifications</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
          >
            <option value="all">Toutes</option>
            <option value="unread">Non lues</option>
            <option value="read">Lues</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void handleMarkAllRead()}
          disabled={unreadCount === null || unreadCount === 0 || busyId !== null}
        >
          Tout marquer comme lu
        </button>
      </div>

      {actionError ? <p className="notification-center__error" role="alert">{actionError}</p> : null}
      {error ? (
        <div className="notification-center__state" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Réessayer</button>
        </div>
      ) : loading && !notifications.length ? (
        <p className="notification-center__state" role="status">Chargement des notifications…</p>
      ) : notifications.length ? (
        <div className="notification-list" aria-busy={loading}>
          {notifications.map((notification) => (
            <article
              className={`notification-card${notification.readAt ? "" : " notification-card--unread"}`}
              key={notification.id}
            >
              <span className="notification-card__kind">{notification.kindLabel}</span>
              <div className="notification-card__content">
                <div className="notification-card__title">
                  <h3>{notification.title}</h3>
                  {!notification.readAt ? <span>Nouvelle</span> : null}
                </div>
                <p>{notification.body}</p>
                <time dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>
                {notification.targetUrl ? (
                  <Link href={notification.targetUrl} onClick={() => void handleMarkRead(notification)}>
                    Consulter <span aria-hidden="true">→</span>
                  </Link>
                ) : null}
              </div>
              <div className="notification-card__actions">
                {!notification.readAt ? (
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void handleMarkRead(notification)}
                  >
                    Marquer comme lue
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => void handleDelete(notification)}
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="notification-center__state">
          <h3>{status === "unread" ? "Aucune notification non lue" : "Aucune notification"}</h3>
          <p>Les nouvelles alertes apparaîtront ici.</p>
        </div>
      )}

      {!error && totalResults > 0 ? (
        <nav className="notification-pagination" aria-label="Pagination des notifications">
          <span>{(page - 1) * 10 + 1}–{Math.min(page * 10, totalResults)} sur {totalResults}</span>
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
