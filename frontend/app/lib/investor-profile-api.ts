import { apiUrl } from "./auth-api";

export type InvestorProfile = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profileType: string;
  sector: string;
  isVerified: boolean;
};

export type InvestorProfileUpdate = Pick<
  InvestorProfile,
  "firstName" | "lastName" | "phoneNumber" | "profileType" | "sector"
>;

function isInvestorProfile(payload: unknown): payload is InvestorProfile {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "firstName" in payload &&
    typeof payload.firstName === "string" &&
    "lastName" in payload &&
    typeof payload.lastName === "string" &&
    "fullName" in payload &&
    typeof payload.fullName === "string" &&
    "email" in payload &&
    typeof payload.email === "string" &&
    "phoneNumber" in payload &&
    typeof payload.phoneNumber === "string" &&
    "profileType" in payload &&
    typeof payload.profileType === "string" &&
    "sector" in payload &&
    typeof payload.sector === "string" &&
    "isVerified" in payload &&
    typeof payload.isVerified === "boolean"
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

async function getInvestorCsrfToken() {
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

export async function getInvestorProfile(): Promise<InvestorProfile> {
  let response: Response;
  try {
    response = await fetch(apiUrl("investor/profile/"), {
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
      await readError(response, "Impossible de charger votre profil investisseur."),
    );
  }
  const payload: unknown = await response.json();
  if (!isInvestorProfile(payload)) {
    throw new Error("Le service a renvoyé un profil investisseur invalide.");
  }
  return payload;
}

export async function updateInvestorProfile(
  profile: InvestorProfileUpdate,
): Promise<InvestorProfile> {
  const csrfToken = await getInvestorCsrfToken();

  let response: Response;
  try {
    response = await fetch(apiUrl("investor/profile/"), {
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
  if (!isInvestorProfile(payload)) {
    throw new Error("Le service a renvoyé un profil investisseur invalide.");
  }
  return payload;
}
