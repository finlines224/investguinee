import type { Metadata } from "next";
import StudentDashboard from "../components/students/StudentDashboard";

export const metadata: Metadata = {
  title: "Espace Étudiant | InvestGuinée",
  description: "Faites grandir vos idées et préparez votre avenir entrepreneurial avec InvestGuinée.",
};

export default function StudentDashboardPage() {
  return <StudentDashboard />;
}
