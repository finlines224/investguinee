import { Suspense } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import StatsSection from "./components/StatsSection";
import SectorSection from "./components/SectorSection";
import RecentProjectsSection from "./components/RecentProjectsSection";
import CallToActionBanner from "./components/CallToActionBanner";
import FooterYear from "./components/FooterYear";
import { getHomepageData } from "./lib/homepage-api";

async function HomepageContent() {
  const homepageData = await getHomepageData().catch(() => null);

  return (
    <>
      <HeroSection projectsCount={homepageData?.stats.publishedProjects ?? null} />
      <StatsSection stats={homepageData?.stats ?? null} />
      <SectorSection sectors={homepageData?.sectors ?? []} />
      <RecentProjectsSection
        projects={homepageData?.projects ?? []}
        isAvailable={homepageData !== null}
      />
      <CallToActionBanner />
    </>
  );
}

export default function Home() {
  return (
    <div className="page-wrapper">
      <Navbar />
      <main>
        <Suspense fallback={<p role="status">Chargement de l’accueil…</p>}>
          <HomepageContent />
        </Suspense>
      </main>
      <footer className="site-footer" id="contact">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <div className="navbar__flag" aria-hidden="true">
              <span className="navbar__flag-stripe navbar__flag-stripe--red" />
              <span className="navbar__flag-stripe navbar__flag-stripe--yellow" />
              <span className="navbar__flag-stripe navbar__flag-stripe--green" />
            </div>
            <span className="navbar__brand-name site-footer__brand-name">InvestGuinée</span>
          </div>
          <p className="site-footer__copy">
            © <FooterYear /> InvestGuinée — Tous droits réservés. Conakry, Guinée.
          </p>
          <nav className="site-footer__nav" aria-label="Navigation pied de page">
            <a href="#confidentialite" id="confidentialite" className="site-footer__link">Confidentialité</a>
            <a href="#conditions" id="conditions" className="site-footer__link">Conditions d’utilisation</a>
            <a href="#contact" className="site-footer__link">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
