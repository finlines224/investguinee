"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import FooterYear from "../FooterYear";
import ProjectCard from "../projects/ProjectCard";
import ProjectIcon from "../projects/ProjectIcon";
import type { CatalogProject } from "../../data/project-catalog";

const benefits = [
  {
    number: "01",
    icon: "search",
    title: "Explorez les opportunités",
    description:
      "Parcourez des fiches projets par secteur, région et niveau de développement pour repérer les sujets qui vous intéressent.",
  },
  {
    number: "02",
    icon: "folder",
    title: "Évaluez chaque projet",
    description:
      "Consultez les informations disponibles sur le porteur, le besoin de financement et l’avancement avant toute prise de contact.",
  },
  {
    number: "03",
    icon: "handshake",
    title: "Échangez avec les porteurs",
    description:
      "Créez un compte pour entrer en relation et poser vos questions. Vérifiez les modalités directement avec les interlocuteurs concernés.",
  },
] as const;

const faqs = [
  {
    question: "Comment trouver un projet qui m’intéresse ?",
    answer:
      "Parcourez les opportunités ci-dessus et filtrez-les par secteur. Chaque fiche présente les informations disponibles sur le projet ; contactez son porteur pour toute précision.",
  },
  {
    question: "Puis-je investir directement depuis cette page ?",
    answer:
      "Non. Cette page permet de consulter des projets et de contacter leurs porteurs, mais pas de souscrire ou de transférer des fonds.",
  },
  {
    question: "Les rendements sont-ils garantis ?",
    answer:
      "Non. Un investissement comporte des risques et aucun rendement n’est garanti par cette plateforme. Étudiez les documents et les conditions du projet et demandez conseil à un professionnel indépendant.",
  },
  {
    question: "Les projets et les chiffres affichés sont-ils réels ?",
    answer:
      "Les fiches reprennent les informations publiées par les porteurs. Vérifiez-les directement auprès des interlocuteurs concernés; elles ne constituent ni une offre ni une recommandation d’investissement.",
  },
];

