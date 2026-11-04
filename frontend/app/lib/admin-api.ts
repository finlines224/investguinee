import { apiUrl } from "./auth-api";

export type AdminRole = {
  role: "INVESTOR" | "ENTREPRENEUR" | "STUDENT" | "ADMIN";
  label: string;
  count: number;
};

export type AdminOverview = {
  totalUsers: number;
  publishedProjects: number;
  organizations: number;
  roles: AdminRole[];
};

export type AdminUser = {
  id: number;
  fullName: string;
  email: string;
  role: AdminRole["role"];
  roleLabel: string;
  isActive: boolean;
  isVerified: boolean;
  joinedAt: string;
};

export type AdminUserCatalog = {
  users: AdminUser[];
  roles: { role: AdminRole["role"]; label: string }[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
};

export type AdminUserQuery = {
  query: string;
  role: string;
  status: "all" | "active" | "inactive";
  page: number;
  pageSize: number;
};

export type AdminProject = {
  id: number;
  title: string;
  description: string;
  sector: string;
  region: string;
  city: string;
  fundingGoal: number;
  currency: string;
  stage: string;
  status: string;
  statusLabel: string;
  visibility: string;
  owner: string;
  organization: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type AdminProjectCatalog = {
  projects: AdminProject[];
  statuses: { status: string; label: string }[];
  sectors: string[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
};

export type AdminProjectQuery = {
  query: string;
  status: string;
  sector: string;
  page: number;
  pageSize: number;
};

export type AdminOrganization = {
  id: number;
  name: string;
  legalName: string;
  type: string;
  registrationNumber: string;
  region: string;
  city: string;
  countryCode: string;
  websiteUrl: string;
  description: string;
  verificationStatus: string;
  verificationStatusLabel: string;
  memberCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrganizationCatalog = {
  organizations: AdminOrganization[];
  statuses: { status: string; label: string }[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
};

export type AdminOrganizationQuery = {
  query: string;
  status: string;
  page: number;
  pageSize: number;
};

export type AdminAccessRequest = {
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

export type AdminAccessRequestCatalog = {
  requests: AdminAccessRequest[];
  statuses: { status: AdminAccessRequest["status"]; label: string }[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
};

export type AdminAccessRequestQuery = {
  query: string;
  status: "all" | AdminAccessRequest["status"];
  page: number;
  pageSize: number;
};

export type AdminTrainingResource = {
  id: number;
  title: string;
  description: string;
  category: string;
  format: string;
  level: string;
  url: string;
  isPublished: boolean;
  updatedAt: string;
};

export type AdminTrainingInput = Omit<
  AdminTrainingResource,
  "id" | "updatedAt"
>;

export type AdminTrainingCatalog = {
  resources: AdminTrainingResource[];
  categories: string[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
};

export type AdminTrainingQuery = {
  query: string;
  status: "all" | "published" | "draft";
  category: string;
  page: number;
  pageSize: number;
};

function isAdminRole(value: unknown): value is AdminRole["role"] {
  return (
    value === "INVESTOR" ||
    value === "ENTREPRENEUR" ||
    value === "STUDENT" ||
    value === "ADMIN"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

async function getErrorMessage(response: Response, fallback: string) {
  const payload: unknown = await response.json().catch(() => null);
  return isRecord(payload) && typeof payload.detail === "string"
    ? payload.detail
    : fallback;
}

function parseAdminTraining(value: unknown): AdminTrainingResource | null {
  if (
    !isRecord(value) ||
    !isCount(value.id) ||
    value.id < 1 ||
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    typeof value.category !== "string" ||
    typeof value.format !== "string" ||
    typeof value.level !== "string" ||
    typeof value.url !== "string" ||
    typeof value.isPublished !== "boolean" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    title: value.title,
    description: value.description,
    category: value.category,
    format: value.format,
    level: value.level,
    url: value.url,
    isPublished: value.isPublished,
    updatedAt: value.updatedAt,
  };
}

function parseAdminTrainingCatalog(
  value: unknown,
): AdminTrainingCatalog | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.resources) ||
    !Array.isArray(value.categories) ||
    !isRecord(value.pagination)
  ) {
    return null;
  }
  const resources = value.resources.map(parseAdminTraining);
  const categories = value.categories.filter(
    (category): category is string => typeof category === "string",
  );
  const pagination = value.pagination;
  if (
    resources.some((resource) => resource === null) ||
    categories.length !== value.categories.length ||
    !isCount(pagination.page) ||
    pagination.page < 1 ||
    !isCount(pagination.pageSize) ||
    pagination.pageSize < 1 ||
    !isCount(pagination.totalResults) ||
    !isCount(pagination.totalPages) ||
    pagination.totalPages < 1
  ) {
    return null;
  }
  return {
    resources: resources.filter(
      (resource): resource is AdminTrainingResource => resource !== null,
    ),
    categories,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalResults: pagination.totalResults,
      totalPages: pagination.totalPages,
    },
  };
}

function parseRole(value: unknown): AdminRole | null {
  if (
    !isRecord(value) ||
    !isAdminRole(value.role) ||
    typeof value.label !== "string" ||
    !isCount(value.count)
  ) {
    return null;
  }
  return {
    role: value.role,
    label: value.label,
    count: value.count,
  };
}

function parseAdminUser(value: unknown): AdminUser | null {
  if (
    !isRecord(value) ||
    !isCount(value.id) ||
    value.id < 1 ||
    typeof value.fullName !== "string" ||
    typeof value.email !== "string" ||
    !isAdminRole(value.role) ||
    typeof value.roleLabel !== "string" ||
    typeof value.isActive !== "boolean" ||
    typeof value.isVerified !== "boolean" ||
    typeof value.joinedAt !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    fullName: value.fullName,
    email: value.email,
    role: value.role,
    roleLabel: value.roleLabel,
    isActive: value.isActive,
    isVerified: value.isVerified,
    joinedAt: value.joinedAt,
  };
}

function parseAdminUserCatalog(value: unknown): AdminUserCatalog | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.users) ||
    !Array.isArray(value.roles) ||
    !isRecord(value.pagination)
  ) {
    return null;
  }
  const users = value.users.map(parseAdminUser);
  const roles = value.roles.filter(
    (role): role is Record<string, unknown> => isRecord(role),
  );
  const parsedRoles = roles.map((role) =>
    isAdminRole(role.role) && typeof role.label === "string"
      ? { role: role.role, label: role.label }
      : null,
  );
  const pagination = value.pagination;
  if (
    users.some((user) => user === null) ||
    roles.length !== value.roles.length ||
    parsedRoles.some((role) => role === null) ||
    !isCount(pagination.page) ||
    pagination.page < 1 ||
    !isCount(pagination.pageSize) ||
    pagination.pageSize < 1 ||
    !isCount(pagination.totalResults) ||
    !isCount(pagination.totalPages) ||
    pagination.totalPages < 1
  ) {
    return null;
  }
  return {
    users: users.filter((user): user is AdminUser => user !== null),
    roles: parsedRoles.filter(
      (role): role is { role: AdminRole["role"]; label: string } =>
        role !== null,
    ),
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalResults: pagination.totalResults,
      totalPages: pagination.totalPages,
    },
  };
}

function parseAdminProject(value: unknown): AdminProject | null {
  if (
    !isRecord(value) ||
    !isCount(value.id) ||
    value.id < 1 ||
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    typeof value.sector !== "string" ||
    typeof value.region !== "string" ||
    typeof value.city !== "string" ||
    !isCount(value.fundingGoal) ||
    typeof value.currency !== "string" ||
    typeof value.stage !== "string" ||
    typeof value.status !== "string" ||
    typeof value.statusLabel !== "string" ||
    typeof value.visibility !== "string" ||
    typeof value.owner !== "string" ||
    typeof value.organization !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    (value.publishedAt !== null && typeof value.publishedAt !== "string")
  ) {
    return null;
  }
  return {
    id: value.id,
    title: value.title,
    description: value.description,
    sector: value.sector,
    region: value.region,
    city: value.city,
    fundingGoal: value.fundingGoal,
    currency: value.currency,
    stage: value.stage,
    status: value.status,
    statusLabel: value.statusLabel,
    visibility: value.visibility,
    owner: value.owner,
    organization: value.organization,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    publishedAt: value.publishedAt,
  };
}

function parseAdminProjectCatalog(value: unknown): AdminProjectCatalog | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.projects) ||
    !Array.isArray(value.statuses) ||
    !Array.isArray(value.sectors) ||
    !isRecord(value.pagination)
  ) {
    return null;
  }
  const projects = value.projects.map(parseAdminProject);
  const statuses = value.statuses.filter(
    (item): item is Record<string, unknown> => isRecord(item),
  );
  const parsedStatuses = statuses.map((item) =>
    typeof item.status === "string" && typeof item.label === "string"
      ? { status: item.status, label: item.label }
      : null,
  );
  const sectors = value.sectors.filter(
    (item): item is string => typeof item === "string",
  );
  const pagination = value.pagination;
  if (
    projects.some((project) => project === null) ||
    statuses.length !== value.statuses.length ||
    parsedStatuses.some((item) => item === null) ||
    sectors.length !== value.sectors.length ||
    !isCount(pagination.page) ||
    pagination.page < 1 ||
    !isCount(pagination.pageSize) ||
    pagination.pageSize < 1 ||
    !isCount(pagination.totalResults) ||
    !isCount(pagination.totalPages) ||
    pagination.totalPages < 1
  ) {
    return null;
  }
  return {
    projects: projects.filter(
      (project): project is AdminProject => project !== null,
    ),
    statuses: parsedStatuses.filter(
      (item): item is { status: string; label: string } => item !== null,
    ),
    sectors,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalResults: pagination.totalResults,
      totalPages: pagination.totalPages,
    },
  };
}

