"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Handshake,
  Lightbulb,
  MessageCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

const communityPrinciples = [
  {
    icon: MessageCircle,
    title: "Partager vos expériences",
    description: "Échangez autour des idées, des apprentissages et des défis de votre parcours.",
  },
  {
    icon: Handshake,
    title: "Créer des collaborations",
    description: "Rencontrez des étudiants et porteurs de projets qui partagent vos centres d’intérêt.",
  },
  {
    icon: ShieldCheck,
    title: "Échanger avec respect",
    description: "Favorisez l’écoute, la bienveillance et la protection des informations personnelles.",
  },
];

export default function StudentCommunityWorkspace() {
  return (
    <section className="student-community-view" aria-labelledby="student-community-heading">
      <header className="student-community-hero">
        <div className="student-community-hero__copy">
          <span>VOTRE ESPACE ÉTUDIANT</span>
          <h1 id="student-community-heading">Communauté</h1>
          <p>
            Les projets prennent de l’ampleur quand les idées se rencontrent.
            Préparez-vous à échanger et à apprendre avec d’autres étudiants.
          </p>
        </div>
        <span className="student-community-hero__icon" aria-hidden="true">
          <UsersRound size={38} />
        </span>
      </header>

      <section className="student-community-status" aria-label="Disponibilité de la communauté">
        <span className="student-community-status__icon" aria-hidden="true">
          <MessageCircle size={20} />
        </span>
        <div>
          <span className="student-community-status__label">Disponibilité de l’espace</span>
          <h2>L’espace communautaire sera disponible prochainement.</h2>
          <p>
            Les discussions et les échanges entre membres ne sont pas encore
            ouverts. Aucune publication ni aucun message ne peut être envoyé pour le moment.
          </p>
        </div>
      </section>

      <section className="student-community-principles" aria-labelledby="student-community-principles-heading">
        <div className="student-community-section-heading">
          <span>UN ESPACE POUR GRANDIR ENSEMBLE</span>
          <h2 id="student-community-principles-heading">Ce qui fera vivre la communauté</h2>
          <p>Quelques principes pour des échanges utiles, constructifs et inclusifs.</p>
        </div>
        <ol>
          {communityPrinciples.map(({ icon: Icon, title, description }, index) => (
            <li key={title}>
              <span className="student-community-principles__number">0{index + 1}</span>
              <span className="student-community-principles__icon" aria-hidden="true">
                <Icon size={20} />
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="student-community-next" aria-labelledby="student-community-next-heading">
        <span className="student-community-next__icon" aria-hidden="true">
          <Lightbulb size={21} />
        </span>
        <div>
          <span>EN ATTENDANT</span>
          <h2 id="student-community-next-heading">Continuez à faire avancer vos projets.</h2>
          <p>Explorez les initiatives de la plateforme ou structurez votre propre idée.</p>
        </div>
        <div className="student-community-next__actions">
          <Link className="sd-btn sd-btn--green" href="/espace-etudiant/projets">
            Découvrir les projets <ArrowRight size={15} />
          </Link>
          <Link className="student-community-next__secondary" href="/espace-etudiant/idee">
            <BookOpen size={14} /> Structurer mon idée
          </Link>
        </div>
      </section>
    </section>
  );
}
