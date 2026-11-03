import { apiUrl } from "./auth-api";

export type EntrepreneurProjectStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export type EntrepreneurProject = {
  id: number;
  title: string;
  description: string;
  sector: string;
  region: string;
  fundingGoal: number;
  stage: string;
  status: EntrepreneurProjectStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
};

export type EntrepreneurProjectInput = Pick<
  EntrepreneurProject,
  "title" | "description" | "sector" | "region" | "fundingGoal" | "stage"
>;

function isProject(payload: unknown): payload is EntrepreneurProject {
  if (typeof payload !== "object" || payload === null) return false;
  const project = payload as Record<string, unknown>;
  return (
    typeof project.id === "number" &&
    typeof project.title === "string" &&
    typeof project.description === "string" &&
    typeof project.sector === "string" &&
    typeof project.region === "string" &&
    typeof project.fundingGoal === "number" &&
    typeof project.stage === "string" &&
    (project.status === "DRAFT" ||
      project.status === "SUBMITTED" ||
      project.status === "APPROVED" ||
      project.status === "REJECTED") &&
    typeof project.statusLabel === "string" &&
    typeof project.createdAt === "string" &&
    typeof project.updatedAt === "string"
  );
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
      throw new Error("Impossible de joindre le service. Vérifiez votre connexion et réessayez.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error("Impossible d’initialiser une connexion sécurisée. Réessayez.");
  }
  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("csrfToken" in payload) ||
    typeof payload.csrfToken !== "string"
  ) {
    throw new Error("Le service n’a pas fourni de jeton de sécurité. Réessayez.");
  }
  return payload.csrfToken;
}

async function requestProject(
  path: string,
  method: "POST" | "PATCH",
  payload: unknown,
): Promise<unknown> {
  const csrfToken = await getCsrfToken();
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
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre le service. Vérifiez votre connexion et réessayez.");
    }
    throw error;
  }

  const responsePayload: unknown = await response.json();
  if (!response.ok) {
    if (
      typeof responsePayload === "object" &&
      responsePayload !== null &&
      "detail" in responsePayload &&
      typeof responsePayload.detail === "string"
    ) {
      throw new Error(responsePayload.detail);
    }
    throw new Error("La demande n’a pas pu être traitée. Veuillez réessayer.");
  }
  return responsePayload;
}

function readProjectResponse(payload: unknown): EntrepreneurProject {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("project" in payload) ||
    !isProject(payload.project)
  ) {
    throw new Error("Le service a renvoyé un projet invalide.");
  }
  return payload.project;
}

export async function getEntrepreneurProjects(): Promise<EntrepreneurProject[]> {
  let response: Response;
  try {
    response = await fetch(apiUrl("entrepreneur/projects/"), {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre le service. Vérifiez votre connexion et réessayez.");
    }
    throw error;
  }

  const payload: unknown = await response.json();
  if (!response.ok) {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof payload.detail === "string"
    ) {
      throw new Error(payload.detail);
    }
    throw new Error("Impossible de charger vos projets. Veuillez réessayer.");
  }
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("projects" in payload) ||
    !Array.isArray(payload.projects) ||
    !payload.projects.every(isProject)
  ) {
    throw new Error("Le service a renvoyé une liste de projets invalide.");
  }
  return payload.projects;
}

export async function createEntrepreneurProject(
  input: EntrepreneurProjectInput,
  action: "save" | "submit",
) {
  const payload = await requestProject(
    "entrepreneur/projects/",
    "POST",
    { ...input, action },
  );
  return readProjectResponse(payload);
}

export async function updateEntrepreneurProject(
  projectId: number,
  input: EntrepreneurProjectInput,
  action: "save" | "submit",
) {
  const payload = await requestProject(
    `entrepreneur/projects/${projectId}/`,
    "PATCH",
    { ...input, action },
  );
  return readProjectResponse(payload);
}
