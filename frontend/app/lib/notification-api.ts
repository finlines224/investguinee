import { apiUrl } from "./auth-api";

export type NotificationRecord = {
  id: number;
  kind: "MESSAGE" | "APPOINTMENT" | "ACCESS_REQUEST" | "ANNOUNCEMENT";
  kindLabel: string;
  title: string;
  body: string;
  targetUrl: string;
  createdAt: string;
  readAt: string | null;
};

export type NotificationBroadcastRecord = {
  id: number;
  title: string;
  body: string;
  targetUrl: string;
  createdBy: string;
  createdAt: string;
  recipientCount: number;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
};

export type NotificationCatalog = {
  notifications: NotificationRecord[];
  unreadCount: number;
  pagination: Pagination;
};

export type BroadcastCatalog = {
  broadcasts: NotificationBroadcastRecord[];
  pagination: Pagination;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function parsePagination(value: unknown): Pagination | null {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.page) ||
    !isPositiveInteger(value.pageSize) ||
    !isNonNegativeInteger(value.totalResults) ||
    !isPositiveInteger(value.totalPages)
  ) {
    return null;
  }
  return {
    page: value.page,
    pageSize: value.pageSize,
    totalResults: value.totalResults,
    totalPages: value.totalPages,
  };
}

function parseNotification(value: unknown): NotificationRecord | null {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.id) ||
    (value.kind !== "MESSAGE" &&
      value.kind !== "APPOINTMENT" &&
      value.kind !== "ACCESS_REQUEST" &&
      value.kind !== "ANNOUNCEMENT") ||
    typeof value.kindLabel !== "string" ||
    typeof value.title !== "string" ||
    typeof value.body !== "string" ||
    typeof value.targetUrl !== "string" ||
    typeof value.createdAt !== "string" ||
    (value.readAt !== null && typeof value.readAt !== "string")
  ) {
    return null;
  }
  return {
    id: value.id,
    kind: value.kind,
    kindLabel: value.kindLabel,
    title: value.title,
    body: value.body,
    targetUrl: value.targetUrl,
    createdAt: value.createdAt,
    readAt: value.readAt,
  };
}

async function getErrorMessage(response: Response, fallback: string) {
  const payload: unknown = await response.json().catch(() => null);
  return isRecord(payload) && typeof payload.detail === "string"
    ? payload.detail
    : fallback;
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre le service de notifications.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "La demande de notification a échoué."),
    );
  }
  return response.json();
}

async function getCsrfToken() {
  const payload = await requestJson("auth/csrf/");
  if (!isRecord(payload) || typeof payload.csrfToken !== "string") {
    throw new Error("Le service n’a pas fourni de jeton de sécurité.");
  }
  return payload.csrfToken;
}

async function sendJson(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  payload?: Record<string, string>,
) {
  const csrfToken = await getCsrfToken();
  return requestJson(path, {
    method,
    headers: {
      "X-CSRFToken": csrfToken,
      ...(payload ? { "Content-Type": "application/json" } : {}),
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
}

function buildQuery(query: string, status: string, page: number, pageSize: number) {
  const params = new URLSearchParams({
    status,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (query.trim()) params.set("q", query.trim());
  return params.toString();
}

export async function getNotifications(
  query: string,
  status: "all" | "unread" | "read",
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<NotificationCatalog> {
  const payload = await requestJson(
    `notifications/?${buildQuery(query, status, page, pageSize)}`,
    { signal },
  );
  if (!isRecord(payload) || !Array.isArray(payload.notifications)) {
    throw new Error("Le service a renvoyé une liste de notifications invalide.");
  }
  const notifications = payload.notifications.map(parseNotification);
  const pagination = parsePagination(payload.pagination);
  if (
    notifications.some((item) => item === null) ||
    !pagination ||
    !isNonNegativeInteger(payload.unreadCount)
  ) {
    throw new Error("Le service a renvoyé une liste de notifications invalide.");
  }
  return {
    notifications: notifications.filter(
      (item): item is NotificationRecord => item !== null,
    ),
    unreadCount: payload.unreadCount,
    pagination,
  };
}

export async function markNotificationRead(notificationId: number) {
  const payload = await sendJson(`notifications/${notificationId}/`, "PATCH", {
    action: "mark_read",
  });
  if (!isRecord(payload) || !parseNotification(payload.notification)) {
    throw new Error("Le service a renvoyé une notification invalide.");
  }
}

export async function markAllNotificationsRead() {
  const payload = await sendJson("notifications/", "POST", {
    action: "mark_all_read",
  });
  if (!isRecord(payload) || !isNonNegativeInteger(payload.updated)) {
    throw new Error("Le service a renvoyé une réponse invalide.");
  }
  return payload.updated;
}

export async function deleteNotification(notificationId: number) {
  const payload = await sendJson(`notifications/${notificationId}/`, "DELETE");
  if (!isRecord(payload) || payload.success !== true) {
    throw new Error("La notification n’a pas pu être supprimée.");
  }
}

export async function getNotificationBroadcasts(
  query: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<BroadcastCatalog> {
  const payload = await requestJson(
    `admin/notifications/?${buildQuery(query, "all", page, pageSize)}`,
    { signal },
  );
  if (!isRecord(payload) || !Array.isArray(payload.broadcasts)) {
    throw new Error("Le service a renvoyé une liste d’annonces invalide.");
  }
  const broadcasts = payload.broadcasts.map((value) => {
    if (
      !isRecord(value) ||
      !isPositiveInteger(value.id) ||
      typeof value.title !== "string" ||
      typeof value.body !== "string" ||
      typeof value.targetUrl !== "string" ||
      typeof value.createdBy !== "string" ||
      typeof value.createdAt !== "string" ||
      !isNonNegativeInteger(value.recipientCount)
    ) {
      return null;
    }
    return {
      id: value.id,
      title: value.title,
      body: value.body,
      targetUrl: value.targetUrl,
      createdBy: value.createdBy,
      createdAt: value.createdAt,
      recipientCount: value.recipientCount,
    };
  });
  const pagination = parsePagination(payload.pagination);
  if (broadcasts.some((item) => item === null) || !pagination) {
    throw new Error("Le service a renvoyé une liste d’annonces invalide.");
  }
  return {
    broadcasts: broadcasts.filter(
      (item): item is NotificationBroadcastRecord => item !== null,
    ),
    pagination,
  };
}

export async function sendNotificationBroadcast(input: {
  title: string;
  body: string;
  targetUrl: string;
}) {
  const payload = await sendJson("admin/notifications/", "POST", input);
  if (!isRecord(payload) || !isRecord(payload.broadcast)) {
    throw new Error("Le service a renvoyé une annonce invalide.");
  }
  return payload.broadcast;
}
