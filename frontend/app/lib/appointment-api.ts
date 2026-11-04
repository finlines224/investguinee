import { apiUrl } from "./auth-api";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DECLINED"
  | "CANCELLED";

export type AppointmentRecord = {
  id: number;
  projectId: number;
  projectTitle: string;
  projectSlug: string;
  investor: string;
  investorEmail: string;
  entrepreneur: string;
  entrepreneurEmail: string;
  scheduledAt: string;
  message: string;
  status: AppointmentStatus;
  statusLabel: string;
  responseNote: string;
  createdAt: string;
  respondedAt: string | null;
  cancelledAt: string | null;
};

export type AppointmentCatalog = {
  appointments: AppointmentRecord[];
  statuses: { status: AppointmentStatus; label: string }[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
};

export type AppointmentQuery = {
  query: string;
  status: "all" | AppointmentStatus;
  page: number;
  pageSize: number;
};

type AppointmentCollection =
  | "investor/appointments/"
  | "entrepreneur/appointments/"
  | "admin/appointments/";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function parseStatus(value: unknown): value is AppointmentStatus {
  return (
    value === "PENDING" ||
    value === "CONFIRMED" ||
    value === "DECLINED" ||
    value === "CANCELLED"
  );
}

function parseAppointment(value: unknown): AppointmentRecord | null {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.id) ||
    !isPositiveInteger(value.projectId) ||
    typeof value.projectTitle !== "string" ||
    typeof value.projectSlug !== "string" ||
    typeof value.investor !== "string" ||
    typeof value.investorEmail !== "string" ||
    typeof value.entrepreneur !== "string" ||
    typeof value.entrepreneurEmail !== "string" ||
    typeof value.scheduledAt !== "string" ||
    typeof value.message !== "string" ||
    !parseStatus(value.status) ||
    typeof value.statusLabel !== "string" ||
    typeof value.responseNote !== "string" ||
    typeof value.createdAt !== "string" ||
    (value.respondedAt !== null && typeof value.respondedAt !== "string") ||
    (value.cancelledAt !== null && typeof value.cancelledAt !== "string")
  ) {
    return null;
  }
  return {
    id: value.id,
    projectId: value.projectId,
    projectTitle: value.projectTitle,
    projectSlug: value.projectSlug,
    investor: value.investor,
    investorEmail: value.investorEmail,
    entrepreneur: value.entrepreneur,
    entrepreneurEmail: value.entrepreneurEmail,
    scheduledAt: value.scheduledAt,
    message: value.message,
    status: value.status,
    statusLabel: value.statusLabel,
    responseNote: value.responseNote,
    createdAt: value.createdAt,
    respondedAt: value.respondedAt,
    cancelledAt: value.cancelledAt,
  };
}

function parseCatalog(value: unknown): AppointmentCatalog | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.appointments) ||
    !Array.isArray(value.statuses) ||
    !isRecord(value.pagination)
  ) {
    return null;
  }
  const appointments = value.appointments.map(parseAppointment);
  const statuses = value.statuses.map((item) => {
    if (!isRecord(item) || !parseStatus(item.status) || typeof item.label !== "string") {
      return null;
    }
    return { status: item.status, label: item.label };
  });
  const pagination = value.pagination;
  if (
    appointments.some((appointment) => appointment === null) ||
    statuses.some((status) => status === null) ||
    !isPositiveInteger(pagination.page) ||
    !isPositiveInteger(pagination.pageSize) ||
    typeof pagination.totalResults !== "number" ||
    !Number.isSafeInteger(pagination.totalResults) ||
    pagination.totalResults < 0 ||
    !isPositiveInteger(pagination.totalPages)
  ) {
    return null;
  }
  return {
    appointments: appointments.filter(
      (appointment): appointment is AppointmentRecord => appointment !== null,
    ),
    statuses: statuses.filter(
      (
        status,
      ): status is { status: AppointmentStatus; label: string } => status !== null,
    ),
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalResults: pagination.totalResults,
      totalPages: pagination.totalPages,
    },
  };
}

async function getErrorMessage(response: Response, fallback: string) {
  const payload: unknown = await response.json().catch(() => null);
  return isRecord(payload) && typeof payload.detail === "string"
    ? payload.detail
    : fallback;
}

export async function getAppointmentCatalog(
  collection: AppointmentCollection,
  query: AppointmentQuery,
  signal: AbortSignal,
): Promise<AppointmentCatalog> {
  const searchParams = new URLSearchParams({
    status: query.status,
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.query) searchParams.set("q", query.query);

  let response: Response;
  try {
    response = await fetch(
      apiUrl(`${collection}?${searchParams.toString()}`),
      {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
      },
    );
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre la gestion des rendez-vous.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Impossible de charger les rendez-vous."),
    );
  }
  const payload: unknown = await response.json();
  const catalog = parseCatalog(payload);
  if (!catalog) {
    throw new Error("Le service a renvoyé une liste de rendez-vous invalide.");
  }
  return catalog;
}

async function getCsrfToken() {
  let response: Response;
  try {
    response = await fetch(apiUrl("auth/csrf/"), {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible d’initialiser une connexion sécurisée.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error("Impossible d’initialiser une connexion sécurisée.");
  }
  const payload: unknown = await response.json();
  if (!isRecord(payload) || typeof payload.csrfToken !== "string") {
    throw new Error("Le service n’a pas fourni de jeton de sécurité.");
  }
  return payload.csrfToken;
}

async function sendMutation(
  path: string,
  payload: Record<string, number | string>,
): Promise<AppointmentRecord> {
  const csrfToken = await getCsrfToken();
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method: path === "investor/appointments/" ? "POST" : "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre la gestion des rendez-vous.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Impossible d’enregistrer le rendez-vous."),
    );
  }
  const body: unknown = await response.json();
  const appointment =
    isRecord(body) && "appointment" in body
      ? parseAppointment(body.appointment)
      : null;
  if (!appointment) {
    throw new Error("Le service a renvoyé un rendez-vous invalide.");
  }
  return appointment;
}

export function createInvestorAppointment(input: {
  projectId: number;
  scheduledAt: string;
  message: string;
}) {
  return sendMutation("investor/appointments/", input);
}

export function cancelInvestorAppointment(appointmentId: number) {
  return sendMutation(`investor/appointments/${appointmentId}/`, {
    action: "cancel",
  });
}

export function decideEntrepreneurAppointment(
  appointmentId: number,
  decision: "CONFIRMED" | "DECLINED",
  responseNote: string,
) {
  return sendMutation(`entrepreneur/appointments/${appointmentId}/`, {
    decision,
    responseNote,
  });
}
