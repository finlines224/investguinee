"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { CatalogProject } from "../../data/project-catalog";
import {
  getConversationMessages,
  getConversations,
  markConversationRead,
  sendConversationMessage,
  startConversation,
  type Conversation,
  type ConversationMessage,
  type MessagingRole,
} from "../../lib/messaging-api";
import { getInvestorAccessRequests } from "../../lib/investor-access-api";

function formatTimestamp(value: string | null) {
  if (!value) return "Aucun message";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

export default function ConversationWorkspace({
  role,
  projects = [],
  projectsLoading = false,
  projectsError = "",
}: {
  role: MessagingRole;
  projects?: Pick<CatalogProject, "id" | "title">[];
  projectsLoading?: boolean;
  projectsError?: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationPageCount, setConversationPageCount] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [startNotice, setStartNotice] = useState("");
  const [approvedProjects, setApprovedProjects] = useState<
    Pick<CatalogProject, "id" | "title">[]
  >([]);
  const [approvedProjectsLoading, setApprovedProjectsLoading] = useState(
    role === "investor",
  );
  const [approvedProjectsError, setApprovedProjectsError] = useState("");
  const [approvedProjectsRetry, setApprovedProjectsRetry] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(queryInput.trim());
      setConversationPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setListLoading(true);
      setListError("");
      void getConversations(role, query, conversationPage, 20, controller.signal)
        .then((catalog) => {
          if (controller.signal.aborted) return;
          setConversations(catalog.conversations);
          setConversationPage(catalog.pagination.page);
          setConversationPageCount(catalog.pagination.totalPages);
          setSelectedId((current) => {
            if (
              current !== null &&
              catalog.conversations.some((conversation) => conversation.id === current)
            ) {
              return current;
            }
            return catalog.conversations[0]?.id ?? null;
          });
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setListError(
              error instanceof Error ? error.message : "Impossible de charger les conversations.",
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setListLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [conversationPage, query, refreshCount, retryCount, role]);

  useEffect(() => {
    if (selectedId === null) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setMessagesLoading(true);
      setMessageError("");
      void getConversationMessages(role, selectedId, controller.signal)
        .then((items) => {
          if (controller.signal.aborted) return;
          setMessages(items);
          void markConversationRead(selectedId)
            .then(() => {
              if (!controller.signal.aborted) {
                setConversations((current) =>
                  current.map((conversation) =>
                    conversation.id === selectedId
                      ? { ...conversation, unreadCount: 0 }
                      : conversation,
                  ),
                );
              }
            })
            .catch((error: unknown) => {
              if (!controller.signal.aborted) {
                setMessageError(
                  error instanceof Error
                    ? error.message
                    : "Impossible de mettre à jour le statut de lecture.",
                );
              }
            });
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setMessageError(
              error instanceof Error ? error.message : "Impossible de charger les messages.",
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setMessagesLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [refreshCount, role, selectedId]);

  useEffect(() => {
    if (role !== "investor") return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setApprovedProjectsLoading(true);
      setApprovedProjectsError("");
      void getInvestorAccessRequests(controller.signal, "APPROVED", 1, 100)
        .then((catalog) => {
          if (!controller.signal.aborted) {
            const uniqueProjects = new Map<number, Pick<CatalogProject, "id" | "title">>();
            catalog.requests.forEach((request) => {
              uniqueProjects.set(request.projectId, {
                id: request.projectId,
                title: request.projectTitle,
              });
            });
            setApprovedProjects([...uniqueProjects.values()]);
          }
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setApprovedProjectsError(
              requestError instanceof Error
                ? requestError.message
                : "Impossible de charger les projets à accès approuvé.",
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setApprovedProjectsLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [approvedProjectsRetry, role]);

  async function handleStartConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId || !firstMessage.trim() || starting) return;
    setStarting(true);
    setStartError("");
    setStartNotice("");
    try {
      const result = await startConversation(Number(projectId), firstMessage.trim());
      setProjectId("");
      setFirstMessage("");
      setStartNotice("Votre message a été envoyé.");
      setSelectedId(result.conversation.id);
      setRefreshCount((count) => count + 1);
    } catch (error) {
      setStartError(
        error instanceof Error ? error.message : "Impossible de démarrer la conversation.",
      );
    } finally {
      setStarting(false);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (selectedId === null || !body || sending) return;
    setSending(true);
    setMessageError("");
    try {
      const message = await sendConversationMessage(role, selectedId, body);
      setMessages((current) => [...current, message]);
      setDraft("");
      setRefreshCount((count) => count + 1);
    } catch (error) {
      setMessageError(
        error instanceof Error ? error.message : "Impossible d’envoyer le message.",
      );
    } finally {
      setSending(false);
    }
  }

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ?? null;
  const publicProjectIds = new Set(projects.map((project) => project.id));
  const additionalApprovedProjects = approvedProjects.filter(
    (project) => !publicProjectIds.has(project.id),
  );
  const conversationProjectsLoading =
    projectsLoading || (role === "investor" && approvedProjectsLoading);

  return (
    <section className={`conversation-workspace conversation-workspace--${role}`}>
      <header className="conversation-workspace__heading">
        <div>
          <span>{role === "investor" ? "ESPACE INVESTISSEUR" : "ESPACE ENTREPRENEUR"}</span>
          <h1>Messagerie</h1>
          <p>Échangez en privé au sujet des projets publiés et accessibles.</p>
        </div>
      </header>

      {role === "investor" ? (
        <form className="conversation-start" onSubmit={(event) => void handleStartConversation(event)}>
          <h2>Contacter un porteur de projet</h2>
          {projectsError ? <p className="conversation-workspace__error" role="alert">{projectsError}</p> : null}
          {approvedProjectsError ? (
            <p className="conversation-workspace__error" role="alert">
              Les projets avec accès approuvé ne sont pas disponibles : {approvedProjectsError}{" "}
              <button
                type="button"
                onClick={() => setApprovedProjectsRetry((count) => count + 1)}
              >
                Réessayer
              </button>
            </p>
          ) : null}
          <div className="conversation-start__fields">
            <label>
              <span>Projet</span>
              <select
                required
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                disabled={
                  conversationProjectsLoading ||
                  (projects.length === 0 && additionalApprovedProjects.length === 0)
                }
              >
                <option value="">
                  {conversationProjectsLoading
                    ? "Chargement des projets…"
                    : projects.length + additionalApprovedProjects.length === 0
                      ? "Aucun projet accessible"
                      : "Choisir un projet"}
                </option>
                {projects.length > 0 && (
                  <optgroup label="Projets publiés">
                    {projects.map((project) => (
                      <option value={project.id} key={project.id}>{project.title}</option>
                    ))}
                  </optgroup>
                )}
                {additionalApprovedProjects.length > 0 && (
                  <optgroup label="Accès approuvé">
                    {additionalApprovedProjects.map((project) => (
                      <option value={project.id} key={project.id}>{project.title}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            <label>
              <span>Votre premier message</span>
              <textarea
                required
                maxLength={4000}
                rows={2}
                value={firstMessage}
                onChange={(event) => setFirstMessage(event.target.value)}
                placeholder="Présentez-vous et expliquez votre intérêt pour ce projet."
              />
            </label>
            <button
              type="submit"
              disabled={
                starting ||
                conversationProjectsLoading ||
                projects.length + additionalApprovedProjects.length === 0
              }
            >
              {starting ? "Envoi…" : "Envoyer"}
            </button>
          </div>
          {startError ? <p className="conversation-workspace__error" role="alert">{startError}</p> : null}
          {startNotice ? <p className="conversation-workspace__notice" role="status">{startNotice}</p> : null}
        </form>
      ) : null}

      <div className="conversation-layout">
        <aside className="conversation-list" aria-label="Conversations">
          <label className="conversation-list__search">
            <span className="sr-only">Rechercher une conversation</span>
            <input
              type="search"
              placeholder="Rechercher un projet ou participant…"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
            />
          </label>
          {listError ? (
            <div className="conversation-workspace__state" role="alert">
              <p>{listError}</p>
              <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Réessayer</button>
            </div>
          ) : listLoading && !conversations.length ? (
            <p className="conversation-workspace__state" role="status">Chargement des conversations…</p>
          ) : conversations.length ? (
            <ul>
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    className={selectedId === conversation.id ? "is-selected" : ""}
                    aria-current={selectedId === conversation.id ? "true" : undefined}
                    onClick={() => {
                      if (selectedId !== conversation.id) setMessages([]);
                      setSelectedId(conversation.id);
                    }}
                  >
                    <span className="conversation-list__avatar" aria-hidden="true">
                      {(role === "investor" ? conversation.entrepreneur : conversation.investor)
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>
                    <span className="conversation-list__summary">
                      <strong>{conversation.projectTitle}</strong>
                      <small>{role === "investor" ? conversation.entrepreneur : conversation.investor}</small>
                      <span>{conversation.lastMessageBody || "Commencez la conversation"}</span>
                    </span>
                    <span className="conversation-list__meta">
                      <time>{formatTimestamp(conversation.lastMessageAt)}</time>
                      {conversation.unreadCount ? <b>{conversation.unreadCount}</b> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="conversation-workspace__state">
              <h2>Aucune conversation</h2>
              <p>
                {role === "investor"
                  ? "Envoyez un premier message à partir du formulaire ci-dessus."
                  : "Les messages des investisseurs apparaîtront ici."}
              </p>
            </div>
          )}
          {conversationPageCount > 1 ? (
            <nav className="conversation-list__pagination" aria-label="Pagination des conversations">
              <button
                type="button"
                disabled={conversationPage <= 1 || listLoading}
                onClick={() => setConversationPage((page) => page - 1)}
              >
                Précédent
              </button>
              <span>{conversationPage} / {conversationPageCount}</span>
              <button
                type="button"
                disabled={conversationPage >= conversationPageCount || listLoading}
                onClick={() => setConversationPage((page) => page + 1)}
              >
                Suivant
              </button>
            </nav>
          ) : null}
        </aside>

        <section className="conversation-thread" aria-label="Messages de la conversation">
          {selectedConversation ? (
            <>
              <header className="conversation-thread__heading">
                <div>
                  <h2>{selectedConversation.projectTitle}</h2>
                  <p>
                    {role === "investor"
                      ? selectedConversation.entrepreneur
                      : selectedConversation.investor}
                  </p>
                </div>
              </header>
              <div className="conversation-thread__messages" aria-live="polite" aria-busy={messagesLoading}>
                {messagesLoading && !messages.length ? (
                  <p className="conversation-workspace__state" role="status">Chargement des messages…</p>
                ) : messages.length ? (
                  messages.map((message) => (
                    <article
                      key={message.id}
                      className={`conversation-message${message.isMine ? " conversation-message--mine" : ""}`}
                    >
                      <p>{message.body}</p>
                      <small>{message.isMine ? "Vous" : message.sender} · {formatTimestamp(message.createdAt)}</small>
                    </article>
                  ))
                ) : (
                  <p className="conversation-workspace__state">Aucun message dans cette conversation.</p>
                )}
              </div>
              {messageError ? <p className="conversation-workspace__error" role="alert">{messageError}</p> : null}
              <form className="conversation-reply" onSubmit={(event) => void handleSend(event)}>
                <label>
                  <span className="sr-only">Votre message</span>
                  <textarea
                    required
                    maxLength={4000}
                    rows={2}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Écrire un message…"
                  />
                </label>
                <button type="submit" disabled={sending || !draft.trim()}>
                  {sending ? "Envoi…" : "Envoyer"}
                </button>
              </form>
            </>
          ) : (
            <div className="conversation-workspace__state">
              <h2>Sélectionnez une conversation</h2>
              <p>Les échanges restent privés entre l’investisseur et le porteur du projet.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
