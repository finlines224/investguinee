import { notFound } from "next/navigation";
import type { Metadata } from "next";
import EntrepreneurWorkspace from "../../../components/entrepreneur/EntrepreneurWorkspace";

export const metadata: Metadata = {
  title: "Modifier un projet | InvestGuinée",
};

export const instant = false;

export default async function EditEntrepreneurProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const parsedProjectId = Number(projectId);
  if (!Number.isSafeInteger(parsedProjectId) || parsedProjectId < 1) {
    notFound();
  }
  return <EntrepreneurWorkspace mode="form" projectId={parsedProjectId} />;
}
