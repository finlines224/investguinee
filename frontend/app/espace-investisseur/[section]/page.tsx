import { notFound } from "next/navigation";
import InvestorDashboard from "../../components/investor-dashboard/InvestorDashboard";
import { investorSections } from "../../components/investor-dashboard/investor-sections";

export function generateStaticParams() {
  return investorSections
    .filter((section) => section.id !== "dashboard")
    .map((section) => ({ section: section.id }));
}

export default async function InvestorSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const selectedSection = investorSections.find((item) => item.id === section);
  if (!selectedSection) notFound();

  return <InvestorDashboard initialSection={selectedSection.id} />;
}
