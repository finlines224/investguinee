import type { Metadata } from "next";
import StudentDashboard from "../../components/students/StudentDashboard";

export const metadata: Metadata = {
  title: "Défis & concours | Espace étudiant | InvestGuinée",
  description: "Consultez les défis et concours proposés dans l’espace étudiant.",
};

export default function StudentChallengesPage() {
  return <StudentDashboard initialSection="challenges" />;
}
