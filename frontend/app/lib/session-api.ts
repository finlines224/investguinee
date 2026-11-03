import { authApiUrl } from "./auth-api";

export type AuthenticatedUser = {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: "INVESTOR" | "ENTREPRENEUR" | "STUDENT" | "ADMIN";
  isVerified: boolean;
};

export function parseAuthenticatedUser(payload: unknown): AuthenticatedUser {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("user" in payload) ||
    typeof payload.user !== "object" ||
    payload.user === null
  ) {
    throw new Error("Le service a renvoyé des informations de session invalides.");
  }

  const user = payload.user;
  if (
    !("id" in user) ||
    typeof user.id !== "number" ||
    !("firstName" in user) ||
    typeof user.firstName !== "string" ||
    !("lastName" in user) ||
    typeof user.lastName !== "string" ||
    !("fullName" in user) ||
    typeof user.fullName !== "string" ||
    !("email" in user) ||
    typeof user.email !== "string" ||
    !("role" in user) ||
    (user.role !== "INVESTOR" &&
      user.role !== "ENTREPRENEUR" &&
      user.role !== "STUDENT" &&
      user.role !== "ADMIN") ||
    !("isVerified" in user) ||
    typeof user.isVerified !== "boolean"
  ) {
    throw new Error("Le service a renvoyé des informations de session invalides.");
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  let response: Response;
  try {
    response = await fetch(authApiUrl("session/"), {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Impossible de joindre le service. Vérifiez votre connexion et réessayez.");
    }
    throw error;
  }

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error("Impossible de vérifier votre session. Veuillez réessayer.");
  }

  return parseAuthenticatedUser(await response.json());
}
