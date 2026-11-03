import type { Metadata } from "next";
import StudentDashboard from "../../components/students/StudentDashboard";

export const metadata: Metadata = {
  title: "Communauté | Espace étudiant | InvestGuinée",
  description: "Préparez vos échanges avec la communauté étudiante InvestGuinée.",
};

export default function StudentCommunityPage() {
  return <StudentDashboard initialSection="communaute" />;
}
