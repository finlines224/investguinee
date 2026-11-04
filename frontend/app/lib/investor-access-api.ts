import { apiUrl } from "./auth-api";

export type RestrictedProject = {
  id: number;
  title: string;
  slug: string;
  sector: string;
  region: string;
  fundingGoal: number;
  currency: string;
  stage: string;
  visibility: "MEMBERS_ONLY" | "RESTRICTED";
  request: {
    id: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    statusLabel: string;
  } | null;
};

export type InvestorProjectAccessRequest = {
  id: number;
  projectId: number;
  projectTitle: string;
  projectSlug: string;
  sector: string;
  region: string;
  investor: string;
  investorEmail: string;
  justification: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  statusLabel: string;
  reviewerNote: string;
  reviewedBy: string;
  createdAt: string;
  decidedAt: string | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
};

export type RestrictedProjectCatalog = {
  projects: RestrictedProject[];
  pagination: Pagination;
};

export type InvestorAccessRequestCatalog = {
  requests: InvestorProjectAccessRequest[];
  statuses: { status: InvestorProjectAccessRequest["status"]; label: string }[];
  pagination: Pagination;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPositiveInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function parsePagination(value: unknown): Pagination | null {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.page) ||
    !isPositiveInteger(value.pageSize) ||
    typeof value.totalResults !== "number" ||
    !Number.isSafeInteger(value.totalResults) ||
    value.totalResults < 0 ||
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

function parseRestrictedProject(value: unknown): RestrictedProject | null {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.id) ||
    typeof value.title !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.sector !== "string" ||
    typeof value.region !== "string" ||
    typeof value.fundingGoal !== "number" ||
    !Number.isSafeInteger(value.fundingGoal) ||
    value.fundingGoal < 0 ||
    typeof value.currency !== "string" ||
    typeof value.stage !== "string" ||
    (value.visibility !== "MEMBERS_ONLY" && value.visibility !== "RESTRICTED")
  ) {
    return null;
  }
  let projectRequest: RestrictedProject["request"] = null;
  if (value.request !== null) {
    if (
      !isRecord(value.request) ||
      !isPositiveInteger(value.request.id) ||
      (value.request.status !== "PENDING" &&
        value.request.status !== "APPROVED" &&
        value.request.status !== "REJECTED") ||
      typeof value.request.statusLabel !== "string"
    ) {
      return null;
    }
    projectRequest = {
      id: value.request.id,
      status: value.request.status,
      statusLabel: value.request.statusLabel,
    };
  }
  return {
    id: value.id,
    title: value.title,
    slug: value.slug,
    sector: value.sector,
    region: value.region,
    fundingGoal: value.fundingGoal,
    currency: value.currency,
    stage: value.stage,
    visibility: value.visibility,
    request: projectRequest,
  };
}

function parseInvestorRequest(
  value: unknown,
): InvestorProjectAccessRequest | null {
  if (
    !isRecord(value) ||
    !isPositiveInteger(value.id) ||
    !isPositiveInteger(value.projectId) ||
    typeof value.projectTitle !== "string" ||
    typeof value.projectSlug !== "string" ||
    typeof value.sector !== "string" ||
    typeof value.region !== "string" ||
    typeof value.investor !== "string" ||
    typeof value.investorEmail !== "string" ||
    typeof value.justification !== "string" ||
    (value.status !== "PENDING" &&
      value.status !== "APPROVED" &&
      value.status !== "REJECTED") ||
    typeof value.statusLabel !== "string" ||
    typeof value.reviewerNote !== "string" ||
    typeof value.reviewedBy !== "string" ||
    typeof value.createdAt !== "string" ||
    (value.decidedAt !== null && typeof value.decidedAt !== "string")
  ) {
    return null;
  }
  return {
    id: value.id,
    projectId: value.projectId,
    projectTitle: value.projectTitle,
    projectSlug: value.projectSlug,
    sector: value.sector,
    region: value.region,
    investor: value.investor,
    investorEmail: value.investorEmail,
    justification: value.justification,
    status: value.status,
    statusLabel: value.statusLabel,
    reviewerNote: value.reviewerNote,
    reviewedBy: value.reviewedBy,
    createdAt: value.createdAt,
    decidedAt: value.decidedAt,
  };
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

async function requestJson(path: string, signal?: AbortSignal) {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre la gestion des demandes d’accès.");
    }
    throw error;
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      isRecord(payload) && typeof payload.detail === "string"
        ? payload.detail
        : "Impossible de charger les demandes d’accès.",
    );
  }
  return payload;
}

