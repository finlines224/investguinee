import type { Metadata } from "next";
import StudentDashboard from "../../components/students/StudentDashboard";

export const metadata: Metadata = {
  title: "Mentorat | Espace étudiant | InvestGuinée",
  description: "Préparez votre démarche de mentorat depuis votre espace étudiant.",
};

export default function StudentMentorshipPage() {
  return <StudentDashboard initialSection="mentorat" />;
}
