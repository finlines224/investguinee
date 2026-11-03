import type { Metadata } from "next";
import StudentDashboard from "../../components/students/StudentDashboard";

export const metadata: Metadata = {
  title: "Notifications | Espace étudiant | InvestGuinée",
  description: "Consultez les actualités de votre espace étudiant InvestGuinée.",
};

export default function StudentNotificationsPage() {
  return <StudentDashboard initialSection="notifications" />;
}
