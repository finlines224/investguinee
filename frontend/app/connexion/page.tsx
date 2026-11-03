import type { Metadata } from "next";
import AuthExperience from "../components/auth/AuthExperience";

export const metadata: Metadata = {
  title: "Connexion | InvestGuinée",
  description: "Connectez-vous à votre espace InvestGuinée.",
};

export default function ConnexionPage() {
  return <AuthExperience mode="login" />;
}
