"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import AuthIcon from "./AuthIcon";
import { postAuthRequest } from "../../lib/auth-api";
import { getCurrentUser, parseAuthenticatedUser } from "../../lib/session-api";

export type AuthMode = "login" | "register" | "forgot" | "reset";

type UserRole = "ENTREPRENEUR" | "INVESTOR" | "STUDENT";
type FieldErrors = Record<string, string>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s().-]{7,20}$/;

const userTypes: {
  value: UserRole;
  label: string;
  icon: "briefcase" | "chart" | "user";
}[] = [
  { value: "ENTREPRENEUR", label: "Entrepreneur", icon: "briefcase" },
  { value: "INVESTOR", label: "Investisseur", icon: "chart" },
  { value: "STUDENT", label: "Étudiant", icon: "user" },
];

function FieldError({ id, children }: { id: string; children?: string }) {
  return children ? <p className="auth-field__error" id={id}>{children}</p> : null;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="auth-field">
      <label className="auth-field__label" htmlFor={id}>{label}</label>
      <div className={`auth-input${error ? " auth-input--error" : ""}`}>
        <AuthIcon name="lock" size={19} />
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          required
        />
        <button
          className="auth-input__visibility"
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          <AuthIcon name={visible ? "eyeOff" : "eye"} size={19} />
        </button>
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

function EmailField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="auth-field">
      <label className="auth-field__label" htmlFor="email">Adresse email</label>
      <div className={`auth-input${error ? " auth-input--error" : ""}`}>
        <AuthIcon name="mail" size={19} />
        <input
          id="email"
          name="email"
          type="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "email-error" : undefined}
          placeholder="nom@exemple.com"
          required
        />
      </div>
      <FieldError id="email-error">{error}</FieldError>
    </div>
  );
}

function SocialAuthButtons({
  onUnavailable,
}: {
  onUnavailable: (provider: string) => void;
}) {
  return (
    <div className="auth-social">
      <div className="auth-divider"><span>ou</span></div>
      <div className="auth-social__buttons">
        <button type="button" onClick={() => onUnavailable("Google")}>
          <AuthIcon name="google" size={19} />
          <span>Continuer avec Google</span>
        </button>
        <button type="button" onClick={() => onUnavailable("LinkedIn")}>
          <AuthIcon name="linkedin" size={19} />
          <span>Continuer avec LinkedIn</span>
        </button>
      </div>
    </div>
  );
}

