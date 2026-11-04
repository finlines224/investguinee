"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { CatalogProject } from "../../data/project-catalog";
import {
  cancelInvestorAppointment,
  createInvestorAppointment,
  decideEntrepreneurAppointment,
  getAppointmentCatalog,
  type AppointmentQuery,
  type AppointmentRecord,
  type AppointmentStatus,
} from "../../lib/appointment-api";
import { getInvestorAccessRequests } from "../../lib/investor-access-api";

type AppointmentRole = "investor" | "entrepreneur" | "admin";

const pageSize = 10;

const statusLabels: Record<AppointmentStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  DECLINED: "Refusé",
  CANCELLED: "Annulé",
};

function getVisiblePages(page: number, pageCount: number) {
  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  return Array.from({ length: Math.min(pageCount, 5) }, (_, index) => firstPage + index);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date indisponible"
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(date);
}

function localDateTimeMinimum() {
  const now = new Date();
  now.setMinutes(Math.ceil((now.getMinutes() + 60) / 30) * 30, 0, 0);
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function getCollection(role: AppointmentRole) {
  if (role === "investor") return "investor/appointments/" as const;
  if (role === "entrepreneur") return "entrepreneur/appointments/" as const;
  return "admin/appointments/" as const;
}

export default function AppointmentManagement({
  role,
  projects = [],
  projectsLoading = false,
  projectsError = "",
}: {
  role: AppointmentRole;
  projects?: Pick<CatalogProject, "id" | "title">[];
  projectsLoading?: boolean;
  projectsError?: string;
}) {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AppointmentStatus>("all");
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [busyAppointmentId, setBusyAppointmentId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [approvedProjects, setApprovedProjects] = useState<
    Pick<CatalogProject, "id" | "title">[]
  >([]);
  const [approvedProjectsLoading, setApprovedProjectsLoading] = useState(
    role === "investor",
  );
  const [approvedProjectsError, setApprovedProjectsError] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [message, setMessage] = useState("");
  const [formBusy, setFormBusy] = useState(false);

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
      const request: AppointmentQuery = {
        query,
        status,
        page,
        pageSize,
      };
      setLoading(true);
      setError("");
      void getAppointmentCatalog(getCollection(role), request, controller.signal)
        .then((catalog) => {
          if (controller.signal.aborted) return;
          setAppointments(catalog.appointments);
          setPage(catalog.pagination.page);
          setPageCount(catalog.pagination.totalPages);
          setTotalResults(catalog.pagination.totalResults);
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Impossible de charger les rendez-vous.",
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
  }, [page, query, refreshCount, retryCount, role, status]);

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
  }, [retryCount, role]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject || !scheduledAt || formBusy) return;
    setFormBusy(true);
    setActionError("");
    setActionNotice("");
    try {
      await createInvestorAppointment({
        projectId: Number(selectedProject),
        scheduledAt: new Date(scheduledAt).toISOString(),
        message: message.trim(),
      });
      setSelectedProject("");
      setScheduledAt("");
      setMessage("");
      setPage(1);
      setStatus("all");
      setActionNotice("Votre demande de rendez-vous a été envoyée.");
      setRefreshCount((count) => count + 1);
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d’envoyer la demande de rendez-vous.",
      );
    } finally {
      setFormBusy(false);
    }
  }

  async function handleCancel(appointment: AppointmentRecord) {
    setBusyAppointmentId(appointment.id);
    setActionError("");
    setActionNotice("");
    try {
      await cancelInvestorAppointment(appointment.id);
      setActionNotice("La demande de rendez-vous a été annulée.");
      setRefreshCount((count) => count + 1);
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d’annuler ce rendez-vous.",
      );
    } finally {
      setBusyAppointmentId(null);
    }
  }

  async function handleDecision(
    appointment: AppointmentRecord,
    decision: "CONFIRMED" | "DECLINED",
  ) {
    setBusyAppointmentId(appointment.id);
    setActionError("");
    setActionNotice("");
    try {
      await decideEntrepreneurAppointment(appointment.id, decision, "");
      setActionNotice(
        decision === "CONFIRMED"
          ? "Le rendez-vous a été confirmé."
          : "La demande de rendez-vous a été refusée.",
      );
      setRefreshCount((count) => count + 1);
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible de traiter cette demande.",
      );
    } finally {
      setBusyAppointmentId(null);
    }
  }

  const visiblePages = getVisiblePages(page, pageCount);
  const publicProjectIds = new Set(projects.map((project) => project.id));
  const additionalApprovedProjects = approvedProjects.filter(
    (project) => !publicProjectIds.has(project.id),
  );
  const bookingProjectsLoading =
    projectsLoading || (role === "investor" && approvedProjectsLoading);
  const title =
    role === "investor"
      ? "Mes rendez-vous"
      : role === "entrepreneur"
        ? "Demandes de rendez-vous"
        : "Gestion des rendez-vous";
  const description =
    role === "investor"
      ? "Proposez un créneau aux porteurs de projet et suivez vos demandes."
      : role === "entrepreneur"
        ? "Consultez les demandes des investisseurs et répondez aux créneaux proposés."
        : "Consultez les rendez-vous de la plateforme sans modifier les décisions des participants.";

  return (
    <section className={`appointment-management appointment-management--${role}`}>
      <header className="appointment-management__heading">
        <div>
          <span>{role === "admin" ? "ADMINISTRATION" : "ESPACE RENDEZ-VOUS"}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {role === "investor" ? (
          <Link href="/espace-investisseur/explore">Découvrir les projets</Link>
        ) : null}
      </header>

      {role === "investor" ? (
        <form className="appointment-booking" onSubmit={(event) => void handleCreate(event)}>
          <div className="appointment-booking__heading">
            <div>
              <span>PRENDRE CONTACT</span>
              <h2>Demander un rendez-vous</h2>
            </div>
            <p>Les créneaux sont proposés par intervalles de 30 minutes.</p>
          </div>
          {projectsError ? <p className="appointment-management__error" role="alert">{projectsError}</p> : null}
          {approvedProjectsError ? (
            <p className="appointment-management__error" role="alert">
              Les projets avec accès approuvé ne sont pas disponibles : {approvedProjectsError}
            </p>
          ) : null}
          <div className="appointment-booking__fields">
            <label>
              <span>Projet</span>
              <select
                required
                value={selectedProject}
                onChange={(event) => setSelectedProject(event.target.value)}
                disabled={bookingProjectsLoading || (projects.length === 0 && additionalApprovedProjects.length === 0)}
              >
                <option value="">
                  {bookingProjectsLoading
                    ? "Chargement des projets…"
                    : projects.length + additionalApprovedProjects.length === 0
                      ? "Aucun projet accessible"
                      : "Choisir un projet"}
                </option>
                {projects.length > 0 && (
                  <optgroup label="Projets publiés">
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </optgroup>
                )}
                {additionalApprovedProjects.length > 0 && (
                  <optgroup label="Accès approuvé">
                    {additionalApprovedProjects.map((project) => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            <label>
              <span>Date et heure proposées</span>
              <input
                type="datetime-local"
                required
                step={1800}
                min={localDateTimeMinimum()}
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </label>
          </div>
          <label className="appointment-booking__message">
            <span>Motif de la rencontre</span>
            <textarea
              required
              minLength={10}
              maxLength={2000}
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Présentez brièvement les sujets que vous souhaitez aborder."
            />
            <small>{message.length}/2000 caractères</small>
          </label>
          <div className="appointment-booking__footer">
            <p>Le rendez-vous restera en attente jusqu’à la réponse de l’entrepreneur.</p>
            <button
              type="submit"
              disabled={
                formBusy ||
                bookingProjectsLoading ||
                projects.length + additionalApprovedProjects.length === 0
              }
            >
              {formBusy ? "Envoi…" : "Envoyer la demande"}
            </button>
          </div>
        </form>
      ) : null}

      {actionError ? <p className="appointment-management__error" role="alert">{actionError}</p> : null}
      {actionNotice ? <p className="appointment-management__notice" role="status">{actionNotice}</p> : null}

      <div className="appointment-management__toolbar">
        <label>
          <span>Rechercher</span>
          <input
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Projet, participant, motif…"
          />
        </label>
        <label>
          <span>Statut</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <p aria-live="polite">
          {loading && totalResults === 0
            ? "Chargement…"
            : `${totalResults} rendez-vous`}
        </p>
      </div>

      {error ? (
        <div className="appointment-management__state" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            Réessayer
          </button>
        </div>
      ) : loading && appointments.length === 0 ? (
        <p className="appointment-management__state" role="status">Chargement des rendez-vous…</p>
      ) : appointments.length ? (
        <div className="appointment-management__list" aria-busy={loading}>
          {appointments.map((appointment) => (
            <article className="appointment-row" key={appointment.id}>
              <div className="appointment-row__date">
                <span>CRÉNEAU PROPOSÉ</span>
                <strong>{formatDate(appointment.scheduledAt)}</strong>
                <small>Demandé le {formatDate(appointment.createdAt)}</small>
              </div>
              <div className="appointment-row__details">
                <div className="appointment-row__top">
                  <h2>{appointment.projectTitle}</h2>
                  <span className={`appointment-status appointment-status--${appointment.status.toLowerCase()}`}>
                    {appointment.statusLabel}
                  </span>
                </div>
                <p className="appointment-row__people">
                  {role === "investor"
                    ? `Entrepreneur : ${appointment.entrepreneur}`
                    : `Investisseur : ${appointment.investor}`}
                </p>
                {role === "admin" ? (
                  <p className="appointment-row__people">Entrepreneur : {appointment.entrepreneur}</p>
                ) : null}
                <p className="appointment-row__message">{appointment.message}</p>
                {appointment.responseNote ? (
                  <p className="appointment-row__response">Réponse : {appointment.responseNote}</p>
                ) : null}
                {role === "entrepreneur" && appointment.status === "PENDING" ? (
                  <div className="appointment-row__actions">
                    <button
                      type="button"
                      className="is-primary"
                      disabled={busyAppointmentId === appointment.id}
                      onClick={() => void handleDecision(appointment, "CONFIRMED")}
                    >
                      Confirmer
                    </button>
                    <button
                      type="button"
                      className="is-secondary"
                      disabled={busyAppointmentId === appointment.id}
                      onClick={() => void handleDecision(appointment, "DECLINED")}
                    >
                      Refuser
                    </button>
                  </div>
                ) : role === "investor" && appointment.status === "PENDING" ? (
                  <div className="appointment-row__actions">
                    <button
                      type="button"
                      className="is-secondary"
                      disabled={busyAppointmentId === appointment.id}
                      onClick={() => void handleCancel(appointment)}
                    >
                      Annuler la demande
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="appointment-management__state">
          <h2>Aucun rendez-vous trouvé</h2>
          <p>
            {role === "entrepreneur"
              ? "Les demandes des investisseurs apparaîtront ici."
              : role === "investor"
                ? "Envoyez une demande depuis le formulaire ou ajustez vos filtres."
                : "Aucun rendez-vous ne correspond à ces critères."}
          </p>
        </div>
      )}

      {!error && totalResults > 0 ? (
        <nav className="appointment-pagination" aria-label="Pagination des rendez-vous">
          <span>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalResults)} sur {totalResults}
          </span>
          <div>
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>
              Précédent
            </button>
            {visiblePages.map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={page === pageNumber ? "is-current" : ""}
                aria-current={page === pageNumber ? "page" : undefined}
                onClick={() => setPage(pageNumber)}
                disabled={loading}
              >
                {pageNumber}
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
