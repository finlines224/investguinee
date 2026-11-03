import type { Metadata } from "next";
import StudentDashboard from "../../components/students/StudentDashboard";

export const metadata: Metadata = {
  title: "Formations | Espace étudiant | InvestGuinée",
  description: "Parcourez les ressources pédagogiques de l’espace étudiant.",
};

export default function StudentTrainingPage() {
  return <StudentDashboard initialSection="training" />;
}
