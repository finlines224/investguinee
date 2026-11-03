import type { Metadata } from "next";
import StudentDashboard from "../../components/students/StudentDashboard";

export const metadata: Metadata = {
  title: "Découvrir les projets | Espace étudiant | InvestGuinée",
  description: "Explorez les projets publiés et enregistrez vos favoris depuis votre espace étudiant.",
};

export default function StudentProjectsPage() {
  return <StudentDashboard initialSection="projects" />;
}
