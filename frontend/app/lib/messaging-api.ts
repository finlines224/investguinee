import { apiUrl } from "./auth-api";

export type MessagingRole = "investor" | "entrepreneur";
export type ConversationCollection = MessagingRole | "admin";

export type Conversation = {
  id: number;
  projectId: number;
  projectTitle: string;
  investor: string;
  entrepreneur: string;
  lastMessageBody: string;
  lastMessageSenderId: number | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
};

export type ConversationMessage = {
  id: number;
  senderId: number;
  sender: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
};

export type AdminConversation = {
  id: number;
  projectTitle: string;
  investor: string;
  entrepreneur: string;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
};

export type ConversationPagination = {
  page: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
};

export type ConversationList = {
  conversations: Conversation[];
  pagination: ConversationPagination;
};

export type AdminConversationList = {
  conversations: AdminConversation[];
  pagination: ConversationPagination;
};

const roleBasePath: Record<MessagingRole, string> = {
  investor: "investor",
  entrepreneur: "entrepreneur",
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

function parsePagination(value: unknown): ConversationPagination | null {
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

function parseConversation(value: unknown): Conversation | null {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.id) ||
    !isPositiveInteger(value.projectId) ||
    typeof value.projectTitle !== "string" ||
    typeof value.investor !== "string" ||
    typeof value.entrepreneur !== "string" ||
    typeof value.lastMessageBody !== "string" ||
    (value.lastMessageSenderId !== null &&
      !isPositiveInteger(value.lastMessageSenderId)) ||
    (value.lastMessageAt !== null && typeof value.lastMessageAt !== "string") ||
    !isNonNegativeInteger(value.unreadCount) ||
    typeof value.createdAt !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    projectId: value.projectId,
    projectTitle: value.projectTitle,
    investor: value.investor,
    entrepreneur: value.entrepreneur,
    lastMessageBody: value.lastMessageBody,
    lastMessageSenderId: value.lastMessageSenderId,
    lastMessageAt: value.lastMessageAt,
    unreadCount: value.unreadCount,
    createdAt: value.createdAt,
  };
}

function parseMessage(value: unknown): ConversationMessage | null {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.id) ||
    !isPositiveInteger(value.senderId) ||
    typeof value.sender !== "string" ||
    typeof value.body !== "string" ||
    typeof value.createdAt !== "string" ||
    (value.readAt !== null && typeof value.readAt !== "string") ||
    typeof value.isMine !== "boolean"
  ) {
    return null;
  }
  return {
    id: value.id,
    senderId: value.senderId,
    sender: value.sender,
    body: value.body,
    createdAt: value.createdAt,
    readAt: value.readAt,
    isMine: value.isMine,
  };
}

async function getErrorMessage(response: Response, fallback: string) {
  const payload: unknown = await response.json().catch(() => null);
  return isRecord(payload) && typeof payload.detail === "string"
    ? payload.detail
    : fallback;
}

async function requestJson(path: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json", ...init?.headers },
      ...init,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre la messagerie.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "La demande de messagerie a échoué."),
    );
  }
  return response.json() as Promise<unknown>;
}

async function getCsrfToken() {
  const payload = await requestJson("auth/csrf/");
  if (!isRecord(payload) || typeof payload.csrfToken !== "string") {
    throw new Error("Le service n’a pas fourni de jeton de sécurité.");
  }
  return payload.csrfToken;
}

async function postJson(path: string, body: Record<string, number | string>) {
  const csrfToken = await getCsrfToken();
  return requestJson(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify(body),
  });
}

function buildQuery(query: string, page: number, pageSize: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (query.trim()) params.set("q", query.trim());
  return params.toString();
}

