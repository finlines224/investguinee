import Image from "next/image";
import Link from "next/link";
import FooterYear from "../FooterYear";
import ProjectIcon from "../projects/ProjectIcon";

const principles = [
  {
    icon: "handshake",
    title: "Créer des connexions utiles",
    description:
      "Faciliter les échanges entre porteurs de projets, investisseurs et personnes qui souhaitent contribuer à l’innovation en Guinée.",
  },
  {
    icon: "folder",
    title: "Rendre les projets visibles",
    description:
      "Présenter les initiatives locales et leurs informations de façon claire pour aider chacun à mieux les découvrir.",
  },
  {
    icon: "rocket",
    title: "Encourager les idées",
    description:
      "Mettre en avant l’entrepreneuriat, l’apprentissage et les solutions qui participent au développement économique.",
  },
] as const;

const audiences = [
  {
    label: "Porteurs de projets",
    text: "Présentez une initiative et partagez les informations utiles à sa découverte.",
    href: "/projets",
    action: "Explorer les projets",
    icon: "rocket",
  },
  {
    label: "Investisseurs",
    text: "Découvrez les projets du catalogue et informez-vous avant toute démarche.",
    href: "/investisseurs",
    action: "Espace investisseurs",
    icon: "handshake",
  },
  {
    label: "Étudiants",
    text: "Explorez des ressources de démonstration autour de l’entrepreneuriat et des compétences.",
    href: "/etudiants",
    action: "Espace étudiants",
    icon: "search",
  },
] as const;

const faqs = [
  {
    question: "Qu’est-ce qu’InvestGuinée ?",
    answer:
      "InvestGuinée est un projet de plateforme numérique conçu pour mettre en relation les acteurs de l’innovation et rendre des initiatives guinéennes plus faciles à découvrir.",
  },
  {
    question: "La plateforme permet-elle déjà d’investir ?",
    answer:
      "Non. Les projets et chiffres présentés dans cette version sont illustratifs. Aucune souscription, transaction ou offre d’investissement n’est proposée.",
  },
  {
    question: "Les formations et services d’accompagnement sont-ils disponibles ?",
    answer:
      "Les parcours et ressources présentés dans l’espace Étudiants sont des exemples de démonstration. Ils ne correspondent pas à des formations ou services actuellement ouverts.",
  },
  {
    question: "Comment contacter l’équipe ?",
    answer:
      "Vous pouvez créer un compte ou utiliser les liens de navigation pour découvrir les espaces de la plateforme. Les coordonnées de contact seront ajoutées lorsqu’un canal officiel sera disponible.",
  },
] as const;