function scrollToOpportunities() {
  document.getElementById("investor-opportunities")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export default function InvestorExperience({
  projects,
  isAvailable,
  loadError = "",
}: {
  projects: CatalogProject[];
  isAvailable: boolean;
  loadError?: string;
}) {
  const [selectedSector, setSelectedSector] = useState("Tous les secteurs");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoriteNotice, setFavoriteNotice] = useState("");

  const sectors = useMemo(
    () => ["Tous les secteurs", ...new Set(projects.flatMap((project) => project.sectors))],
    [projects],
  );

  const visibleProjects = useMemo(
    () =>
      selectedSector === "Tous les secteurs"
        ? projects
        : projects.filter((project) =>
            project.sectors.includes(selectedSector),
          ),
    [projects, selectedSector],
  );

  const toggleFavorite = (projectId: number, title: string) => {
    const removing = favorites.includes(projectId);
    setFavorites((current) =>
      removing
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
    setFavoriteNotice(
      removing
        ? `${title} a été retiré de vos favoris pour cette session.`
        : `${title} a été ajouté à vos favoris pour cette session.`,
    );
  };

  const regionCount = new Set(projects.map((project) => project.region)).size;

  return (
    <div className="investor-page">
      <main>
        <section className="investor-hero" aria-labelledby="investor-heading">
          <div className="investor-hero__inner">
            <div className="investor-hero__content">
              <span className="investor-hero__eyebrow">
                Investir dans le potentiel guinéen
              </span>
              <h1 id="investor-heading">
                Votre prochain investissement peut faire grandir la Guinée.
              </h1>
              <p>
                Découvrez des initiatives locales, prenez le temps de les
                évaluer et échangez avec leurs porteurs.
              </p>
              <div className="investor-hero__actions">
                <button type="button" onClick={scrollToOpportunities}>
                  Explorer les projets <ProjectIcon name="arrow" size={17} />
                </button>
                <Link href="/inscription">Créer un compte</Link>
              </div>
              <span className="investor-hero__note">
                Projets publiés · Aucun investissement possible depuis cette page
              </span>
            </div>
            <div className="investor-hero__panel" aria-label="Résumé du catalogue public">
              <div className="investor-hero__panel-heading">
                <span>Le catalogue en bref</span>
              </div>
              <div className="investor-hero__metrics">
                <div>
                  <ProjectIcon name="folder" size={21} />
                  <strong>{String(projects.length).padStart(2, "0")}</strong>
                  <span>projets publiés</span>
                </div>
                <div>
                  <ProjectIcon name="location" size={21} />
                  <strong>{String(regionCount).padStart(2, "0")}</strong>
                  <span>régions représentées</span>
                </div>
              </div>
              <div className="investor-hero__panel-foot">
                <ProjectIcon name="clock" size={17} />
                <span>Explorez à votre rythme, sans engagement.</span>
              </div>
            </div>
          </div>
          <span className="investor-hero__disclaimer">
            Informations publiées par les porteurs, à vérifier avant toute décision.
          </span>
        </section>

        <section className="investor-benefits" aria-labelledby="investor-benefits-heading">
          <div className="investor-section-heading">
            <span>Un parcours simple et transparent</span>
            <h2 id="investor-benefits-heading">
              De la découverte à la prise de contact
            </h2>
            <p>
              Prenez le temps de vous informer avant d’envisager toute démarche.
            </p>
          </div>
          <div className="investor-benefits__grid">
            {benefits.map((benefit) => (
              <article className="investor-benefit" key={benefit.number}>
                <span className="investor-benefit__number">{benefit.number}</span>
                <span className="investor-benefit__icon">
                  <ProjectIcon name={benefit.icon} size={22} />
                </span>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="investor-opportunities"
          id="investor-opportunities"
          aria-labelledby="investor-opportunities-heading"
        >
          <div className="investor-section-heading investor-section-heading--row">
            <div>
              <span>À découvrir</span>
              <h2 id="investor-opportunities-heading">
                Des projets, des idées, des secteurs
              </h2>
              <p>
                Explorez les projets publiés dans le catalogue.
              </p>
            </div>
            <Link href="/projets" className="investor-opportunities__all">
              Voir tous les projets <ProjectIcon name="arrow" size={16} />
            </Link>
          </div>

          <div className="investor-opportunities__filters" aria-label="Filtrer par secteur">
            {sectors.map((sector) => (
              <button
                className={
                  selectedSector === sector
                    ? "investor-sector investor-sector--active"
                    : "investor-sector"
                }
                type="button"
                key={sector}
                aria-pressed={selectedSector === sector}
                onClick={() => setSelectedSector(sector)}
              >
                {sector}
              </button>
            ))}
          </div>

          {favoriteNotice && (
            <p className="investor-favorite-notice" role="status">
              <ProjectIcon name="heart" size={16} filled />
              <span>{favoriteNotice}</span>
              <Link href="/connexion">Connectez-vous pour continuer.</Link>
              <button
                type="button"
                aria-label="Masquer le message"
                onClick={() => setFavoriteNotice("")}
              >
                <ProjectIcon name="x" size={16} />
              </button>
            </p>
          )}

          {!isAvailable ? (
            <p className="investor-opportunities__empty" role="alert">
              {loadError || "Le catalogue est momentanément indisponible."}
            </p>
          ) : visibleProjects.length > 0 ? (
            <div className="investor-opportunities__grid">
              {visibleProjects.slice(0, 3).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isFavorite={favorites.includes(project.id)}
                  onToggleFavorite={() =>
                    toggleFavorite(project.id, project.title)
                  }
                />
              ))}
            </div>
          ) : (
            <p className="investor-opportunities__empty" role="status">
              Aucun projet publié n’est disponible dans ce secteur.
            </p>
          )}
          <p className="investor-opportunities__disclaimer">
            Les montants indiqués correspondent aux objectifs déclarés par les porteurs.
          </p>
        </section>

        <section className="investor-safety" aria-labelledby="investor-safety-heading">
          <div className="investor-safety__icon">
            <ProjectIcon name="handshake" size={25} />
          </div>
          <div>
            <span>Avant toute décision</span>
            <h2 id="investor-safety-heading">Informez-vous. Vérifiez. Décidez.</h2>
            <p>
              Évaluez les risques, vérifiez l’identité de vos interlocuteurs et
              lisez les conditions de chaque proposition. InvestGuinée ne
              garantit ni les projets ni les rendements.
            </p>
          </div>
          <Link href="/projets">
            Parcourir le catalogue <ProjectIcon name="arrow" size={16} />
          </Link>
        </section>

        <section className="investor-faq" aria-labelledby="investor-faq-heading">
          <div className="investor-section-heading">
            <span>Questions fréquentes</span>
            <h2 id="investor-faq-heading">Investir en toute connaissance</h2>
          </div>
          <div className="investor-faq__list">
            {faqs.map((faq) => (
              <details className="investor-faq__item" key={faq.question}>
                <summary>
                  {faq.question}
                  <ProjectIcon name="chevron" size={17} />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="investor-cta" aria-labelledby="investor-cta-heading">
          <div>
            <span>Pour aller plus loin</span>
            <h2 id="investor-cta-heading">
              Rejoignez une communauté tournée vers l’avenir.
            </h2>
            <p>
              Créez votre compte pour découvrir les prochaines fonctionnalités
              d’InvestGuinée.
            </p>
          </div>
          <Link href="/inscription">
            Créer un compte <ProjectIcon name="arrow" size={17} />
          </Link>
        </section>
      </main>

      <footer className="investor-footer">
        <div className="investor-footer__inner">
          <p>© <FooterYear /> InvestGuinée — Projets publiés.</p>
          <nav aria-label="Liens utiles">
            <Link href="/projets">Explorer les projets</Link>
            <Link href="/connexion">Connexion</Link>
            <Link href="/inscription">Inscription</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
