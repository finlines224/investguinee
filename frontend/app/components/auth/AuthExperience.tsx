import Link from "next/link";
import AuthForm from "./AuthForm";
import type { AuthMode } from "./AuthForm";
import AuthIcon from "./AuthIcon";

const benefits = [
  "Accédez à des projets vérifiés",
  "Connectez-vous avec des partenaires fiables",
  "Sécurisez vos informations",
];

export default function AuthExperience({
  mode,
  resetToken,
}: {
  mode: AuthMode;
  resetToken?: { uid: string; token: string } | null;
}) {
  const activeTab = mode === "forgot" ? "login" : mode;

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link className="auth-brand" href="/" aria-label="InvestGuinée, accueil">
          <span className="auth-brand__flag" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="auth-brand__text">
            <strong>InvestGuinée</strong>
            <small>Innover · Financer · Bâtir la Guinée</small>
          </span>
        </Link>
        <div className="auth-header__actions">
          <details className="auth-language">
            <summary><AuthIcon name="globe" size={18} /><span>FR</span><AuthIcon name="chevron" size={15} /></summary>
            <div className="auth-language__menu">
              <span aria-current="true">Français <small>Actif</small></span>
              <span className="auth-language__soon">English <small>Bientôt disponible</small></span>
            </div>
          </details>
          <details className="auth-help">
            <summary><AuthIcon name="help" size={17} /> Aide ?</summary>
            <div className="auth-help__panel">
              <strong>Besoin d’aide ?</strong>
              <p>Vérifiez votre adresse email et votre mot de passe. Pour récupérer l’accès à votre compte, utilisez le lien « Mot de passe oublié ? ».</p>
            </div>
          </details>
        </div>
      </header>

      <main className="auth-main">
        <section className="auth-hero" aria-label="Bienvenue sur InvestGuinée">
          <div className="auth-hero__content">
            <span className="auth-hero__eyebrow">L’écosystème qui fait avancer la Guinée</span>
            <h1>Bienvenue sur<br /><span>InvestGuinée</span></h1>
            <p className="auth-hero__subtitle">Votre passerelle vers les opportunités d’investissement en Guinée</p>
            <ul className="auth-hero__benefits">
              {benefits.map((benefit) => (
                <li key={benefit}><span><AuthIcon name="check" size={17} /></span>{benefit}</li>
              ))}
            </ul>
            <div className="auth-stats" aria-label="Statistiques indicatives de la plateforme">
              <div><AuthIcon name="handshake" size={22} /><strong>1 250</strong><span>Membres actifs</span></div>
              <div><AuthIcon name="rocket" size={22} /><strong>420</strong><span>Projets publiés</span></div>
              <div><AuthIcon name="chart" size={22} /><strong>180</strong><span>Investisseurs</span></div>
            </div>
            <p className="auth-hero__disclaimer">Chiffres de démonstration — données à confirmer.</p>
          </div>
        </section>

        <section className="auth-panel" aria-label="Authentification">
          <div className="auth-card">
            {mode !== "forgot" && mode !== "reset" && (
              <nav className="auth-tabs" aria-label="Choisir le type de compte">
                <Link
                  href="/connexion"
                  className={activeTab === "login" ? "auth-tabs__tab auth-tabs__tab--active" : "auth-tabs__tab"}
                  aria-current={activeTab === "login" ? "page" : undefined}
                >
                  <AuthIcon name="user" size={19} /> Connexion
                </Link>
                <Link
                  href="/inscription"
                  className={activeTab === "register" ? "auth-tabs__tab auth-tabs__tab--active" : "auth-tabs__tab"}
                  aria-current={activeTab === "register" ? "page" : undefined}
                >
                  <AuthIcon name="edit" size={19} /> Inscription
                </Link>
              </nav>
            )}
            <AuthForm key={mode} mode={mode} resetToken={resetToken} />
          </div>
        </section>
      </main>

      <footer className="auth-footer">
        <div className="auth-footer__inner">
          <p className="auth-footer__security"><AuthIcon name="shield" size={19} /> Vos données sont protégées et sécurisées</p>
          <nav aria-label="Liens légaux et contact">
            <Link href="/#confidentialite">Politique de confidentialité</Link>
            <Link href="/#conditions">Conditions d’utilisation</Link>
            <Link href="/#contact">Contact</Link>
          </nav>
        </div>
        <div className="auth-footer__skyline" aria-hidden="true">
          <svg viewBox="0 0 420 68" preserveAspectRatio="xMaxYMax meet">
            <path d="M0 66h420M12 66V40h27v26m-21-26V25h15v15m21 26V32h39v34m-29-34V18h18v14m3 0V10h8v22m19 34V42h38v24m-29-24V26h18v16m38 24V35h28v31m-19-31V19h10v16m26 31V45h42v21m-32-21V31h21v14m37 21V26h39v40m-30-40V14h20v12m23 40V37h27v29m-19-29V23h10v14m20 29V44h31v22" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M70 18h18m-9-9v18m83 15h20m-10-10v20m147-28h18m-9-9v18" fill="none" stroke="currentColor" strokeWidth="1"/>
          </svg>
        </div>
      </footer>
    </div>
  );
}