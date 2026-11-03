"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CircleHelp,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { AuthenticatedUser } from "../../lib/session-api";

export default function StudentSettingsWorkspace({
  user,
  isLoggingOut,
  onLogout,
}: {
  user: AuthenticatedUser;
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  return (
    <section className="student-settings-view" aria-labelledby="student-settings-heading">
      <header className="student-settings-hero">
        <div className="student-settings-hero__copy">
          <span>VOTRE ESPACE ÉTUDIANT</span>
          <h1 id="student-settings-heading">Paramètres</h1>
          <p>
            Gérez la sécurité de votre compte et retrouvez les options
            disponibles pour votre espace étudiant.
          </p>
        </div>
        <span className="student-settings-hero__icon" aria-hidden="true">
          <ShieldCheck size={36} />
        </span>
      </header>

      <section className="student-settings-account" aria-labelledby="student-settings-account-heading">
        <div className="student-settings-section-heading">
          <span>COMPTE ET SÉCURITÉ</span>
          <h2 id="student-settings-account-heading">Accès à votre compte</h2>
          <p>Consultez les informations de votre compte et protégez votre accès.</p>
        </div>

        <div className="student-settings-options">
          <article className="student-settings-option">
            <span className="student-settings-option__icon" aria-hidden="true">
              <Mail size={19} />
            </span>
            <div className="student-settings-option__content">
              <h3>Adresse email</h3>
              <p>{user.email}</p>
              <span className={user.isVerified ? "student-settings-option__status student-settings-option__status--verified" : "student-settings-option__status student-settings-option__status--pending"}>
                <i aria-hidden="true" />
                {user.isVerified ? "Adresse vérifiée" : "Vérification en attente"}
              </span>
            </div>
            <Link className="student-settings-option__link" href="/espace-etudiant/profil" aria-label="Consulter mon profil">
              <ArrowRight size={17} />
            </Link>
          </article>

          <article className="student-settings-option">
            <span className="student-settings-option__icon student-settings-option__icon--green" aria-hidden="true">
              <KeyRound size={19} />
            </span>
            <div className="student-settings-option__content">
              <h3>Mot de passe</h3>
              <p>Modifiez votre mot de passe via le parcours sécurisé de récupération.</p>
            </div>
            <Link className="student-settings-option__action" href="/mot-de-passe-oublie">
              Modifier <ArrowRight size={14} />
            </Link>
          </article>

          <article className="student-settings-option student-settings-option--unavailable">
            <span className="student-settings-option__icon student-settings-option__icon--amber" aria-hidden="true">
              <Bell size={19} />
            </span>
            <div className="student-settings-option__content">
              <h3>Préférences de notification</h3>
              <p>La gestion des préférences de notification n’est pas encore disponible.</p>
            </div>
            <span className="student-settings-option__coming">À venir</span>
          </article>
        </div>
      </section>

      <section className="student-settings-profile" aria-labelledby="student-settings-profile-heading">
        <span className="student-settings-profile__icon" aria-hidden="true">
          <UserRound size={20} />
        </span>
        <div>
          <span>INFORMATIONS PERSONNELLES</span>
          <h2 id="student-settings-profile-heading">Votre profil étudiant</h2>
          <p>Mettez à jour votre établissement et votre domaine d’études.</p>
        </div>
        <Link className="sd-btn sd-btn--outline" href="/espace-etudiant/profil">
          Ouvrir mon profil <ArrowRight size={15} />
        </Link>
      </section>

      <section className="student-settings-signout" aria-labelledby="student-settings-signout-heading">
        <span className="student-settings-signout__icon" aria-hidden="true">
          <CircleHelp size={20} />
        </span>
        <div>
          <h2 id="student-settings-signout-heading">Vous avez terminé ?</h2>
          <p>Déconnectez-vous si vous utilisez un appareil partagé.</p>
        </div>
        <button
          type="button"
          className="student-settings-signout__button"
          onClick={onLogout}
          disabled={isLoggingOut}
        >
          <LogOut size={15} />
          {isLoggingOut ? "Déconnexion…" : "Se déconnecter"}
        </button>
      </section>
    </section>
  );
}
