"use client";

import { useMemo, useState } from "react";
import { challengeCategories, studentChallenges } from "../../data/student-challenges";
import ProjectIcon from "../projects/ProjectIcon";

export default function StudentChallengeCatalog() {
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof challengeCategories)[number]>("Toutes les opportunités");
  const [query, setQuery] = useState("");

  const visibleChallenges = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return studentChallenges.filter((challenge) => {
      const matchesCategory =
        selectedCategory === "Toutes les opportunités" ||
        challenge.category === selectedCategory;
      const matchesQuery =
        !normalizedQuery ||
        `${challenge.title} ${challenge.description} ${challenge.category} ${challenge.theme}`
          .toLocaleLowerCase("fr")
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory]);

  const challengeCount = studentChallenges.filter(
    (challenge) => challenge.category === "Défis",
  ).length;
  const contestCount = studentChallenges.filter(
    (challenge) => challenge.category === "Concours",
  ).length;

  return (
    <section className="student-challenges-view" aria-labelledby="student-challenges-heading">
      <header className="student-challenges-hero">
        <div className="student-challenges-hero__copy">
          <span className="student-challenges-hero__eyebrow">VOTRE ESPACE ÉTUDIANT</span>
          <h1 id="student-challenges-heading">Défis &amp; concours</h1>
          <p>
            Faites avancer vos idées, relevez de nouveaux défis et découvrez
            des opportunités conçues pour les étudiants.
          </p>
          <a className="student-challenges-hero__link" href="#student-challenges-catalog">
            Parcourir les exemples <ProjectIcon name="arrow" size={16} />
          </a>
        </div>
        <div className="student-challenges-hero__art" aria-hidden="true">
          <span className="student-challenges-hero__orbit student-challenges-hero__orbit--outer" />
          <span className="student-challenges-hero__orbit student-challenges-hero__orbit--inner" />
          <span className="student-challenges-hero__trophy"><ProjectIcon name="rocket" size={35} /></span>
          <span className="student-challenges-hero__spark student-challenges-hero__spark--one" />
          <span className="student-challenges-hero__spark student-challenges-hero__spark--two" />
        </div>
        <div className="student-challenges-hero__flag" aria-hidden="true"><i /><i /><i /></div>
      </header>

      <div className="student-challenges-overview" aria-label="Aperçu des exemples">
        <article>
          <span className="student-challenges-overview__icon student-challenges-overview__icon--green">
            <ProjectIcon name="rocket" size={18} />
          </span>
          <span><strong>{challengeCount}</strong><small>exemples de défis</small></span>
        </article>
        <article>
          <span className="student-challenges-overview__icon student-challenges-overview__icon--gold">
            <ProjectIcon name="handshake" size={18} />
          </span>
          <span><strong>{contestCount}</strong><small>exemple de concours</small></span>
        </article>
        <p><span aria-hidden="true" />Aucune inscription ouverte pour le moment</p>
      </div>

      <section className="student-challenges-catalog" id="student-challenges-catalog" aria-label="Exemples de défis et concours">
        <div className="student-challenges-catalog__header">
          <div>
            <span>À EXPLORER</span>
            <h2>Les opportunités étudiantes</h2>
            <p>Ces exemples illustrent les types d’activités qui pourront être proposés.</p>
          </div>
          <span className="student-challenges-catalog__sample">APERÇU</span>
        </div>
        <div className="student-challenges-controls">
          <label className="student-challenges-search">
            <ProjectIcon name="search" size={18} />
            <input
              aria-label="Rechercher un défi ou un concours"
              type="search"
              placeholder="Rechercher une opportunité..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button type="button" aria-label="Effacer la recherche" onClick={() => setQuery("")}>
                <ProjectIcon name="x" size={16} />
              </button>
            )}
          </label>
          <div className="student-challenges-filters" role="group" aria-label="Filtrer par type d’opportunité">
            {challengeCategories.map((category) => {
              const count = category === "Défis"
                ? challengeCount
                : category === "Concours"
                  ? contestCount
                  : studentChallenges.length;
              return (
                <button
                  className={selectedCategory === category ? "student-challenges-filter student-challenges-filter--active" : "student-challenges-filter"}
                  type="button"
                  key={category}
                  aria-pressed={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}<span>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="student-challenges-count" aria-live="polite">
          {visibleChallenges.length} résultat{visibleChallenges.length > 1 ? "s" : ""}
        </p>
        {visibleChallenges.length > 0 ? (
          <div className="student-challenges-grid">
            {visibleChallenges.map((challenge) => (
              <article className="student-challenge-card" key={challenge.id}>
                <div className="student-challenge-card__top">
                  <span className="student-challenge-card__icon" aria-hidden="true">
                    <ProjectIcon name="rocket" size={21} />
                  </span>
                  <span className={`student-challenge-card__type student-challenge-card__type--${challenge.category === "Défis" ? "challenge" : "contest"}`}>
                    {challenge.category}
                  </span>
                </div>
                <div className="student-challenge-card__content">
                  <h3>{challenge.title}</h3>
                  <p>{challenge.description}</p>
                </div>
                <div className="student-challenge-card__footer">
                  <span className="student-challenge-card__theme">{challenge.theme}</span>
                  <span className="student-challenge-card__status"><i aria-hidden="true" />À venir</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="student-resources__empty" role="status">
            <ProjectIcon name="search" size={23} />
            <h3>Aucun résultat</h3>
            <p>Modifiez votre recherche ou choisissez un autre type d’opportunité.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedCategory("Toutes les opportunités");
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </section>
    </section>
  );
}
