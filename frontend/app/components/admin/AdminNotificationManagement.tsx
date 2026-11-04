"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  getNotificationBroadcasts,
  sendNotificationBroadcast,
  type NotificationBroadcastRecord,
} from "../../lib/notification-api";
import NotificationInbox from "../notifications/NotificationInbox";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export default function AdminNotificationManagement() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendNotice, setSendNotice] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [broadcasts, setBroadcasts] = useState<NotificationBroadcastRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(queryInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setLoadError("");
      void getNotificationBroadcasts(query, 1, 10, controller.signal)
        .then((catalog) => {
          if (!controller.signal.aborted) setBroadcasts(catalog.broadcasts);
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setLoadError(
              error instanceof Error ? error.message : "Impossible de charger les annonces.",
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
  }, [query, retryCount]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    if (!window.confirm("Envoyer cette annonce à tous les comptes actifs ?")) return;
    setSending(true);
    setSendError("");
    setSendNotice("");
    try {
      const broadcast = await sendNotificationBroadcast({
        title: title.trim(),
        body: body.trim(),
        targetUrl: targetUrl.trim(),
      });
      setTitle("");
      setBody("");
      setTargetUrl("");
      setSendNotice(
        `Annonce envoyée à ${String(broadcast.recipientCount)} compte(s) actif(s).`,
      );
      setRetryCount((count) => count + 1);
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : "Impossible d’envoyer cette annonce.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="admin-notification-management">
      <header className="admin-notification-management__heading">
        <div>
          <div className="admin-section-placeholder__breadcrumb">
            <span>Administration</span><span aria-hidden="true">›</span><strong>Notifications</strong>
          </div>
          <h1>Notifications de la plateforme</h1>
          <p>Consultez les alertes qui vous sont destinées et envoyez une annonce aux comptes actifs.</p>
        </div>
      </header>

      <form className="admin-broadcast-form" onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <span>COMMUNIQUÉ PLATEFORME</span>
          <h2>Envoyer une annonce</h2>
        </div>
        <label>
          <span>Titre</span>
          <input
            required
            maxLength={160}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex. Maintenance planifiée"
          />
        </label>
        <label>
          <span>Message</span>
          <textarea
            required
            maxLength={2000}
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Rédigez une information claire pour les utilisateurs."
          />
        </label>
        <label>
          <span>Lien interne facultatif</span>
          <input
            type="text"
            maxLength={300}
            value={targetUrl}
            onChange={(event) => setTargetUrl(event.target.value)}
            placeholder="/projets"
          />
        </label>
        <div className="admin-broadcast-form__footer">
          <p>Cette annonce sera visible dans la boîte de notifications des comptes actifs.</p>
          <button type="submit" disabled={sending}>
            {sending ? "Envoi…" : "Envoyer à tous"}
          </button>
        </div>
        {sendError ? <p className="admin-notification-management__error" role="alert">{sendError}</p> : null}
        {sendNotice ? <p className="admin-notification-management__notice" role="status">{sendNotice}</p> : null}
      </form>

      <section className="admin-broadcast-history">
        <div className="admin-broadcast-history__heading">
          <div>
            <span>HISTORIQUE</span>
            <h2>Annonces envoyées</h2>
          </div>
          <label>
            <span className="sr-only">Rechercher une annonce</span>
            <input
              type="search"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Rechercher…"
            />
          </label>
        </div>
        {loadError ? (
          <div className="admin-notification-management__state" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Réessayer</button>
          </div>
        ) : loading && !broadcasts.length ? (
          <p className="admin-notification-management__state" role="status">Chargement des annonces…</p>
        ) : broadcasts.length ? (
          <div className="admin-broadcast-list" aria-busy={loading}>
            {broadcasts.map((broadcast) => (
              <article className="admin-broadcast-row" key={broadcast.id}>
                <div>
                  <h3>{broadcast.title}</h3>
                  <p>{broadcast.body}</p>
                  {broadcast.targetUrl ? <small>Lien : {broadcast.targetUrl}</small> : null}
                </div>
                <div className="admin-broadcast-row__meta">
                  <strong>{broadcast.recipientCount} destinataire{broadcast.recipientCount === 1 ? "" : "s"}</strong>
                  <span>{formatDate(broadcast.createdAt)}</span>
                  <small>Par {broadcast.createdBy}</small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-notification-management__state">Aucune annonce envoyée.</p>
        )}
      </section>

      <NotificationInbox />
    </section>
  );
}
