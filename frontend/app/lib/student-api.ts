import { apiUrl } from "./auth-api";

export type StudentProfile = {
  institution: string;
  studyField: string;
};

export type StudentFavoriteUpdate = {
  projectIds: number[];
  unavailableProjectIds: number[];
};

function isProjectIdsResponse(payload: unknown): payload is { projectIds: number[] } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "projectIds" in payload &&
    Array.isArray(payload.projectIds) &&
    payload.projectIds.every(
      (id) => typeof id === "number" && Number.isSafeInteger(id) && id > 0,
    )
  );
}

function isStudentFavoriteUpdate(payload: unknown): payload is StudentFavoriteUpdate {
  return (
    isProjectIdsResponse(payload) &&
    "unavailableProjectIds" in payload &&
    Array.isArray(payload.unavailableProjectIds) &&
    payload.unavailableProjectIds.every(
      (id) => typeof id === "number" && Number.isSafeInteger(id) && id > 0,
    )
  );
}

function isStudentProfile(payload: unknown): payload is StudentProfile {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "institution" in payload &&
    typeof payload.institution === "string" &&
    "studyField" in payload &&
    typeof payload.studyField === "string"
  );
}

async function readError(response: Response, fallback: string) {
  const payload: unknown = await response.json().catch(() => null);
  if (
    typeof payload === "object" &&
    payload !== null &&
    "detail" in payload &&
    typeof payload.detail === "string"
  ) {
    return payload.detail;
  }
  return fallback;
}

async function getStudentCsrfToken() {
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

export async function getStudentProfile(): Promise<StudentProfile> {
  let response: Response;
  try {
    response = await fetch(apiUrl("student/profile/"), {
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
    throw new Error(
      await readError(response, "Impossible de charger votre profil étudiant."),
    );
  }
  const payload: unknown = await response.json();
  if (!isStudentProfile(payload)) {
    throw new Error("Le service a renvoyé un profil étudiant invalide.");
  }
  return payload;
}

export async function updateStudentProfile(
  profile: StudentProfile,
): Promise<StudentProfile> {
  const csrfToken = await getStudentCsrfToken();

  let response: Response;
  try {
    response = await fetch(apiUrl("student/profile/"), {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify(profile),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre le service. Vérifiez votre connexion et réessayez.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(
      await readError(response, "Impossible d’enregistrer votre profil."),
    );
  }
  const payload: unknown = await response.json();
  if (!isStudentProfile(payload)) {
    throw new Error("Le service a renvoyé un profil étudiant invalide.");
  }
  return payload;
}

export async function getStudentFavoriteIds(): Promise<number[]> {
  let response: Response;
  try {
    response = await fetch(apiUrl("student/favorites/"), {
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
    throw new Error(
      await readError(response, "Impossible de charger vos projets favoris."),
    );
  }
  const payload: unknown = await response.json();
  if (!isProjectIdsResponse(payload)) {
    throw new Error("Le service a renvoyé une liste de favoris invalide.");
  }
  return payload.projectIds;
}

export async function updateStudentFavoriteIds(
  projectIds: number[],
): Promise<StudentFavoriteUpdate> {
  if (
    !Array.isArray(projectIds) ||
    !projectIds.every((id) => Number.isSafeInteger(id) && id > 0)
  ) {
    throw new Error("La liste des projets favoris est invalide.");
  }

  const csrfToken = await getStudentCsrfToken();

  let response: Response;
  try {
    response = await fetch(apiUrl("student/favorites/"), {
      method: "PUT",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({ projectIds }),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre le service. Vérifiez votre connexion et réessayez.");
    }
    throw error;
  }
  if (!response.ok) {
    throw new Error(
      await readError(response, "Impossible d’enregistrer vos projets favoris."),
    );
  }
  const payload: unknown = await response.json();
  if (!isStudentFavoriteUpdate(payload)) {
    throw new Error("Le service a renvoyé une liste de favoris invalide.");
  }
  return payload;
}
