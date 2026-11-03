"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Lightbulb, Save, Sparkles } from "lucide-react";

type IdeaDraft = {
  title: string;
  sector: string;
  problem: string;
  solution: string;
  beneficiaries: string;
};

const emptyDraft: IdeaDraft = {
  title: "",
  sector: "",
  problem: "",
  solution: "",
  beneficiaries: "",
};

const fields: {
  key: keyof IdeaDraft;
  label: string;
  maxLength: number;
  placeholder: string;
  rows: number;
}[] = [
  {
    key: "problem",
    label: "Quel besoin ou problème voulez-vous résoudre ?",
    maxLength: 1000,
    placeholder: "Décrivez la situation que vous avez observée et pourquoi elle mérite une solution.",
    rows: 5,
  },
  {
    key: "solution",
    label: "Quelle solution imaginez-vous ?",
    maxLength: 1000,
    placeholder: "Expliquez comment votre idée pourrait répondre à ce besoin.",
    rows: 5,
  },
  {
    key: "beneficiaries",
    label: "À qui votre idée serait-elle utile ?",
    maxLength: 500,
    placeholder: "Décrivez les personnes, communautés ou organisations concernées.",
    rows: 3,
  },
];

function isIdeaDraft(value: unknown): value is IdeaDraft {
  if (typeof value !== "object" || value === null) return false;
  return (
    "title" in value &&
    typeof value.title === "string" &&
    "sector" in value &&
    typeof value.sector === "string" &&
    "problem" in value &&
    typeof value.problem === "string" &&
    "solution" in value &&
    typeof value.solution === "string" &&
    "beneficiaries" in value &&
    typeof value.beneficiaries === "string"
  );
}