export async function getRestrictedProjects(
  query: string,
  page: number,
  signal: AbortSignal,
): Promise<RestrictedProjectCatalog> {
  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: "10",
  });
  if (query.trim()) searchParams.set("q", query.trim());
  const payload = await requestJson(
    `investor/access-requests/projects/?${searchParams.toString()}`,
    signal,
  );
  const pagination = isRecord(payload) ? parsePagination(payload.pagination) : null;
  const projects =
    isRecord(payload) && Array.isArray(payload.projects)
      ? payload.projects.map(parseRestrictedProject)
      : null;
  if (!pagination || !projects || projects.some((project) => project === null)) {
    throw new Error("Le service a renvoyé un catalogue de projets invalide.");
  }
  return {
    projects: projects.filter(
      (project): project is RestrictedProject => project !== null,
    ),
    pagination,
  };
}

export async function getInvestorAccessRequests(
  signal: AbortSignal,
  status: "all" | InvestorProjectAccessRequest["status"] = "all",
  page = 1,
  pageSize = 100,
): Promise<InvestorAccessRequestCatalog> {
  const searchParams = new URLSearchParams({
    status,
    page: String(page),
    pageSize: String(pageSize),
  });
  const payload = await requestJson(
    `investor/access-requests/?${searchParams.toString()}`,
    signal,
  );
  if (!isRecord(payload) || !Array.isArray(payload.requests) || !Array.isArray(payload.statuses)) {
    throw new Error("Le service a renvoyé une liste de demandes invalide.");
  }
  const requests = payload.requests.map(parseInvestorRequest);
  const statuses = payload.statuses.map((item) => {
    if (
      !isRecord(item) ||
      (item.status !== "PENDING" &&
        item.status !== "APPROVED" &&
        item.status !== "REJECTED") ||
      typeof item.label !== "string"
    ) {
      return null;
    }
    return { status: item.status, label: item.label };
  });
  const pagination = parsePagination(payload.pagination);
  if (
    requests.some((request) => request === null) ||
    statuses.some((status) => status === null) ||
    !pagination
  ) {
    throw new Error("Le service a renvoyé une liste de demandes invalide.");
  }
  return {
    requests: requests.filter(
      (request): request is InvestorProjectAccessRequest => request !== null,
    ),
    statuses: statuses.filter(
      (
        status,
      ): status is {
        status: InvestorProjectAccessRequest["status"];
        label: string;
      } => status !== null,
    ),
    pagination,
  };
}

export async function createInvestorAccessRequest(
  projectId: number,
  justification: string,
): Promise<InvestorProjectAccessRequest> {
  const csrfToken = await getCsrfToken();
  let response: Response;
  try {
    response = await fetch(apiUrl("investor/access-requests/"), {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({ projectId, justification }),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible d’envoyer la demande d’accès.");
    }
    throw error;
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      isRecord(payload) && typeof payload.detail === "string"
        ? payload.detail
        : "Impossible d’envoyer la demande d’accès.",
    );
  }
  const accessRequest =
    isRecord(payload) && "request" in payload
      ? parseInvestorRequest(payload.request)
      : null;
  if (!accessRequest) {
    throw new Error("Le service a renvoyé une demande invalide.");
  }
  return accessRequest;
}
