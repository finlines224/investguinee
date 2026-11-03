import { apiUrl } from "./auth-api";

export type StudentTrainingResource = {
  id: number;
  title: string;
  description: string;
  category: string;
  format: string;
  level: string;
  url: string;
};

export type StudentTrainingCatalog = {
  resources: StudentTrainingResource[];
  categories: string[];
  pagination: {
    page: number;
    pageSize: number;
    totalResults: number;
    totalPages: number;
  };
};

export type StudentTrainingQuery = {
  query: string;
  category: string;
  page: number;
  pageSize: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseResource(value: unknown): StudentTrainingResource | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "number" ||
    !Number.isSafeInteger(value.id) ||
    value.id < 1 ||
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    typeof value.category !== "string" ||
    typeof value.format !== "string" ||
    typeof value.level !== "string" ||
    typeof value.url !== "string"
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
  };
}

function parsePagination(value: unknown): StudentTrainingCatalog["pagination"] | null {
  if (
    !isRecord(value) ||
    typeof value.page !== "number" ||
    !Number.isSafeInteger(value.page) ||
    value.page < 1 ||
    typeof value.pageSize !== "number" ||
    !Number.isSafeInteger(value.pageSize) ||
    value.pageSize < 1 ||
    typeof value.totalResults !== "number" ||
    !Number.isSafeInteger(value.totalResults) ||
    value.totalResults < 0 ||
    typeof value.totalPages !== "number" ||
    !Number.isSafeInteger(value.totalPages) ||
    value.totalPages < 1
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

export async function getStudentTrainingCatalog(
  query: StudentTrainingQuery,
  signal: AbortSignal,
): Promise<StudentTrainingCatalog> {
  const searchParams = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.query) searchParams.set("q", query.query);
  if (query.category) searchParams.set("category", query.category);

  let response: Response;
  try {
    response = await fetch(
      apiUrl(`student/trainings/?${searchParams.toString()}`),
      {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
        signal,
      },
    );
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre le catalogue des formations.");
    }
    throw error;
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      isRecord(payload) && typeof payload.detail === "string"
        ? payload.detail
        : "Impossible de charger les formations.";
    throw new Error(detail);
  }
  if (
    !isRecord(payload) ||
    !Array.isArray(payload.resources) ||
    !Array.isArray(payload.categories)
  ) {
    throw new Error("Le service a renvoyé un catalogue de formations invalide.");
  }

  const resources = payload.resources.map(parseResource);
  const categories = payload.categories.filter(
    (category): category is string => typeof category === "string",
  );
  const pagination = parsePagination(payload.pagination);
  if (
    resources.some((resource) => resource === null) ||
    categories.length !== payload.categories.length ||
    !pagination
  ) {
    throw new Error("Le service a renvoyé des informations de formations invalides.");
  }
  return {
    resources: resources as StudentTrainingResource[],
    categories,
    pagination,
  };
}