export async function getConversations(
  role: MessagingRole,
  query: string,
  page = 1,
  pageSize = 20,
  signal?: AbortSignal,
): Promise<ConversationList> {
  const payload = await requestJson(
    `${roleBasePath[role]}/conversations/?${buildQuery(query, page, pageSize)}`,
    { signal },
  );
  if (!isRecord(payload) || !Array.isArray(payload.conversations)) {
    throw new Error("Le service a renvoyé une liste de conversations invalide.");
  }
  const conversations = payload.conversations.map(parseConversation);
  const pagination = parsePagination(payload.pagination);
  if (conversations.some((item) => item === null) || !pagination) {
    throw new Error("Le service a renvoyé une liste de conversations invalide.");
  }
  return {
    conversations: conversations.filter(
      (item): item is Conversation => item !== null,
    ),
    pagination,
  };
}

export async function getConversationMessages(
  role: MessagingRole,
  conversationId: number,
  signal?: AbortSignal,
): Promise<ConversationMessage[]> {
  const payload = await requestJson(
    `${roleBasePath[role]}/conversations/${conversationId}/messages/?page=1&pageSize=100`,
    { signal },
  );
  if (!isRecord(payload) || !Array.isArray(payload.messages)) {
    throw new Error("Le service a renvoyé des messages invalides.");
  }
  const messages = payload.messages.map(parseMessage);
  if (messages.some((item) => item === null)) {
    throw new Error("Le service a renvoyé des messages invalides.");
  }
  return messages.filter((item): item is ConversationMessage => item !== null);
}

export async function startConversation(projectId: number, body: string) {
  const payload = await postJson("investor/conversations/", { projectId, body });
  if (!isRecord(payload)) {
    throw new Error("Le service a renvoyé une conversation invalide.");
  }
  const conversation = parseConversation(payload.conversation);
  const message = parseMessage(payload.message);
  if (!conversation || !message) {
    throw new Error("Le service a renvoyé une conversation invalide.");
  }
  return { conversation, message };
}

export async function sendConversationMessage(
  role: MessagingRole,
  conversationId: number,
  body: string,
) {
  const payload = await postJson(
    `${roleBasePath[role]}/conversations/${conversationId}/messages/`,
    { body },
  );
  const message = isRecord(payload) ? parseMessage(payload.message) : null;
  if (!message) throw new Error("Le service a renvoyé un message invalide.");
  return message;
}

export async function markConversationRead(conversationId: number) {
  const payload = await postJson(`conversations/${conversationId}/read/`, {});
  if (!isRecord(payload) || payload.success !== true) {
    throw new Error("Impossible de marquer la conversation comme lue.");
  }
}

export async function getAdminConversations(
  query: string,
  page = 1,
  pageSize = 20,
  signal?: AbortSignal,
): Promise<AdminConversationList> {
  const payload = await requestJson(
    `admin/conversations/?${buildQuery(query, page, pageSize)}`,
    { signal },
  );
  if (!isRecord(payload) || !Array.isArray(payload.conversations)) {
    throw new Error("Le service a renvoyé une liste de conversations invalide.");
  }
  const conversations = payload.conversations.map((item) => {
    if (
      !isRecord(item) ||
      !isPositiveInteger(item.id) ||
      typeof item.projectTitle !== "string" ||
      typeof item.investor !== "string" ||
      typeof item.entrepreneur !== "string" ||
      !isNonNegativeInteger(item.messageCount) ||
      (item.lastMessageAt !== null && typeof item.lastMessageAt !== "string") ||
      typeof item.createdAt !== "string"
    ) {
      return null;
    }
    return {
      id: item.id,
      projectTitle: item.projectTitle,
      investor: item.investor,
      entrepreneur: item.entrepreneur,
      messageCount: item.messageCount,
      lastMessageAt: item.lastMessageAt,
      createdAt: item.createdAt,
    };
  });
  const pagination = parsePagination(payload.pagination);
  if (conversations.some((item) => item === null) || !pagination) {
    throw new Error("Le service a renvoyé une liste de conversations invalide.");
  }
  return {
    conversations: conversations.filter(
      (item): item is AdminConversation => item !== null,
    ),
    pagination,
  };
}
