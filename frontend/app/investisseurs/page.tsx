import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "../components/Navbar";
import InvestorExperience from "../components/investors/InvestorExperience";
import { getPublicProjects, type PublicProjectCatalog } from "../lib/public-project-api";

export const metadata: Metadata = {
  title: "Investisseurs | InvestGuinée",
  description:
    "Découvrez les projets guinéens publiés et renseignez-vous avant toute décision d’investissement.",
};

async function InvestorCatalogContent() {
  let catalog: PublicProjectCatalog | null = null;
  let loadError = "";
  try {
    catalog = await getPublicProjects();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Le catalogue est momentanément indisponible.";
  }
  return (
    <InvestorExperience
      projects={catalog?.projects ?? []}
      isAvailable={catalog !== null}
      loadError={loadError}
    />
  );
}

export default function InvestorsPage() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <Suspense fallback={<main className="investor-page" aria-live="polite">Chargement des projets publiés…</main>}>
        <InvestorCatalogContent />
      </Suspense>
    </div>
  );
}
