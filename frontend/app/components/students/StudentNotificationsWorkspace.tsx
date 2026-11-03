"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BellOff,
  BookOpen,
  Check,
  Heart,
  Lightbulb,
  Trophy,
} from "lucide-react";

const notificationTypes = [
  { icon: Heart, label: "Projets favoris", tone: "purple" },
  { icon: BookOpen, label: "Formations", tone: "blue" },
  { icon: Trophy, label: "Défis & concours", tone: "amber" },
];

export default function StudentNotificationsWorkspace() {
  return (
    <section className="student-notifications-view" aria-labelledby="student-notifications-heading">
      <header className="student-notifications-hero">
        <div className="student-notifications-hero__copy">
          <span>VOTRE ESPACE ÉTUDIANT</span>
          <h1 id="student-notifications-heading">Notifications</h1>
          <p>
            Retrouvez ici les actualités et les informations importantes liées
            à votre parcours sur InvestGuinée.
          </p>
        </div>
        <span className="student-notifications-hero__icon" aria-hidden="true">
          <Bell size={36} />
        </span>
      </header>

      <div className="student-notifications-summary">
        <span className="student-notifications-summary__icon" aria-hidden="true">
          <Check size={19} />
        </span>
        <div>
          <strong>Tout est à jour</strong>
          <span>Aucune notification non lue</span>
        </div>
        <span className="student-notifications-summary__count">0 non lue</span>
      </div>

      <section className="student-notifications-empty" aria-label="Liste des notifications">
        <span className="student-notifications-empty__icon" aria-hidden="true">
          <BellOff size={27} />
        </span>
        <span className="student-notifications-empty__eyebrow">VOTRE ACTIVITÉ</span>
        <h2>Vous êtes à jour !</h2>
        <p>
          Vous n’avez pas encore de notification. Les nouvelles informations
          apparaîtront ici lorsqu’elles seront disponibles.
        </p>
        <div className="student-notifications-empty__topics" aria-label="Actualités possibles">
          {notificationTypes.map(({ icon: Icon, label, tone }) => (
            <span className={`student-notifications-topic student-notifications-topic--${tone}`} key={label}>
              <Icon size={14} aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="student-notifications-next" aria-labelledby="student-notifications-next-heading">
        <span className="student-notifications-next__icon" aria-hidden="true">
          <Lightbulb size={21} />
        </span>
        <div>
          <span>EN ATTENDANT</span>
          <h2 id="student-notifications-next-heading">Continuez à explorer votre espace.</h2>
          <p>Découvrez des projets ou retrouvez les ressources disponibles pour votre parcours.</p>
        </div>
        <div className="student-notifications-next__actions">
          <Link className="sd-btn sd-btn--green" href="/espace-etudiant/projets">
            Découvrir les projets <ArrowRight size={15} />
          </Link>
          <Link className="student-notifications-next__secondary" href="/espace-etudiant/formations">
            Voir les formations
          </Link>
        </div>
      </section>
    </section>
  );
}
