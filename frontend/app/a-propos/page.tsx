import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import AboutExperience from "../components/about/AboutExperience";

export const metadata: Metadata = {
  title: "À propos | InvestGuinée",
  description:
    "Découvrez la démarche d’InvestGuinée, une plateforme en développement pour connecter les projets, les talents et les acteurs de l’innovation en Guinée.",
};

export default function AboutPage() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <AboutExperience />
    </div>
  );
}
