import type { Metadata } from "next";
import InvestorDashboard from "../components/investor-dashboard/InvestorDashboard";

export const metadata: Metadata = {
  title: "Espace investisseur | InvestGuinée",
  description: "Votre espace personnel InvestGuinée.",
};

export default function InvestorDashboardPage() {
  return <InvestorDashboard />;
}
