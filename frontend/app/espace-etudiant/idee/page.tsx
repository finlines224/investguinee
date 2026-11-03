import type { Metadata } from "next";
import StudentDashboard from "../../components/students/StudentDashboard";

export const metadata: Metadata = {
  title: "Mon idée de projet | Espace étudiant | InvestGuinée",
  description: "Structurez votre idée de projet depuis votre espace étudiant.",
};

export default function StudentIdeaPage() {
  return <StudentDashboard initialSection="idea" />;
}
