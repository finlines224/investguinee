import type { Metadata } from "next";
import StudentDashboard from "../../components/students/StudentDashboard";

export const metadata: Metadata = {
  title: "Mon profil | Espace étudiant | InvestGuinée",
  description: "Consultez et mettez à jour les informations de votre profil étudiant.",
};

export default function StudentProfilePage() {
  return <StudentDashboard initialSection="profile" />;
}
