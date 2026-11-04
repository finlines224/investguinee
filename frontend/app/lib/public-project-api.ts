import { apiUrl } from "./auth-api";
import type { CatalogProject } from "../data/project-catalog";

export type PublicProjectStats = {
  publishedProjects: number;
  investors: number;
  entrepreneurs: number;
};

export type PublicProjectPagination = {
  page: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
};

export type PublicProjectFacets = {
  sectors: { sector: string; projectCount: number }[];
  regions: string[];
  stages: string[];
};

export type PublicProjectCatalog = {
  projects: CatalogProject[];
  stats: PublicProjectStats;
  pagination?: PublicProjectPagination;
  facets?: PublicProjectFacets;
};

export type PublicProjectQuery = {
  query?: string;
  sectors?: string[];
  region?: string;
  stage?: string;
  minAmount?: number;
  maxAmount?: number;
  sort?: "newest" | "oldest" | "amount-asc" | "amount-desc";
  page: number;
  pageSize: number;
};

const projectImages: Record<string, string> = {
  Agriculture: "/project_agriculture.png",
  Énergie: "/project_solar.png",
  Technologie: "/project_edtech.png",
  Éducation: "/project_edtech.png",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseProject(value: unknown): CatalogProject | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "number" ||
    typeof value.slug !== "string" ||
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    typeof value.summary !== "string" ||
    typeof value.sector !== "string" ||
    !Array.isArray(value.sectors) ||
    !value.sectors.every((sector) => typeof sector === "string") ||
    typeof value.region !== "string" ||
    typeof value.location !== "string" ||
    typeof value.fundingGoal !== "number" ||
    typeof value.stage !== "string" ||
    value.status !== "Publié" ||
    typeof value.publishedAt !== "string" ||
    typeof value.owner !== "string"
  ) {
    return null;
  }

  const sector = value.sector;
  return {
    id: value.id,
    slug: value.slug,
    title: value.title,
    description: value.description,
    summary: value.summary,
    images: [projectImages[sector] ?? "/project_agriculture.png"],
    status: "Publié",
    sectors: value.sectors,
    location: value.location,
    region: value.region,
    amountRequested: value.fundingGoal,
    developmentStage: value.stage,
    publishedAt: value.publishedAt,
    owner: value.owner,
  };
}

function parseStats(value: unknown): PublicProjectStats | null {
  if (
    !isRecord(value) ||
    typeof value.publishedProjects !== "number" ||
    typeof value.investors !== "number" ||
    typeof value.entrepreneurs !== "number"
  ) {
    return null;
  }
  return {
    publishedProjects: value.publishedProjects,
    investors: value.investors,
    entrepreneurs: value.entrepreneurs,
  };
}

function parsePagination(value: unknown): PublicProjectPagination | null {
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

function isSectorCount(
  value: unknown,
): value is { sector: string; project_count: number } {
  return (
    isRecord(value) &&
    typeof value.sector === "string" &&
    typeof value.project_count === "number" &&
    Number.isSafeInteger(value.project_count) &&
    value.project_count >= 0
  );
}

function parseFacets(value: unknown): PublicProjectFacets | null {
  if (!isRecord(value)) {
    return null;
  }
  const rawSectors = value.sectors;
  const rawRegions = value.regions;
  const rawStages = value.stages;
  if (
    !Array.isArray(rawSectors) ||
    !Array.isArray(rawRegions) ||
    !Array.isArray(rawStages)
  ) return null;

  const sectors = rawSectors.filter(isSectorCount);
  const regions = rawRegions.filter((item): item is string => typeof item === "string");
  const stages = rawStages.filter((item): item is string => typeof item === "string");
  if (
    sectors.length !== rawSectors.length ||
    regions.length !== rawRegions.length ||
    stages.length !== rawStages.length
  ) return null;

  return {
    sectors: sectors.map(({ sector, project_count }) => ({
      sector,
      projectCount: project_count,
    })),
    regions,
    stages,
  };
}

async function getJson(path: string, cookieHeader?: string) {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      cache: "no-store",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Le catalogue est momentanément indisponible.");
    }
    throw error;
  }
  return response;
}

export async function getPublicProjects(
  query?: PublicProjectQuery,
): Promise<PublicProjectCatalog> {
  const searchParams = new URLSearchParams();
  if (query) {
    if (query.query) searchParams.set("q", query.query);
    query.sectors?.forEach((sector) => searchParams.append("sector", sector));
    if (query.region) searchParams.set("region", query.region);
    if (query.stage) searchParams.set("stage", query.stage);
    if (query.minAmount !== undefined) searchParams.set("minAmount", String(query.minAmount));
    if (query.maxAmount !== undefined) searchParams.set("maxAmount", String(query.maxAmount));
    searchParams.set("sort", query.sort ?? "newest");
    searchParams.set("page", String(query.page));
    searchParams.set("pageSize", String(query.pageSize));
  }
  const queryString = searchParams.toString();
  const response = await getJson(`projects/${queryString ? `?${queryString}` : ""}`);
  if (!response.ok) throw new Error("Le catalogue est momentanément indisponible.");
  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.projects)) {
    throw new Error("Le service a renvoyé un catalogue invalide.");
  }

  const projects = payload.projects.map(parseProject);
  const stats = parseStats(payload.stats);
  if (!stats || projects.some((project) => project === null)) {
    throw new Error("Le service a renvoyé des informations de catalogue invalides.");
  }
  const facets = parseFacets(payload);
  if (!facets) {
    throw new Error("Le service a renvoyé des filtres de catalogue invalides.");
  }
  const pagination =
    "pagination" in payload ? parsePagination(payload.pagination) : undefined;
  if ("pagination" in payload && !pagination) {
    throw new Error("Le service a renvoyé des informations de pagination invalides.");
  }
  return {
    projects: projects as CatalogProject[],
    stats,
    facets,
    ...(pagination ? { pagination } : {}),
  };
}

export async function getPublicProject(
  slug: string,
  cookieHeader?: string,
): Promise<CatalogProject | null> {
  const response = await getJson(
    `projects/${encodeURIComponent(slug)}/`,
    cookieHeader,
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Ce projet est momentanément indisponible.");

  const payload: unknown = await response.json();
  const project = isRecord(payload) ? parseProject(payload.project) : null;
  if (!project) throw new Error("Le service a renvoyé une fiche projet invalide.");
  return project;
}