function parseAdminAccessRequest(value: unknown): AdminAccessRequest | null {
  if (
    !isRecord(value) ||
    !isCount(value.id) ||
    value.id < 1 ||
    !isCount(value.projectId) ||
    value.projectId < 1 ||
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

function parseAdminAccessRequestCatalog(
  value: unknown,
): AdminAccessRequestCatalog | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.requests) ||
    !Array.isArray(value.statuses) ||
    !isRecord(value.pagination)
  ) {
    return null;
  }
  const requests = value.requests.map(parseAdminAccessRequest);
  const statuses = value.statuses.filter(
    (item): item is Record<string, unknown> => isRecord(item),
  );
  const parsedStatuses = statuses.map((item) =>
    (item.status === "PENDING" ||
      item.status === "APPROVED" ||
      item.status === "REJECTED") &&
    typeof item.label === "string"
      ? { status: item.status, label: item.label }
      : null,
  );
  const pagination = value.pagination;
  if (
    requests.some((item) => item === null) ||
    statuses.length !== value.statuses.length ||
    parsedStatuses.some((item) => item === null) ||
    !isCount(pagination.page) ||
    pagination.page < 1 ||
    !isCount(pagination.pageSize) ||
    pagination.pageSize < 1 ||
    !isCount(pagination.totalResults) ||
    !isCount(pagination.totalPages) ||
    pagination.totalPages < 1
  ) {
    return null;
  }
  return {
    requests: requests.filter(
      (item): item is AdminAccessRequest => item !== null,
    ),
    statuses: parsedStatuses.filter(
      (
        item,
      ): item is {
        status: AdminAccessRequest["status"];
        label: string;
      } => item !== null,
    ),
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalResults: pagination.totalResults,
      totalPages: pagination.totalPages,
    },
  };
}

