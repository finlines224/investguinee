type AuthPayload = Record<string, string | boolean>;

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_AUTH_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8000/api" : "")
).trim();

export function apiUrl(endpoint: string) {
  if (!apiBaseUrl) {
    throw new Error(
      "Le service backend n’est pas encore configuré. Vos données n’ont pas été envoyées.",
    );
  }
  return `${apiBaseUrl.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
}

export function authApiUrl(endpoint: "session/") {
  return apiUrl(`auth/${endpoint}`);
}

export async function postAuthRequest(
  endpoint:
    | "login/"
    | "register/"
    | "logout/"
    | "password-reset/"
    | "password-reset/confirm/",
  payload: AuthPayload,
) {
  const baseUrl = apiBaseUrl.replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error(
      "Le service d’authentification n’est pas encore configuré. Vos données n’ont pas été envoyées.",
    );
  }
  let response: Response;
  try {
    const csrfResponse = await fetch(`${baseUrl}/auth/csrf/`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!csrfResponse.ok) {
      throw new Error("Impossible d’initialiser une connexion sécurisée. Réessayez.");
    }

    const csrfData: unknown = await csrfResponse.json();
    const csrfToken =
      typeof csrfData === "object" &&
      csrfData !== null &&
      "csrfToken" in csrfData &&
      typeof csrfData.csrfToken === "string"
        ? csrfData.csrfToken
        : "";
    if (!csrfToken) {
      throw new Error("Le service n’a pas fourni de jeton de sécurité. Réessayez.");
    }

    response = await fetch(`${baseUrl}/auth/${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof Error && !(error instanceof TypeError)) {
      throw error;
    }
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre le service. Vérifiez votre connexion et réessayez.");
    }
    throw error;
  }

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => null);
    if (
      typeof errorData === "object" &&
      errorData !== null &&
      "detail" in errorData &&
      typeof errorData.detail === "string"
    ) {
      throw new Error(errorData.detail);
    }
    throw new Error(
      response.status >= 500
        ? "Le service rencontre un problème. Veuillez réessayer plus tard."
        : "La demande n’a pas pu être traitée. Vérifiez vos informations et réessayez.",
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error("Le service a renvoyé une réponse invalide. Veuillez réessayer.");
  }
}
