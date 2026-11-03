import type { Metadata } from "next";
import { Suspense } from "react";
import StudentDashboard from "../../../components/students/StudentDashboard";

export const metadata: Metadata = {
  title: "Détail du projet | Espace étudiant | InvestGuinée",
  description: "Consultez les informations d’un projet depuis votre espace étudiant.",
};

async function StudentProjectContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <StudentDashboard initialSection="project" projectSlug={slug} />;
}

export default function StudentProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<div className="sd-loading" aria-live="polite">Chargement du projet…</div>}>
      <StudentProjectContent params={params} />
    </Suspense>
  );
}