export async function getAdminProjects(
  query: AdminProjectQuery,
  signal: AbortSignal,
): Promise<AdminProjectCatalog> {
  const searchParams = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.query) searchParams.set("q", query.query);
  if (query.status) searchParams.set("status", query.status);
  if (query.sector) searchParams.set("sector", query.sector);

  let response: Response;
  try {
    response = await fetch(apiUrl(`admin/projects/?${searchParams.toString()}`), {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre la gestion des projets.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Impossible de charger les projets."),
    );
  }
  const payload: unknown = await response.json();
  const catalog = parseAdminProjectCatalog(payload);
  if (!catalog) {
    throw new Error("Le service a renvoyé un catalogue de projets invalide.");
  }
  return catalog;
}

function parseAdminOrganization(value: unknown): AdminOrganization | null {
  if (
    !isRecord(value) ||
    !isCount(value.id) ||
    value.id < 1 ||
    typeof value.name !== "string" ||
    typeof value.legalName !== "string" ||
    typeof value.type !== "string" ||
    typeof value.registrationNumber !== "string" ||
    typeof value.region !== "string" ||
    typeof value.city !== "string" ||
    typeof value.countryCode !== "string" ||
    typeof value.websiteUrl !== "string" ||
    typeof value.description !== "string" ||
    typeof value.verificationStatus !== "string" ||
    typeof value.verificationStatusLabel !== "string" ||
    !isCount(value.memberCount) ||
    typeof value.createdBy !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    legalName: value.legalName,
    type: value.type,
    registrationNumber: value.registrationNumber,
    region: value.region,
    city: value.city,
    countryCode: value.countryCode,
    websiteUrl: value.websiteUrl,
    description: value.description,
    verificationStatus: value.verificationStatus,
    verificationStatusLabel: value.verificationStatusLabel,
    memberCount: value.memberCount,
    createdBy: value.createdBy,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function parseAdminOrganizationCatalog(
  value: unknown,
): AdminOrganizationCatalog | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.organizations) ||
    !Array.isArray(value.statuses) ||
    !isRecord(value.pagination)
  ) {
    return null;
  }
  const organizations = value.organizations.map(parseAdminOrganization);
  const statuses = value.statuses.filter(
    (item): item is Record<string, unknown> => isRecord(item),
  );
  const parsedStatuses = statuses.map((item) =>
    typeof item.status === "string" && typeof item.label === "string"
      ? { status: item.status, label: item.label }
      : null,
  );
  const pagination = value.pagination;
  if (
    organizations.some((organization) => organization === null) ||
    statuses.length !== value.statuses.length ||
    parsedStatuses.some((item) => item === null) ||
    !isCount(pagination.page) ||
    pagination.page < 1 ||
    !isCount(pagination.pageSize) ||
    pagination.pageSize < 1 ||
    !isCount(pagination.totalResults) ||
    !isCount(pagination.totalPages) ||
    pagination.totalPages < 1
  ) {
    return null;
  }
  return {
    organizations: organizations.filter(
      (organization): organization is AdminOrganization =>
        organization !== null,
    ),
    statuses: parsedStatuses.filter(
      (item): item is { status: string; label: string } => item !== null,
    ),
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalResults: pagination.totalResults,
      totalPages: pagination.totalPages,
    },
  };
}