export default function StudentIdeaWorkspace({ userId }: { userId: number }) {
  const [draft, setDraft] = useState<IdeaDraft>(emptyDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(
          `investguinee:student:${userId}:idea-draft`,
        );
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (
            typeof parsed !== "object" ||
            parsed === null ||
            !("draft" in parsed) ||
            !isIdeaDraft(parsed.draft) ||
            !("savedAt" in parsed) ||
            typeof parsed.savedAt !== "string"
          ) {
            throw new Error("Le brouillon enregistré est invalide.");
          }
          setDraft(parsed.draft);
          setSavedAt(parsed.savedAt);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Impossible de charger votre brouillon enregistré.",
        );
      } finally {
        setIsLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [userId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const timestamp = new Date().toISOString();
    try {
      window.localStorage.setItem(
        `investguinee:student:${userId}:idea-draft`,
        JSON.stringify({ draft, savedAt: timestamp }),
      );
      setSavedAt(timestamp);
      setNotice("Votre brouillon a été enregistré sur cet appareil.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? "Le navigateur n’a pas pu enregistrer votre brouillon."
          : "Impossible d’enregistrer votre brouillon.",
      );
    }
  };

  const updateDraft = (key: keyof IdeaDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice("");
  };

  const completion = [
    Boolean(draft.title.trim()),
    Boolean(draft.sector),
    Boolean(draft.problem.trim()),
    Boolean(draft.solution.trim()),
    Boolean(draft.beneficiaries.trim()),
  ].filter(Boolean).length;

  return (
    <section className="student-idea-view" aria-labelledby="student-idea-heading">
      <header className="student-idea-hero">
        <div className="student-idea-hero__copy">
          <span>VOTRE ESPACE ÉTUDIANT</span>
          <h1 id="student-idea-heading">Mon idée de projet</h1>
          <p>
            Une idée commence par un besoin. Prenez le temps de la décrire et
            de structurer les premières pistes de votre projet.
          </p>
          <a href="#student-idea-form">Commencer mon brouillon <span aria-hidden="true">↓</span></a>
        </div>
        <span className="student-idea-hero__icon" aria-hidden="true">
          <Lightbulb size={38} />
          <i />
          <i />
          <i />
        </span>
      </header>

      <div className="student-idea-notice" role="note">
        <Sparkles size={17} aria-hidden="true" />
        <p>
          <strong>Brouillon personnel</strong>
          <span>Votre idée est enregistrée uniquement sur cet appareil. Elle n’est pas envoyée à InvestGuinée.</span>
        </p>
      </div>

      <div className="student-idea-layout">
        <form className="student-idea-form" id="student-idea-form" onSubmit={handleSubmit}>
          <div className="student-idea-form__heading">
            <div>
              <span>PREMIÈRES PISTES</span>
              <h2>Donnez forme à votre idée</h2>
            </div>
            <span className="student-idea-form__progress">{completion}/5</span>
          </div>
          <div
            className="student-idea-form__progress-track"
            role="progressbar"
            aria-label="Progression du brouillon"
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={completion}
          >
            <span style={{ width: `${completion * 20}%` }} />
          </div>

          {isLoading ? (
            <p className="student-idea-form__loading" aria-live="polite">Chargement de votre brouillon…</p>
          ) : (
            <>
              <label className="student-idea-field">
                <span>Nom provisoire du projet <small>Obligatoire</small></span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) => updateDraft("title", event.target.value)}
                  maxLength={120}
                  placeholder="Ex. Une solution pour valoriser les produits locaux"
                  required
                />
              </label>

              <label className="student-idea-field">
                <span>Thème principal <small>Obligatoire</small></span>
                <select
                  value={draft.sector}
                  onChange={(event) => updateDraft("sector", event.target.value)}
                  required
                >
                  <option value="">Choisir un thème</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Éducation">Éducation</option>
                  <option value="Énergie">Énergie</option>
                  <option value="Environnement">Environnement</option>
                  <option value="Santé">Santé</option>
                  <option value="Technologie">Technologie</option>
                  <option value="Autres">Autres</option>
                </select>
              </label>

              {fields.map((field) => (
                <label className="student-idea-field" key={field.key}>
                  <span>{field.label} <small>Obligatoire</small></span>
                  <textarea
                    value={draft[field.key]}
                    onChange={(event) => updateDraft(field.key, event.target.value)}
                    maxLength={field.maxLength}
                    rows={field.rows}
                    placeholder={field.placeholder}
                    required
                  />
                  <small className="student-idea-field__counter">
                    {draft[field.key].length}/{field.maxLength}
                  </small>
                </label>
              ))}

              {error && <p className="student-idea-form__error" role="alert">{error}</p>}
              {notice && <p className="student-idea-form__success" role="status">{notice}</p>}
              {savedAt && !notice && (
                <p className="student-idea-form__saved">
                  Dernier enregistrement : {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(savedAt))}
                </p>
              )}
              <div className="student-idea-form__actions">
                <p>Vous pourrez retrouver et modifier ce brouillon sur cet appareil.</p>
                <button type="submit" className="sd-btn sd-btn--green">
                  <Save size={16} /> Enregistrer mon brouillon
                </button>
              </div>
            </>
          )}
        </form>

        <aside className="student-idea-guide">
          <span className="student-idea-guide__icon"><Lightbulb size={19} /></span>
          <span className="student-idea-guide__eyebrow">POUR VOUS AIDER</span>
          <h2>Une idée claire se construit pas à pas.</h2>
          <ol>
            <li><span>01</span><p><strong>Observer</strong>Quel besoin concret avez-vous repéré ?</p></li>
            <li><span>02</span><p><strong>Imaginer</strong>Quelle réponse simple pourrait aider ?</p></li>
            <li><span>03</span><p><strong>Préciser</strong>À qui cette solution serait-elle utile ?</p></li>
          </ol>
          <p className="student-idea-guide__footer">Il n’est pas nécessaire d’avoir toutes les réponses dès le départ.</p>
        </aside>
      </div>
    </section>
  );
}
