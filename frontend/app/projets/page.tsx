import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "../components/Navbar";
import ProjectExplorer from "../components/projects/ProjectExplorer";
import { getPublicProjects } from "../lib/public-project-api";

export const metadata: Metadata = {
  title: "Explorer les projets | InvestGuinée",
  description: "Explorez des projets d’investissement et d’innovation en Guinée.",
};

type ProjectsPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

async function ProjectsContent({ searchParams }: ProjectsPageProps) {
  const { q } = await searchParams;
  let catalog = null;
  let loadError = "";
  try {
    catalog = await getPublicProjects();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Impossible de charger le catalogue.";
  }

  return (
    <ProjectExplorer
      initialQuery={Array.isArray(q) ? q[0] ?? "" : q ?? ""}
      projects={catalog?.projects ?? []}
      stats={catalog?.stats ?? null}
      loadError={loadError}
    />
  );
}

export default function ProjectsPage({ searchParams }: ProjectsPageProps) {
  return (
    <div className="page-wrapper">
      <Navbar />
      <Suspense fallback={<main className="projects-page" aria-live="polite">Chargement des projets…</main>}>
        <ProjectsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
