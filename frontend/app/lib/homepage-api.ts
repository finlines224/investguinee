import { apiUrl } from "./auth-api";

export type HomepageStats = {
  members: number;
  publishedProjects: number;
  investors: number;
  entrepreneurs: number;
};

export type HomepageProject = {
  id: number;
  slug: string;
  title: string;
  sector: string;
  region: string;
  location: string;
  fundingGoal: number;
  publishedAt: string;
};

export type HomepageSector = {
  sector: string;
  project_count: number;
};

export type HomepageData = {
  stats: HomepageStats;
  projects: HomepageProject[];
  sectors: HomepageSector[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseHomepageData(value: unknown): HomepageData | null {
  if (!isRecord(value) || !isRecord(value.stats)) return null;
  const { stats, projects, sectors } = value;
  if (
    typeof stats.members !== "number" ||
    typeof stats.publishedProjects !== "number" ||
    typeof stats.investors !== "number" ||
    typeof stats.entrepreneurs !== "number" ||
    !Array.isArray(projects) ||
    !Array.isArray(sectors)
  ) {
    return null;
  }

  const validProjects = projects.every((project) =>
    isRecord(project) &&
    typeof project.id === "number" &&
    typeof project.slug === "string" &&
    typeof project.title === "string" &&
    typeof project.sector === "string" &&
    typeof project.region === "string" &&
    typeof project.location === "string" &&
    typeof project.fundingGoal === "number" &&
    typeof project.publishedAt === "string",
  );
  const validSectors = sectors.every((sector) =>
    isRecord(sector) &&
    typeof sector.sector === "string" &&
    typeof sector.project_count === "number",
  );
  if (!validProjects || !validSectors) return null;

  return {
    stats: {
      members: stats.members,
      publishedProjects: stats.publishedProjects,
      investors: stats.investors,
      entrepreneurs: stats.entrepreneurs,
    },
    projects: projects as HomepageProject[],
    sectors: sectors as HomepageSector[],
  };
}

export async function getHomepageData(): Promise<HomepageData> {
  let response: Response;
  try {
    response = await fetch(apiUrl("home/"), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Le service est momentanément indisponible.");
    }
    throw error;
  }
  if (!response.ok) throw new Error("Le service est momentanément indisponible.");

  const data = parseHomepageData(await response.json());
  if (!data) throw new Error("Les données de l’accueil sont invalides.");
  return data;
}