export default function AboutExperience() {
  return (
    <div className="about-page">
      <main>
        <section className="about-hero" aria-labelledby="about-heading">
          <div className="about-hero__inner">
            <div className="about-hero__content">
              <span className="about-hero__eyebrow">
                Une plateforme tournée vers la Guinée
              </span>
              <h1 id="about-heading">
                Connecter les talents. Faire grandir les idées.
              </h1>
              <p>
                InvestGuinée imagine un espace où les projets, les compétences
                et les personnes peuvent se rencontrer pour contribuer à
                l’innovation locale.
              </p>
              <div className="about-hero__actions">
                <Link href="/projets">
                  Découvrir les projets <ProjectIcon name="arrow" size={17} />
                </Link>
                <a href="#about-mission">Notre démarche</a>
              </div>
              <span className="about-hero__note">
                Projet de démonstration — les fonctionnalités et exemples
                présentés ne constituent pas des services financiers actifs.
              </span>
            </div>
            <div className="about-hero__image">
              <Image
                src="/conakry_hero.png"
                alt="Vue de Conakry, en Guinée"
                fill
                priority
                sizes="(max-width: 767px) 100vw, 48vw"
              />
              <div className="about-hero__image-caption">
                <span className="about-hero__flag" aria-hidden="true">
                  <i /><i /><i />
                </span>
                <span><strong>La Guinée</strong><small>Au cœur de notre démarche</small></span>
                <ProjectIcon name="location" size={19} />
              </div>
            </div>
          </div>
          <span className="about-hero__disclaimer">
            Image illustrative — Conakry, Guinée
          </span>
        </section>

        <section className="about-mission" id="about-mission" aria-labelledby="about-mission-heading">
          <div className="about-mission__intro">
            <span>Notre raison d’être</span>
            <h2 id="about-mission-heading">
              Les bonnes idées avancent mieux quand elles se rencontrent.
            </h2>
          </div>
          <div className="about-mission__copy">
            <p>
              Les entrepreneurs ont des projets, les étudiants développent des
              compétences et les investisseurs recherchent des initiatives à
              découvrir. InvestGuinée veut rapprocher ces énergies au sein d’un
              espace accessible et lisible.
            </p>
            <p>
              Notre ambition est de faciliter la découverte et les échanges,
              tout en donnant aux porteurs de projets un moyen de présenter
              leurs idées.
            </p>
            <span className="about-mission__notice">
              La plateforme est en développement. Les exemples affichés sont
              fictifs et ne sont ni des offres ni des recommandations.
            </span>
          </div>
        </section>

        <section className="about-principles" aria-labelledby="about-principles-heading">
          <div className="about-section-heading">
            <span>Ce qui nous guide</span>
            <h2 id="about-principles-heading">Une ambition, trois principes.</h2>
            <p>
              Des repères simples pour concevoir une expérience utile et
              responsable.
            </p>
          </div>
          <div className="about-principles__grid">
            {principles.map((principle, index) => (
              <article className="about-principle" key={principle.title}>
                <div className={`about-principle__icon about-principle__icon--${index + 1}`}>
                  <ProjectIcon name={principle.icon} size={22} />
                </div>
                <span className="about-principle__number">0{index + 1}</span>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-journey" aria-labelledby="about-journey-heading">
          <div className="about-section-heading">
            <span>Un écosystème ouvert</span>
            <h2 id="about-journey-heading">
              Chacun peut contribuer à sa manière.
            </h2>
            <p>
              Découvrez les espaces imaginés pour les différents acteurs de la
              plateforme.
            </p>
          </div>
          <div className="about-audiences">
            {audiences.map((audience) => (
              <article className="about-audience" key={audience.label}>
                <span className="about-audience__icon">
                  <ProjectIcon name={audience.icon} size={21} />
                </span>
                <h3>{audience.label}</h3>
                <p>{audience.text}</p>
                <Link href={audience.href}>
                  {audience.action} <ProjectIcon name="arrow" size={15} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="about-commitment" aria-labelledby="about-commitment-heading">
          <div className="about-commitment__icon">
            <ProjectIcon name="handshake" size={25} />
          </div>
          <div>
            <span>Une démarche responsable</span>
            <h2 id="about-commitment-heading">
              La transparence avant toute décision.
            </h2>
            <p>
              Une présentation sur la plateforme ne vaut ni validation d’un
              projet ni garantie de résultat. Vérifiez les informations,
              évaluez les risques et demandez conseil à un professionnel
              indépendant.
            </p>
          </div>
          <Link href="/investisseurs">
            En savoir plus <ProjectIcon name="arrow" size={16} />
          </Link>
        </section>

        <section className="about-faq" aria-labelledby="about-faq-heading">
          <div className="about-section-heading">
            <span>Questions fréquentes</span>
            <h2 id="about-faq-heading">À propos d’InvestGuinée</h2>
          </div>
          <div className="about-faq__list">
            {faqs.map((faq) => (
              <details className="about-faq__item" key={faq.question}>
                <summary>
                  {faq.question}
                  <ProjectIcon name="chevron" size={17} />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="about-cta" aria-labelledby="about-cta-heading">
          <div>
            <span>Construisons la suite ensemble</span>
            <h2 id="about-cta-heading">
              Découvrez les initiatives et les espaces InvestGuinée.
            </h2>
            <p>
              Parcourez le catalogue de démonstration ou créez un compte pour
              suivre les évolutions de la plateforme.
            </p>
          </div>
          <div className="about-cta__actions">
            <Link href="/projets">Explorer les projets</Link>
            <Link href="/inscription">Créer un compte</Link>
          </div>
        </section>
      </main>

      <footer className="about-footer">
        <div className="about-footer__inner">
          <p>© <FooterYear /> InvestGuinée — Projet en développement.</p>
          <nav aria-label="Liens utiles">
            <Link href="/projets">Projets</Link>
            <Link href="/investisseurs">Investisseurs</Link>
            <Link href="/etudiants">Étudiants</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
