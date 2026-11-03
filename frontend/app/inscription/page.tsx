import type { Metadata } from "next";
import AuthExperience from "../components/auth/AuthExperience";

export const metadata: Metadata = {
  title: "Inscription | InvestGuinée",
  description: "Rejoignez l’écosystème InvestGuinée.",
};

export default function InscriptionPage() {
  return <AuthExperience mode="register" />;
}
