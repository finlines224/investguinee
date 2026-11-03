"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import FooterYear from "../FooterYear";
import ProjectIcon from "../projects/ProjectIcon";
import { resourceCategories, studentResources } from "../../data/student-resources";

const steps = [
  {
    number: "01",
    title: "Explorez",
    description:
      "Parcourez des ressources de découverte autour de l’entrepreneuriat, de la finance et des compétences.",
  },
  {
    number: "02",
    title: "Développez votre idée",
    description:
      "Utilisez les pistes proposées pour mieux formuler un besoin et structurer votre réflexion.",
  },
  {
    number: "03",
    title: "Préparez la suite",
    description:
      "Restez informé des prochaines fonctionnalités et des ressources qui pourront être proposées.",
  },
] as const;

const faqs = [
  {
    question: "Les formations et ateliers sont-ils déjà ouverts ?",
    answer:
      "Non. Les ressources et formats présentés sur cette page sont des exemples de démonstration ; aucune formation ni aucun atelier n’est actuellement proposé à l’inscription.",
  },
  {
    question: "Faut-il déjà avoir un projet pour utiliser ces ressources ?",
    answer:
      "Non. Les exemples s’adressent aussi bien aux personnes qui découvrent l’entrepreneuriat qu’à celles qui souhaitent mieux structurer une première idée.",
  },
  {
    question: "Puis-je obtenir un accompagnement ou un mentor ?",
    answer:
      "Cette version ne propose pas encore de service de mentorat ou d’accompagnement. Les informations disponibles sur les évolutions futures seront communiquées par la plateforme.",
  },
  {
    question: "Les contenus sont-ils certifiants ?",
    answer:
      "Non. Les exemples affichés ne sont ni des cours actuellement accessibles ni des contenus certifiants.",
  },
] as const;

