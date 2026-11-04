"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AuthenticatedUser } from "../../lib/session-api";
import {
  getInvestorProfile,
  updateInvestorProfile,
  type InvestorProfile,
  type InvestorProfileUpdate,
} from "../../lib/investor-profile-api";

const sectorOptions = [
  ["AGRICULTURE", "Agriculture"],
  ["ENERGY", "Énergie"],
  ["TECHNOLOGY", "Technologie"],
  ["EDUCATION", "Éducation"],
  ["HEALTH", "Santé"],
  ["OTHER", "Autre"],
] as const;

const profileTypeOptions = [
  ["INDIVIDUAL", "Investisseur individuel"],
  ["ORGANIZATION", "Organisation"],
] as const;

function toEditableProfile(profile: InvestorProfile): InvestorProfileUpdate {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phoneNumber: profile.phoneNumber,
    profileType: profile.profileType,
    sector: profile.sector,
  };
}

export default function InvestorProfileWorkspace({
  user,
  onSaved,
}: {
  user: AuthenticatedUser;
  onSaved: (profile: InvestorProfile) => void;
}) {
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [form, setForm] = useState<InvestorProfileUpdate>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    profileType: "",
    sector: "",
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    getInvestorProfile()
      .then((result) => {
        if (!active) return;
        setProfile(result);
        setForm(toEditableProfile(result));
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Impossible de charger votre profil investisseur.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setSuccess("");
    try {
      const updatedProfile = await updateInvestorProfile(form);
      setProfile(updatedProfile);
      setForm(toEditableProfile(updatedProfile));
      onSaved(updatedProfile);
      setSuccess("Votre profil a été mis à jour.");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Impossible d’enregistrer votre profil.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p role="status">Chargement de votre profil…</p>;
  }

  if (loadError || !profile) {
    return (
      <div className="investor-profile__state" role="alert">
        <p>{loadError || "Votre profil investisseur est indisponible."}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setLoadError("");
            setRetryCount((count) => count + 1);
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  const currentProfileTypeIsUnknown =
    form.profileType !== "" &&
    !profileTypeOptions.some(([value]) => value === form.profileType);
  const currentSectorIsUnknown =
    form.sector !== "" && !sectorOptions.some(([value]) => value === form.sector);

  return (
    <div className="investor-profile">
      <section className="investor-profile__account" aria-label="Informations du compte">
        <div className="investor-profile__avatar">
          {`${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase() || "IG"}
        </div>
        <div>
          <span>Adresse e-mail</span>
          <strong>{profile.email || user.email}</strong>
          <small>L’adresse e-mail ne peut pas être modifiée ici.</small>
        </div>
        <div>
          <span>Vérification du compte</span>
          <strong>
            {(profile.isVerified ?? user.isVerified)
              ? "Profil vérifié"
              : "Vérification à compléter"}
          </strong>
        </div>
      </section>

      <form className="investor-profile__form" onSubmit={handleSubmit}>
        <div className="investor-profile__form-heading">
          <div>
            <span>VOS INFORMATIONS</span>
            <h2>Modifier le profil</h2>
          </div>
          <p>Les changements sont enregistrés sur votre compte.</p>
        </div>

        <div className="investor-profile__fields">
          <label>
            Prénom
            <input
              autoComplete="given-name"
              maxLength={150}
              required
              value={form.firstName}
              onChange={(event) =>
                setForm((current) => ({ ...current, firstName: event.target.value }))
              }
            />
          </label>
          <label>
            Nom
            <input
              autoComplete="family-name"
              maxLength={150}
              value={form.lastName}
              onChange={(event) =>
                setForm((current) => ({ ...current, lastName: event.target.value }))
              }
            />
          </label>
          <label>
            Téléphone
            <input
              autoComplete="tel"
              maxLength={30}
              required
              value={form.phoneNumber}
              onChange={(event) =>
                setForm((current) => ({ ...current, phoneNumber: event.target.value }))
              }
            />
          </label>
          <label>
            Type de profil
            <select
              required
              value={form.profileType}
              onChange={(event) =>
                setForm((current) => ({ ...current, profileType: event.target.value }))
              }
            >
              <option value="">Sélectionner un type de profil</option>
              {currentProfileTypeIsUnknown && (
                <option value={form.profileType}>{form.profileType} (valeur existante)</option>
              )}
              {profileTypeOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Secteur d’intérêt
            <select
              value={form.sector}
              onChange={(event) =>
                setForm((current) => ({ ...current, sector: event.target.value }))
              }
            >
              <option value="">Sélectionner un secteur</option>
              {currentSectorIsUnknown && (
                <option value={form.sector}>{form.sector} (valeur existante)</option>
              )}
              {sectorOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        {saveError && <p className="investor-profile__message investor-profile__message--error" role="alert">{saveError}</p>}
        {success && <p className="investor-profile__message investor-profile__message--success" role="status">{success}</p>}
        <div className="investor-profile__actions">
          <button type="submit" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}
