import Image from "next/image";

export default function HeroSection({ projectsCount }: { projectsCount: number | null }) {
  return (
    <section className="hero" aria-label="Accueil">
      <div className="hero__inner">
        {/* Left column */}
        <div className="hero__content">
          <div className="hero__badge">
            <span aria-hidden="true">🇬🇳</span>
            Plateforme d&apos;investissement guinéenne
          </div>

          <h1 className="hero__title">
            Connecter les talents,<br />
            financer l&apos;innovation<br />
            <span className="hero__title-accent">en Guinée</span>
          </h1>

          <p className="hero__description">
            Une plateforme sécurisée pour mettre en relation investisseurs,
            entrepreneurs et étudiants.
          </p>

          <div className="hero__actions">
            <a href="#projets" className="btn btn--primary btn--lg">
              Explorer les projets
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a href="#decouvrir" className="btn btn--ghost btn--lg">
              <span className="hero__play-icon" aria-hidden="true">
                <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
                  <path d="M1 1l10 6-10 6V1z"/>
                </svg>
              </span>
              Découvrir la plateforme
            </a>
          </div>

          {/* Trust indicators */}
          <div className="hero__trust">
            <div className="hero__trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008F63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span>Plateforme certifiée</span>
            </div>
            <div className="hero__trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008F63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span>Données sécurisées</span>
            </div>
            <div className="hero__trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008F63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span>Support 24/7</span>
            </div>
          </div>
        </div>

        {/* Right column — Hero image */}
        <div className="hero__image-wrap">
          {/* Decorative blobs */}
          <div className="hero__blob hero__blob--blue" aria-hidden="true" />
          <div className="hero__blob hero__blob--green" aria-hidden="true" />

          <div className="hero__image-frame">
            <Image
              src="/conakry_hero.png"
              alt="Vue panoramique de Conakry, capitale de la Guinée, avec le littoral et les bâtiments modernes"
              width={780}
              height={460}
              className="hero__image"
              priority
            />
            {/* Overlay card */}
            <div className="hero__overlay-card">
              <div className="hero__overlay-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#008F63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              <div>
                <div className="hero__overlay-title">Conakry, Guinée</div>
                <div className="hero__overlay-sub">Hub d&apos;innovation en Afrique de l&apos;Ouest</div>
              </div>
            </div>

            {projectsCount !== null && (
              <div className="hero__float-stat">
                <div className="hero__float-value">+{projectsCount.toLocaleString("fr-FR")}</div>
                <div className="hero__float-label">projets publiés</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
