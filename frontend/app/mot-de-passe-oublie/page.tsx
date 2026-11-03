import type { Metadata } from "next";
import AuthExperience from "../components/auth/AuthExperience";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe | InvestGuinée",
  description: "Demandez les instructions de réinitialisation de votre mot de passe.",
};

export default function MotDePasseOubliePage() {
  return <AuthExperience mode="forgot" />;
}
