import type { Metadata } from "next";
import StudentDashboard from "../../components/students/StudentDashboard";

export const metadata: Metadata = {
  title: "Mes favoris | Espace étudiant | InvestGuinée",
  description: "Retrouvez les projets enregistrés dans votre espace étudiant.",
};

export default function StudentFavoritesPage() {
  return <StudentDashboard initialSection="favorites" />;
}
