export default function CallToActionBanner() {
  return (
    <section className="cta-banner" aria-label="Rejoindre InvestGuinée">
      {/* Background image */}
      <div className="cta-banner__bg" aria-hidden="true" />
      {/* Gradient overlay */}
      <div className="cta-banner__overlay" aria-hidden="true" />
      {/* Geometric pattern */}
      <div className="cta-banner__pattern" aria-hidden="true" />

      <div className="cta-banner__inner">
        {/* Left: logo + text */}
        <div className="cta-banner__content">
          {/* Mini Guinea flag */}
          <div className="cta-banner__flag" aria-hidden="true">
            <span className="cta-banner__flag-stripe cta-banner__flag-stripe--red" />
            <span className="cta-banner__flag-stripe cta-banner__flag-stripe--yellow" />
            <span className="cta-banner__flag-stripe cta-banner__flag-stripe--green" />
          </div>
          <div>
            <h2 className="cta-banner__title">
              Ensemble, construisons une Guinée innovante et prospère
            </h2>
            <p className="cta-banner__subtitle">
              InvestGuinée, une plateforme au service du développement économique.
            </p>
          </div>
        </div>

        {/* Right: CTA button */}
        <a href="#inscription" className="cta-banner__btn">
          S&apos;inscrire dès maintenant
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </section>
  );
}
