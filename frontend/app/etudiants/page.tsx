import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import StudentExperience from "../components/students/StudentExperience";

export const metadata: Metadata = {
  title: "Étudiants | InvestGuinée",
  description:
    "Découvrez des ressources de démonstration pour explorer l’entrepreneuriat, la finance et les compétences utiles aux étudiants en Guinée.",
};

export default function StudentsPage() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <StudentExperience />
    </div>
  );
}
