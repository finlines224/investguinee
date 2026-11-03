import { whyItems } from "../data";

export default function WhyInvestGuineePanel() {
  return (
    <aside className="why-panel" aria-label="Pourquoi choisir InvestGuinée">
      {/* Decorative Guinea map silhouette */}
      <div className="why-panel__map-bg" aria-hidden="true">
        <svg viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="why-panel__map-svg">
          {/* Simplified Guinea outline */}
          <path
            d="M60 20 L140 15 L170 45 L175 90 L160 130 L150 170 L130 220 L100 260 L70 250 L50 210 L30 170 L20 120 L25 70 L45 35 Z"
            fill="white"
            opacity="0.06"
          />
          {/* Network dots */}
          <circle cx="80" cy="80" r="3" fill="white" opacity="0.2"/>
          <circle cx="130" cy="100" r="2.5" fill="white" opacity="0.15"/>
          <circle cx="100" cy="150" r="3" fill="white" opacity="0.2"/>
          <circle cx="60" cy="130" r="2" fill="white" opacity="0.12"/>
          <circle cx="150" cy="60" r="2" fill="white" opacity="0.12"/>
          {/* Network lines */}
          <line x1="80" y1="80" x2="130" y2="100" stroke="white" strokeWidth="0.7" opacity="0.12"/>
          <line x1="130" y1="100" x2="100" y2="150" stroke="white" strokeWidth="0.7" opacity="0.12"/>
          <line x1="100" y1="150" x2="60" y2="130" stroke="white" strokeWidth="0.7" opacity="0.12"/>
          <line x1="80" y1="80" x2="150" y2="60" stroke="white" strokeWidth="0.7" opacity="0.1"/>
        </svg>
      </div>

      <h2 className="why-panel__title">
        Pourquoi choisir<br />InvestGuinée ?
      </h2>

      <ul className="why-panel__list" role="list">
        {whyItems.map((item, i) => (
          <li key={i} className="why-panel__item">
            <span className="why-panel__check" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6l3 3 5-5"/>
              </svg>
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <a href="#inscription" className="why-panel__cta">
        Rejoindre la communauté
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
    </aside>
  );
}
