import type { Metadata } from "next";
import AdminDashboard from "../components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Administration | InvestGuinée",
  description: "Tableau de bord d'administration InvestGuinée.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