export default function StudentExperience() {
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof resourceCategories)[number]>("Toutes les ressources");
  const [query, setQuery] = useState("");

  const visibleResources = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return studentResources.filter((resource) => {
      const matchesCategory =
        selectedCategory === "Toutes les ressources" ||
        resource.category === selectedCategory;
      const matchesQuery =
        !normalizedQuery ||
        `${resource.title} ${resource.description} ${resource.category} ${resource.format}`
          .toLocaleLowerCase("fr")
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory]);

  return (
    <div className="student-page">
      <main>
        <section className="student-hero" aria-labelledby="student-heading">
          <div className="student-hero__inner">
            <div className="student-hero__content">
              <span className="student-hero__eyebrow">
                Apprendre · Entreprendre · Construire
              </span>
              <h1 id="student-heading">
                Votre idée mérite de grandir.
              </h1>
              <p>
                Explorez des ressources pour découvrir l’entrepreneuriat,
                développer vos compétences et mieux structurer vos idées.
              </p>
              <div className="student-hero__actions">
                <a href="#student-resources">
                  Découvrir les ressources <ProjectIcon name="arrow" size={17} />
                </a>
                <Link href="/inscription">Créer un compte</Link>
              </div>
              <p className="student-hero__notice">
                Exemples de démonstration — les formations ne sont pas encore
                disponibles.
              </p>
            </div>
            <div
              className="student-hero__path"
              role="group"
              aria-label="Étapes illustratives d’un parcours de projet"
            >
              <div className="student-hero__path-heading">
                <span>Un parcours à explorer</span>
                <span>APERÇU</span>
              </div>
              <div className="student-path-step">
                <span className="student-path-step__icon"><ProjectIcon name="search" size={18} /></span>
                <span><strong>Une idée</strong><small>Observer un besoin</small></span>
                <ProjectIcon name="arrow" size={16} />
              </div>
              <div className="student-path-step">
                <span className="student-path-step__icon"><ProjectIcon name="folder" size={18} /></span>
                <span><strong>Un projet</strong><small>Structurer une solution</small></span>
                <ProjectIcon name="arrow" size={16} />
              </div>
              <div className="student-path-step">
                <span className="student-path-step__icon"><ProjectIcon name="rocket" size={18} /></span>
                <span><strong>La suite</strong><small>Apprendre et progresser</small></span>
                <span className="student-path-step__end">À venir</span>
              </div>
              <p className="student-hero__path-foot">
                Parcours indicatif, non lié à un programme actuellement ouvert.
              </p>
            </div>
          </div>
          <span className="student-hero__disclaimer">
            Ressources et parcours illustratifs
          </span>
        </section>

        <section className="student-steps" aria-labelledby="student-steps-heading">
          <div className="student-section-heading">
            <span>Faire ses premiers pas</span>
            <h2 id="student-steps-heading">
              Faites avancer votre idée, étape par étape.
            </h2>
            <p>
              Des pistes simples pour passer de la curiosité à une réflexion
              structurée.
            </p>
          </div>
          <div className="student-steps__grid">
            {steps.map((step) => (
              <article className="student-step" key={step.number}>
                <span className="student-step__number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="student-resources"
          id="student-resources"
          aria-labelledby="student-resources-heading"
        >
          <div className="student-section-heading">
            <span>Explorer les thèmes</span>
            <h2 id="student-resources-heading">
              Des ressources pour nourrir vos idées.
            </h2>
            <p>
              Parcourez les exemples par thème ou recherchez un sujet précis.
            </p>
          </div>
          <div className="student-resources__controls">
            <div className="student-resource-search">
              <ProjectIcon name="search" size={18} />
              <input
                aria-label="Rechercher une ressource"
                type="search"
                placeholder="Rechercher une ressource..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Effacer la recherche"
                  onClick={() => setQuery("")}
                >
                  <ProjectIcon name="x" size={16} />
                </button>
              )}
            </div>
            <div className="student-resource-filters" role="group" aria-label="Filtrer les ressources par thème">
              {resourceCategories.map((category) => (
                <button
                  className={
                    selectedCategory === category
                      ? "student-resource-filter student-resource-filter--active"
                      : "student-resource-filter"
                  }
                  type="button"
                  key={category}
                  aria-pressed={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <p className="student-resources__count" aria-live="polite">
            {visibleResources.length} exemple{visibleResources.length > 1 ? "s" : ""} de ressource
            {visibleResources.length > 1 ? "s" : ""}
          </p>
          {visibleResources.length > 0 ? (
            <div className="student-resources__grid">
              {visibleResources.map((resource) => (
                <article className="student-resource" key={resource.id}>
                  <div className="student-resource__top">
                    <span className="student-resource__icon">
                      <ProjectIcon name={resource.icon} size={21} />
                    </span>
                    <span className="student-resource__category">{resource.category}</span>
                  </div>
                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>
                  <div className="student-resource__meta">
                    <span><ProjectIcon name="folder" size={14} />{resource.format}</span>
                    <span><ProjectIcon name="eye" size={14} />{resource.level}</span>
                  </div>
                  <span className="student-resource__availability">
                    <span aria-hidden="true" /> Exemple — contenu à venir
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <div className="student-resources__empty" role="status">
              <ProjectIcon name="search" size={23} />
              <h3>Aucune ressource trouvée</h3>
              <p>Essayez un autre mot-clé ou choisissez un autre thème.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedCategory("Toutes les ressources");
                }}
              >
                Réinitialiser la recherche
              </button>
            </div>
          )}
          <p className="student-resources__disclaimer">
            Les titres, formats et descriptions ci-dessus sont des exemples
            éditoriaux. Aucun cours, atelier ou certificat n’est disponible
            dans cette version.
          </p>
        </section>

        <section className="student-projects" aria-labelledby="student-projects-heading">
          <div className="student-projects__content">
            <span>Passer de l’idée à l’inspiration</span>
            <h2 id="student-projects-heading">
              Découvrez les projets qui font bouger les lignes.
            </h2>
            <p>
              Parcourez le catalogue de démonstration pour voir comment des
              initiatives locales peuvent être présentées.
            </p>
            <Link href="/projets">
              Explorer les projets <ProjectIcon name="arrow" size={16} />
            </Link>
          </div>
          <div className="student-projects__visual" aria-hidden="true">
            <div><ProjectIcon name="rocket" size={27} /></div>
            <span>Une idée</span><i /><span>Un projet</span><i /><span>Un impact</span>
          </div>
        </section>

        <section className="student-faq" aria-labelledby="student-faq-heading">
          <div className="student-section-heading">
            <span>Questions fréquentes</span>
            <h2 id="student-faq-heading">
              Ce qu’il faut savoir avant de commencer.
            </h2>
          </div>
          <div className="student-faq__list">
            {faqs.map((faq) => (
              <details className="student-faq__item" key={faq.question}>
                <summary>
                  {faq.question}
                  <ProjectIcon name="chevron" size={17} />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="student-cta" aria-labelledby="student-cta-heading">
          <div>
            <span>Votre parcours commence ici</span>
            <h2 id="student-cta-heading">
              Faites une place à vos idées.
            </h2>
            <p>
              Créez un compte pour découvrir les prochaines fonctionnalités
              d’InvestGuinée.
            </p>
          </div>
          <Link href="/inscription">
            Créer un compte <ProjectIcon name="arrow" size={17} />
          </Link>
        </section>
      </main>

      <footer className="student-footer">
        <div className="student-footer__inner">
          <p>© <FooterYear /> InvestGuinée — Ressources de démonstration.</p>
          <nav aria-label="Liens utiles">
            <Link href="/projets">Explorer les projets</Link>
            <Link href="/investisseurs">Investisseurs</Link>
            <Link href="/inscription">Inscription</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
