import type { Metadata } from "next";
import EntrepreneurWorkspace from "../../components/entrepreneur/EntrepreneurWorkspace";

export const metadata: Metadata = {
  title: "Créer un projet | InvestGuinée",
  description: "Présentez un projet entrepreneurial à InvestGuinée.",
};

export default function NewEntrepreneurProjectPage() {
  return <EntrepreneurWorkspace mode="form" />;
}
