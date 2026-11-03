import type { Metadata } from "next";
import EntrepreneurDashboard from "../components/entrepreneur/EntrepreneurDashboard";

export const metadata: Metadata = {
  title: "Espace Entrepreneur | InvestGuinée",
  description: "Développez votre entreprise, trouvez des opportunités et innovez en Guinée.",
};

export default function EntrepreneurDashboardPage() {
  return <EntrepreneurDashboard />;
}
