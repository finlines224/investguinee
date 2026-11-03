import type { Metadata } from "next";
import StudentDashboard from "../../components/students/StudentDashboard";

export const metadata: Metadata = {
  title: "Paramètres | Espace étudiant | InvestGuinée",
  description: "Gérez les paramètres de sécurité et d’accès de votre compte étudiant.",
};

export default function StudentSettingsPage() {
  return <StudentDashboard initialSection="settings" />;
}
