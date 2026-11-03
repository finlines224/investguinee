"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  GraduationCap,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { StudentProfile } from "../../lib/student-api";
import type { AuthenticatedUser } from "../../lib/session-api";

type Props = {
  user: AuthenticatedUser;
  profile: StudentProfile | null;
  loadError: string;
  onRetry: () => void;
  onSave: (profile: StudentProfile) => Promise<StudentProfile>;
};

const emptyProfile: StudentProfile = { institution: "", studyField: "" };

export default function StudentProfileWorkspace({
  user,
  profile,
  loadError,
  onRetry,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<StudentProfile>(profile ?? emptyProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");

  const completion = profile
    ? Math.round(
        ((2 +
          Number(Boolean(draft.institution.trim())) +
          Number(Boolean(draft.studyField.trim()))) /
          4) *
          100,
      )
    : 0;
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
    .toUpperCase() || "E";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError("");
    setNotice("");
    try {
      const savedProfile = await onSave(draft);
      setDraft(savedProfile);
      setNotice("Votre profil étudiant a bien été mis à jour.");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Votre profil n’a pas pu être enregistré. Veuillez réessayer.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="student-profile-view" aria-labelledby="student-profile-heading">
      <header className="student-profile-hero">
        <div className="student-profile-hero__copy">
          <span>VOTRE ESPACE ÉTUDIANT</span>
          <h1 id="student-profile-heading">Mon profil</h1>
          <p>
            Retrouvez les informations de votre compte et complétez votre profil
            étudiant pour mieux présenter votre parcours.
          </p>
        </div>
        <span className="student-profile-hero__icon" aria-hidden="true">
          <UserRound size={36} />
        </span>
      </header>

      <div className="student-profile-layout">
        <section className="student-profile-card" aria-labelledby="student-profile-account-heading">
          <div className="student-profile-card__heading">
            <span className="student-profile-card__avatar" aria-hidden="true">{initials}</span>
            <div>
              <span>VOTRE COMPTE</span>
              <h2 id="student-profile-account-heading">{user.fullName}</h2>
            </div>
          </div>

          <div className="student-profile-account-fact">
            <span className="student-profile-account-fact__icon" aria-hidden="true">
              <Mail size={17} />
            </span>
            <div>
              <span>Adresse email</span>
              <strong>{user.email}</strong>
            </div>
          </div>
          <div className="student-profile-account-fact">
            <span className="student-profile-account-fact__icon student-profile-account-fact__icon--green" aria-hidden="true">
              <ShieldCheck size={17} />
            </span>
            <div>
              <span>État du compte</span>
              <strong className={user.isVerified ? "student-profile-account-fact__verified" : "student-profile-account-fact__unverified"}>
                {user.isVerified ? "Adresse vérifiée" : "Adresse à vérifier"}
              </strong>
            </div>
            {user.isVerified && <Check className="student-profile-account-fact__check" size={16} aria-hidden="true" />}
          </div>
          <p className="student-profile-card__note">
            Le nom et l’adresse email ne peuvent pas être modifiés depuis cet écran.
          </p>
        </section>

        <section className="student-profile-form-card" aria-labelledby="student-profile-details-heading">
          <div className="student-profile-form-card__heading">
            <span className="student-profile-form-card__icon" aria-hidden="true">
              <GraduationCap size={20} />
            </span>
            <div>
              <span>INFORMATIONS ÉTUDIANTES</span>
              <h2 id="student-profile-details-heading">Votre parcours</h2>
            </div>
          </div>

          {profile ? (
            <form className="student-profile-form" onSubmit={(event) => void handleSubmit(event)}>
              <div className="student-profile-completion">
                <div>
                  <span>Complétion du profil</span>
                  <strong>{completion} %</strong>
                </div>
                <div
                  className="student-profile-completion__track"
                  role="progressbar"
                  aria-label="Complétion du profil étudiant"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={completion}
                >
                  <span style={{ width: `${completion}%` }} />
                </div>
              </div>

              <label className="student-profile-field">
                <span>Établissement</span>
                <input
                  type="text"
                  autoComplete="organization"
                  maxLength={150}
                  value={draft.institution}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, institution: event.target.value }));
                    setNotice("");
                  }}
                  placeholder="Votre université ou établissement"
                />
              </label>

              <label className="student-profile-field">
                <span>Domaine d’études</span>
                <input
                  type="text"
                  maxLength={150}
                  value={draft.studyField}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, studyField: event.target.value }));
                    setNotice("");
                  }}
                  placeholder="Ex. Finance, informatique, agriculture…"
                />
              </label>

              {saveError && <p className="student-profile-message student-profile-message--error" role="alert">{saveError}</p>}
              {notice && <p className="student-profile-message student-profile-message--success" role="status">{notice}</p>}

              <div className="student-profile-form__actions">
                <p>Les changements sont enregistrés sur votre compte InvestGuinée.</p>
                <button type="submit" className="sd-btn sd-btn--green" disabled={isSaving}>
                  <Save size={16} />
                  {isSaving ? "Enregistrement…" : "Enregistrer mon profil"}
                  {!isSaving && <ArrowRight size={15} />}
                </button>
              </div>
            </form>
          ) : (
            <div className="student-profile-unavailable" role={loadError ? "alert" : "status"}>
              <p>{loadError || "Chargement de votre profil étudiant…"}</p>
              {loadError && (
                <button type="button" className="sd-btn sd-btn--outline" onClick={onRetry}>
                  Réessayer
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