export default function AuthForm({
  mode,
  resetToken,
}: {
  mode: AuthMode;
  resetToken?: { uid: string; token: string } | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+224 ");
  const [role, setRole] = useState<UserRole>("ENTREPRENEUR");
  const [projectName, setProjectName] = useState("");
  const [sector, setSector] = useState("");
  const [profileType, setProfileType] = useState("INDIVIDUAL");
  const [institution, setInstitution] = useState("");
  const [studyField, setStudyField] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateError = (field: string) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setMessage("");
  };

  const validateEmail = () => {
    if (!email.trim()) return "L’adresse email est obligatoire.";
    if (!emailPattern.test(email.trim())) return "Saisissez une adresse email valide.";
    return "";
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    const emailError = validateEmail();
    if (emailError) nextErrors.email = emailError;
    if (!password) nextErrors.password = "Le mot de passe est obligatoire.";
    setErrors(nextErrors);
    setMessage("");

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const loginResult = await postAuthRequest("login/", {
        email: email.trim(),
        password,
        remember_me: remember,
      });
      const user =
        typeof loginResult === "object" &&
        loginResult !== null &&
        "user" in loginResult
          ? parseAuthenticatedUser(loginResult)
          : await getCurrentUser();
      if (!user) {
        throw new Error("La connexion a réussi, mais votre session n’a pas pu être vérifiée.");
      }
      const destination =
        user.role === "INVESTOR"
          ? "/espace-investisseur"
          : user.role === "ENTREPRENEUR"
            ? "/espace-entrepreneur"
          : user.role === "STUDENT"
            ? "/espace-etudiant"
            : "/espace-administrateur";
      window.location.assign(destination);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Une erreur inattendue empêche la connexion. Veuillez réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    const emailError = validateEmail();
    if (!fullName.trim()) nextErrors.fullName = "Votre nom complet est obligatoire.";
    if (emailError) nextErrors.email = emailError;
    if (!phonePattern.test(phone.trim())) {
      nextErrors.phone = "Saisissez un numéro de téléphone valide.";
    }
    if (password.length < 8) {
      nextErrors.password = "Choisissez un mot de passe d’au moins 8 caractères.";
    }
    if (confirmation !== password) {
      nextErrors.confirmation = "Les mots de passe ne correspondent pas.";
    }
    if (!acceptedTerms) {
      nextErrors.terms = "Vous devez accepter les conditions pour continuer.";
    }
    setErrors(nextErrors);
    setMessage("");

    if (Object.keys(nextErrors).length > 0) return;

    const profileData: Record<string, string> = {};
    if (role === "ENTREPRENEUR") {
      if (projectName.trim()) profileData.project_name = projectName.trim();
      if (sector) profileData.sector = sector;
    } else if (role === "INVESTOR") {
      profileData.profile_type = profileType;
      if (sector) profileData.sector = sector;
    } else {
      if (institution.trim()) profileData.institution = institution.trim();
      if (studyField) profileData.study_field = studyField;
    }

    setIsSubmitting(true);
    try {
      await postAuthRequest("register/", {
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        password,
        role,
        terms_accepted: acceptedTerms,
        marketing_consent: marketingConsent,
        ...profileData,
      });
      setPassword("");
      setConfirmation("");
      setIsSuccess(true);
      setMessage("Votre compte a été créé. Vous pouvez maintenant vous connecter.");
    } catch (error) {
      setIsSuccess(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Une erreur inattendue empêche la création du compte. Veuillez réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailError = validateEmail();
    const nextErrors: FieldErrors = {};
    if (emailError) nextErrors.email = emailError;
    setErrors(nextErrors);
    setMessage("");
    setIsSuccess(false);
    if (emailError) return;

    setIsSubmitting(true);
    try {
      await postAuthRequest("password-reset/", { email: email.trim() });
      setIsSuccess(true);
      setMessage(
        "Si un compte correspond à cette adresse, les instructions de réinitialisation seront envoyées.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible d’envoyer la demande. Veuillez réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (resetPassword.length < 8) {
      nextErrors.password = "Choisissez un mot de passe d’au moins 8 caractères.";
    }
    if (resetConfirmation !== resetPassword) {
      nextErrors.confirmation = "Les mots de passe ne correspondent pas.";
    }
    setErrors(nextErrors);
    setMessage("");
    setIsSuccess(false);
    if (Object.keys(nextErrors).length > 0 || !resetToken) return;

    setIsSubmitting(true);
    try {
      await postAuthRequest("password-reset/confirm/", {
        uid: resetToken.uid,
        token: resetToken.token,
        new_password: resetPassword,
      });
      setResetPassword("");
      setResetConfirmation("");
      setIsSuccess(true);
      setMessage("Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de réinitialiser le mot de passe. Demandez un nouveau lien.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const announceSocialUnavailable = (provider: string) => {
    setIsSuccess(false);
    setMessage(`La connexion avec ${provider} sera disponible lorsque ce service sera configuré.`);
  };

  const statusClass = `auth-status${isSuccess ? " auth-status--success" : ""}`;

  if (mode === "forgot") {
    return (
      <div className="auth-form">
        <h1 className="auth-form__title">Réinitialiser le mot de passe</h1>
        <p className="auth-form__subtitle">
          Saisissez votre adresse email pour recevoir les instructions de réinitialisation.
        </p>
        <form className="auth-fields" onSubmit={handleForgot} noValidate>
          <EmailField
            value={email}
            onChange={(value) => {
              setEmail(value);
              updateError("email");
            }}
            error={errors.email}
          />
          {message && <p className={statusClass} role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Envoi en cours…" : "Envoyer les instructions"}
            {!isSubmitting && <AuthIcon name="arrow" size={19} />}
          </button>
        </form>
        <p className="auth-back-link">
          <Link href="/connexion">← Retour à la connexion</Link>
        </p>
      </div>
    );
  }

  if (mode === "reset") {
    return (
      <div className="auth-form">
        <h1 className="auth-form__title">Choisir un nouveau mot de passe</h1>
        <p className="auth-form__subtitle">
          Saisissez et confirmez votre nouveau mot de passe.
        </p>
        {!resetToken ? (
          <div className="auth-fields">
            <p className="auth-status" role="alert">
              Ce lien de réinitialisation est incomplet. Demandez un nouveau lien.
            </p>
            <p className="auth-back-link"><Link href="/mot-de-passe-oublie">Demander un nouveau lien</Link></p>
          </div>
        ) : (
          <form className="auth-fields" onSubmit={handlePasswordReset} noValidate>
            <PasswordField
              id="resetPassword"
              label="Nouveau mot de passe"
              value={resetPassword}
              onChange={(value) => {
                setResetPassword(value);
                updateError("password");
              }}
              error={errors.password}
              autoComplete="new-password"
            />
            <p className="auth-password-hint">8 caractères minimum.</p>
            <PasswordField
              id="resetConfirmation"
              label="Confirmer le nouveau mot de passe"
              value={resetConfirmation}
              onChange={(value) => {
                setResetConfirmation(value);
                updateError("confirmation");
              }}
              error={errors.confirmation}
              autoComplete="new-password"
            />
            {message && <p className={statusClass} role="status">{message}</p>}
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Modification en cours…" : "Modifier le mot de passe"}
              {!isSubmitting && <AuthIcon name="arrow" size={19} />}
            </button>
            {isSuccess && <p className="auth-back-link"><Link href="/connexion">Retour à la connexion</Link></p>}
          </form>
        )}
      </div>
    );
  }

  if (mode === "login") {
    return (
      <div className="auth-form">
        <h1 className="auth-form__title">Se connecter</h1>
        <p className="auth-form__subtitle">Accédez à votre espace personnel</p>
        <form className="auth-fields" onSubmit={handleLogin} noValidate>
          <EmailField
            value={email}
            onChange={(value) => {
              setEmail(value);
              updateError("email");
            }}
            error={errors.email}
          />
          <PasswordField
            id="password"
            label="Mot de passe"
            value={password}
            onChange={(value) => {
              setPassword(value);
              updateError("password");
            }}
            error={errors.password}
            autoComplete="current-password"
          />
          <div className="auth-options">
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Se souvenir de moi</span>
            </label>
            <Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
          </div>
          {message && <p className={statusClass} role="status">{message}</p>}
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Connexion en cours…" : "Se connecter"}
            {!isSubmitting && <AuthIcon name="arrow" size={19} />}
          </button>
        </form>
        <SocialAuthButtons onUnavailable={announceSocialUnavailable} />
        <div className="auth-switch-prompt">
          <p>Vous n’avez pas encore de compte ?</p>
          <Link href="/inscription">Créer un compte <AuthIcon name="arrow" size={16} /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h1 className="auth-form__title">Créer un compte</h1>
      <p className="auth-form__subtitle">Rejoignez l’écosystème InvestGuinée</p>
      <form className="auth-fields auth-fields--register" onSubmit={handleRegister} noValidate>
        <fieldset className="auth-role-picker">
          <legend className="auth-field__label">Je suis</legend>
          <div className="auth-role-picker__options">
            {userTypes.map((type) => (
              <button
                type="button"
                key={type.value}
                className={`auth-role${role === type.value ? " auth-role--selected" : ""}`}
                aria-pressed={role === type.value}
                onClick={() => setRole(type.value)}
              >
                <AuthIcon name={type.icon} size={19} />
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="fullName">Nom complet</label>
          <div className={`auth-input${errors.fullName ? " auth-input--error" : ""}`}>
            <AuthIcon name="user" size={19} />
            <input
              id="fullName"
              name="fullName"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                updateError("fullName");
              }}
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              required
            />
          </div>
          <FieldError id="fullName-error">{errors.fullName}</FieldError>
        </div>
        <EmailField
          value={email}
          onChange={(value) => {
            setEmail(value);
            updateError("email");
          }}
          error={errors.email}
        />
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="phone">Numéro de téléphone</label>
          <div className={`auth-input${errors.phone ? " auth-input--error" : ""}`}>
            <AuthIcon name="phone" size={19} />
            <input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                updateError("phone");
              }}
              autoComplete="tel"
              placeholder="+224 600 00 00 00"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              required
            />
          </div>
          <FieldError id="phone-error">{errors.phone}</FieldError>
        </div>
        {role === "ENTREPRENEUR" && (
          <div className="auth-profile-fields">
            <div className="auth-field">
              <label className="auth-field__label" htmlFor="projectName">Entreprise ou projet <span>(facultatif)</span></label>
              <div className="auth-input">
                <AuthIcon name="briefcase" size={19} />
                <input
                  id="projectName"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  autoComplete="organization"
                />
              </div>
            </div>
            <SectorField value={sector} onChange={setSector} />
          </div>
        )}
        {role === "INVESTOR" && (
          <div className="auth-profile-fields">
            <div className="auth-field">
              <label className="auth-field__label" htmlFor="profileType">Type de profil</label>
              <select
                className="auth-select"
                id="profileType"
                value={profileType}
                onChange={(event) => setProfileType(event.target.value)}
              >
                <option value="INDIVIDUAL">Investisseur individuel</option>
                <option value="ORGANIZATION">Organisation</option>
              </select>
            </div>
            <SectorField value={sector} onChange={setSector} label="Secteur d’intérêt (facultatif)" />
          </div>
        )}
        {role === "STUDENT" && (
          <div className="auth-profile-fields">
            <div className="auth-field">
              <label className="auth-field__label" htmlFor="institution">Établissement <span>(facultatif)</span></label>
              <div className="auth-input">
                <AuthIcon name="briefcase" size={19} />
                <input
                  id="institution"
                  value={institution}
                  onChange={(event) => setInstitution(event.target.value)}
                  autoComplete="organization"
                />
              </div>
            </div>
            <SectorField
              value={studyField}
              onChange={setStudyField}
              label="Domaine d’études (facultatif)"
              id="studyField"
            />
          </div>
        )}
        <PasswordField
          id="password"
          label="Mot de passe"
          value={password}
          onChange={(value) => {
            setPassword(value);
            updateError("password");
          }}
          error={errors.password}
          autoComplete="new-password"
        />
        <p className="auth-password-hint">8 caractères minimum. Choisissez un mot de passe difficile à deviner.</p>
        <PasswordField
          id="confirmation"
          label="Confirmer le mot de passe"
          value={confirmation}
          onChange={(value) => {
            setConfirmation(value);
            updateError("confirmation");
          }}
          error={errors.confirmation}
          autoComplete="new-password"
        />
        <div className="auth-consents">
          <label className="auth-checkbox auth-checkbox--top">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked);
                updateError("terms");
              }}
              aria-invalid={Boolean(errors.terms)}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              required
            />
            <span>
              J’accepte les <Link href="/#conditions">conditions d’utilisation</Link> et la{" "}
              <Link href="/#confidentialite">politique de confidentialité</Link>.
            </span>
          </label>
          <FieldError id="terms-error">{errors.terms}</FieldError>
          <label className="auth-checkbox auth-checkbox--top">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(event) => setMarketingConsent(event.target.checked)}
            />
            <span>Je souhaite recevoir les actualités et opportunités d’InvestGuinée.</span>
          </label>
        </div>
        {message && <p className={statusClass} role="status">{message}</p>}
        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Création en cours…" : "Créer mon compte"}
          {!isSubmitting && <AuthIcon name="arrow" size={19} />}
        </button>
      </form>
      <div className="auth-switch-prompt">
        <p>Vous avez déjà un compte ?</p>
        <Link href="/connexion">Se connecter <AuthIcon name="arrow" size={16} /></Link>
      </div>
    </div>
  );
}

function SectorField({
  value,
  onChange,
  label = "Secteur d’activité",
  id = "sector",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
}) {
  return (
    <div className="auth-field">
      <label className="auth-field__label" htmlFor={id}>{label}</label>
      <select className="auth-select" id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Sélectionner un secteur</option>
        <option value="AGRICULTURE">Agriculture</option>
        <option value="ENERGY">Énergie</option>
        <option value="TECHNOLOGY">Technologie</option>
        <option value="EDUCATION">Éducation</option>
        <option value="HEALTH">Santé</option>
        <option value="OTHER">Autre</option>
      </select>
    </div>
  );
}
