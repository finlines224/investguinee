import type { Metadata } from "next";
import AuthExperience from "../components/auth/AuthExperience";

export const instant = false;

export const metadata: Metadata = {
  title: "Choisir un nouveau mot de passe | InvestGuinée",
  description: "Réinitialisez le mot de passe de votre compte InvestGuinée.",
};

export default async function ReinitialiserMotDePassePage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string; token?: string }>;
}) {
  const { uid, token } = await searchParams;

  return (
    <AuthExperience
      mode="reset"
      resetToken={uid && token ? { uid, token } : null}
    />
  );
}