export async function getAdminOrganizations(
  query: AdminOrganizationQuery,
  signal: AbortSignal,
): Promise<AdminOrganizationCatalog> {
  const searchParams = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.query) searchParams.set("q", query.query);
  if (query.status) searchParams.set("status", query.status);

  let response: Response;
  try {
    response = await fetch(
      apiUrl(`admin/organizations/?${searchParams.toString()}`),
      {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
      },
    );
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre la gestion des organisations.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Impossible de charger les organisations."),
    );
  }
  const payload: unknown = await response.json();
  const catalog = parseAdminOrganizationCatalog(payload);
  if (!catalog) {
    throw new Error("Le service a renvoyé une liste d’organisations invalide.");
  }
  return catalog;
}

export async function getAdminAccessRequests(
  query: AdminAccessRequestQuery,
  signal: AbortSignal,
): Promise<AdminAccessRequestCatalog> {
  const searchParams = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    status: query.status,
  });
  if (query.query) searchParams.set("q", query.query);

  let response: Response;
  try {
    response = await fetch(
      apiUrl(`admin/access-requests/?${searchParams.toString()}`),
      {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
      },
    );
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre les demandes d’accès.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Impossible de charger les demandes d’accès."),
    );
  }
  const payload: unknown = await response.json();
  const catalog = parseAdminAccessRequestCatalog(payload);
  if (!catalog) {
    throw new Error("Le service a renvoyé une liste de demandes invalide.");
  }
  return catalog;
}

