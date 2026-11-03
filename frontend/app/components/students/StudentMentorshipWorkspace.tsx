"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CircleHelp,
  Lightbulb,
  MessageCircle,
  UsersRound,
} from "lucide-react";

const mentorshipSteps = [
  {
    icon: Lightbulb,
    title: "Clarifier votre objectif",
    description: "Précisez le défi que vous voulez résoudre et le type d’aide recherché.",
  },
  {
    icon: UsersRound,
    title: "Trouver le bon profil",
    description: "La mise en relation pourra tenir compte de votre secteur et de vos besoins.",
  },
  {
    icon: CalendarDays,
    title: "Organiser les échanges",
    description: "Définissez ensemble le rythme et les prochaines étapes de votre accompagnement.",
  },
];

export default function StudentMentorshipWorkspace() {
  return (
    <section className="student-mentorship-view" aria-labelledby="student-mentorship-heading">
      <header className="student-mentorship-hero">
        <div className="student-mentorship-hero__copy">
          <span>VOTRE ESPACE ÉTUDIANT</span>
          <h1 id="student-mentorship-heading">Mentorat</h1>
          <p>
            Avancez avec le regard et l’expérience d’un mentor. Préparez votre
            démarche dès maintenant, à votre rythme.
          </p>
        </div>
        <span className="student-mentorship-hero__icon" aria-hidden="true">
          <MessageCircle size={37} />
        </span>
      </header>

      <section className="student-mentorship-status" aria-label="Disponibilité du mentorat">
        <span className="student-mentorship-status__icon" aria-hidden="true">
          <CircleHelp size={20} />
        </span>
        <div>
          <span className="student-mentorship-status__label">Disponibilité du service</span>
          <h2>Les demandes de mentorat ne sont pas encore ouvertes.</h2>
          <p>
            Aucun mentor n’est actuellement proposé dans cet espace et aucune
            demande ne peut être envoyée. Cette page vous aide à préparer la suite.
          </p>
        </div>
      </section>

      <section className="student-mentorship-steps" aria-labelledby="student-mentorship-steps-heading">
        <div className="student-mentorship-section-heading">
          <span>POUR BIEN DÉMARRER</span>
          <h2 id="student-mentorship-steps-heading">Comment se préparer au mentorat ?</h2>
          <p>Quelques repères pour tirer le meilleur parti d’un futur accompagnement.</p>
        </div>
        <ol>
          {mentorshipSteps.map(({ icon: Icon, title, description }, index) => (
            <li key={title}>
              <span className="student-mentorship-steps__number">0{index + 1}</span>
              <span className="student-mentorship-steps__icon" aria-hidden="true">
                <Icon size={20} />
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="student-mentorship-next" aria-labelledby="student-mentorship-next-heading">
        <span className="student-mentorship-next__icon" aria-hidden="true">
          <BookOpen size={21} />
        </span>
        <div>
          <span>EN ATTENDANT</span>
          <h2 id="student-mentorship-next-heading">Faites avancer votre projet dès aujourd’hui.</h2>
          <p>Structurez votre idée ou découvrez les initiatives déjà publiées sur la plateforme.</p>
        </div>
        <div className="student-mentorship-next__actions">
          <Link className="sd-btn sd-btn--green" href="/espace-etudiant/idee">
            Structurer mon idée <ArrowRight size={15} />
          </Link>
          <Link className="student-mentorship-next__secondary" href="/espace-etudiant/projets">
            Découvrir les projets
          </Link>
        </div>
      </section>
    </section>
  );
}
