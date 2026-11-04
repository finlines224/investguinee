import { apiUrl } from "./auth-api";

export type InvestorSubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";
export type InvestorSubscriptionFilter = "all" | InvestorSubscriptionStatus;

export type InvestorSubscription = {
  id: number;
  planName: string;
  status: InvestorSubscriptionStatus;
  statusLabel: string;
  amountPaid: string;
  currency: string;
  startedAt: string;
  expiresAt: string | null;
};

export type InvestorSubscriptionCatalog = {
  subscriptions: InvestorSubscription[];
  summary: {
    totalCount: number;
    activeCount: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function parseSubscription(value: unknown): InvestorSubscription | null {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.id) ||
    typeof value.planName !== "string" ||
    (value.status !== "ACTIVE" &&
      value.status !== "EXPIRED" &&
      value.status !== "CANCELLED") ||
    typeof value.statusLabel !== "string" ||
    typeof value.amountPaid !== "string" ||
    !/^\d+(?:\.\d{1,2})?$/.test(value.amountPaid) ||
    typeof value.currency !== "string" ||
    !/^[A-Z]{3}$/.test(value.currency) ||
    typeof value.startedAt !== "string" ||
    (value.expiresAt !== null && typeof value.expiresAt !== "string")
  ) {
    return null;
  }
  return {
    id: value.id,
    planName: value.planName,
    status: value.status,
    statusLabel: value.statusLabel,
    amountPaid: value.amountPaid,
    currency: value.currency,
    startedAt: value.startedAt,
    expiresAt: value.expiresAt,
  };
}

function parseCatalog(value: unknown): InvestorSubscriptionCatalog | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.subscriptions) ||
    !isRecord(value.summary) ||
    !isRecord(value.pagination) ||
    !isNonNegativeInteger(value.summary.totalCount) ||
    !isNonNegativeInteger(value.summary.activeCount) ||
    !isPositiveInteger(value.pagination.page) ||
    !isPositiveInteger(value.pagination.pageSize) ||
    !isNonNegativeInteger(value.pagination.totalResults) ||
    !isPositiveInteger(value.pagination.totalPages)
  ) {
    return null;
  }
  const subscriptions: InvestorSubscription[] = [];
  for (const valueItem of value.subscriptions) {
    const subscription = parseSubscription(valueItem);
    if (!subscription) return null;
    subscriptions.push(subscription);
  }
  return {
    subscriptions,
    summary: {
      totalCount: value.summary.totalCount,
      activeCount: value.summary.activeCount,
    },
    pagination: {
      page: value.pagination.page,
      pageSize: value.pagination.pageSize,
      totalResults: value.pagination.totalResults,
      totalPages: value.pagination.totalPages,
    },
  };
}

async function readError(response: Response) {
  const payload: unknown = await response.json().catch(() => null);
  return isRecord(payload) && typeof payload.detail === "string"
    ? payload.detail
    : "Impossible de charger l’historique des abonnements.";
}

export async function getInvestorSubscriptions(
  page: number,
  status: InvestorSubscriptionFilter,
): Promise<InvestorSubscriptionCatalog> {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: "10",
    status,
  });
  let response: Response;
  try {
    response = await fetch(apiUrl(`investor/subscriptions/?${query}`), {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre le service. Vérifiez votre connexion et réessayez.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Le service a renvoyé un historique d’abonnements invalide.");
  }
  const catalog = parseCatalog(payload);
  if (!catalog) {
    throw new Error("Le service a renvoyé un historique d’abonnements invalide.");
  }
  return catalog;
}