export async function decideAdminAccessRequest(
  requestId: number,
  decision: "APPROVED" | "REJECTED",
  reviewerNote: string,
): Promise<AdminAccessRequest> {
  const csrfToken = await getAdminCsrfToken();
  let response: Response;
  try {
    response = await fetch(apiUrl(`admin/access-requests/${requestId}/`), {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({ decision, reviewerNote }),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre la gestion des demandes d’accès.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Impossible d’enregistrer la décision."),
    );
  }
  const payload: unknown = await response.json();
  const accessRequest =
    isRecord(payload) && "request" in payload
      ? parseAdminAccessRequest(payload.request)
      : null;
  if (!accessRequest) {
    throw new Error("Le service a renvoyé une décision invalide.");
  }
  return accessRequest;
}

export async function getAdminUsers(
  query: AdminUserQuery,
  signal: AbortSignal,
): Promise<AdminUserCatalog> {
  const searchParams = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    status: query.status,
  });
  if (query.query) searchParams.set("q", query.query);
  if (query.role) searchParams.set("role", query.role);

  let response: Response;
  try {
    response = await fetch(apiUrl(`admin/users/?${searchParams.toString()}`), {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre la gestion des utilisateurs.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Impossible de charger les utilisateurs."),
    );
  }
  const payload: unknown = await response.json();
  const catalog = parseAdminUserCatalog(payload);
  if (!catalog) {
    throw new Error("Le service a renvoyé une liste d’utilisateurs invalide.");
  }
  return catalog;
}

export async function getAdminOverview(
  signal: AbortSignal,
): Promise<AdminOverview> {
  let response: Response;
  try {
    response = await fetch(apiUrl("admin/overview/"), {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre les indicateurs administrateur.");
    }
    throw error;
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      isRecord(payload) && typeof payload.detail === "string"
        ? payload.detail
        : "Impossible de charger les indicateurs administrateur.";
    throw new Error(detail);
  }
  if (
    !isRecord(payload) ||
    !isCount(payload.totalUsers) ||
    !isCount(payload.publishedProjects) ||
    !isCount(payload.organizations) ||
    !Array.isArray(payload.roles)
  ) {
    throw new Error("Le service a renvoyé des indicateurs administrateur invalides.");
  }

  const parsedRoles = payload.roles.map(parseRole);
  if (parsedRoles.some((role) => role === null)) {
    throw new Error("Le service a renvoyé une répartition des rôles invalide.");
  }
  const roles = parsedRoles.filter((role): role is AdminRole => role !== null);
  return {
    totalUsers: payload.totalUsers,
    publishedProjects: payload.publishedProjects,
    organizations: payload.organizations,
    roles: roles as AdminRole[],
  };
}

export async function getAdminTrainingCatalog(
  query: AdminTrainingQuery,
  signal: AbortSignal,
): Promise<AdminTrainingCatalog> {
  const searchParams = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    status: query.status,
  });
  if (query.query) searchParams.set("q", query.query);
  if (query.category) searchParams.set("category", query.category);

  let response: Response;
  try {
    response = await fetch(apiUrl(`admin/trainings/?${searchParams.toString()}`), {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre la gestion des formations.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Impossible de charger les formations."),
    );
  }
  const payload: unknown = await response.json();
  const catalog = parseAdminTrainingCatalog(payload);
  if (!catalog) {
    throw new Error("Le service a renvoyé un catalogue administrateur invalide.");
  }
  return catalog;
}

async function getAdminCsrfToken() {
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

async function saveAdminTraining(
  path: string,
  method: "POST" | "PATCH",
  training: AdminTrainingInput,
): Promise<AdminTrainingResource> {
  const csrfToken = await getAdminCsrfToken();
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify(training),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre la gestion des formations.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Impossible d’enregistrer la ressource."),
    );
  }
  const payload: unknown = await response.json();
  const resource =
    isRecord(payload) && "resource" in payload
      ? parseAdminTraining(payload.resource)
      : null;
  if (!resource) {
    throw new Error("Le service a renvoyé une ressource invalide.");
  }
  return resource;
}

export function createAdminTraining(training: AdminTrainingInput) {
  return saveAdminTraining("admin/trainings/create/", "POST", training);
}

export function updateAdminTraining(
  id: number,
  training: AdminTrainingInput,
) {
  return saveAdminTraining(`admin/trainings/${id}/`, "PATCH", training);
}
