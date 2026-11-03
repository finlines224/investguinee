"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "../data";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isProjectsPage = pathname.startsWith("/projets");
  const isInvestorsPage = pathname.startsWith("/investisseurs");
  const isStudentsPage = pathname.startsWith("/etudiants");
  const isAboutPage = pathname.startsWith("/a-propos");
  const getNavHref = (label: string) => {
    if (label === "Accueil") return "/";
    if (label === "Projets") return "/projets";
    if (label === "Investisseurs") return "/investisseurs";
    if (label === "Étudiants") return "/etudiants";
    if (label === "À propos") return "/a-propos";
    return "#";
  };
  const isNavActive = (label: string) =>
    (label === "Accueil" && pathname === "/") ||
    (label === "Projets" && isProjectsPage) ||
    (label === "Investisseurs" && isInvestorsPage) ||
    (label === "Étudiants" && isStudentsPage) ||
    (label === "À propos" && isAboutPage);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`navbar${scrolled ? " navbar--scrolled" : ""}`}
        role="navigation"
        aria-label="Navigation principale"
      >
        <div className="navbar__inner">
          {/* Logo */}
          <Link href="/" className="navbar__logo" aria-label="InvestGuinée - Accueil">
            <div className="navbar__flag" aria-hidden="true">
              <span className="navbar__flag-stripe navbar__flag-stripe--red" />
              <span className="navbar__flag-stripe navbar__flag-stripe--yellow" />
              <span className="navbar__flag-stripe navbar__flag-stripe--green" />
            </div>
            <div>
              <div className="navbar__brand-name">InvestGuinée</div>
              <div className="navbar__brand-tagline">Innover · Financer · Bâtir la Guinée</div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <ul className="navbar__links" role="list">
            {navLinks.map((link) => (
              <li key={link.label}>
                {link.label === "Projets" || link.label === "Accueil" || link.label === "Investisseurs" || link.label === "Étudiants" || link.label === "À propos" ? (
                  <Link
                    href={getNavHref(link.label)}
                    className={`navbar__link${isNavActive(link.label) ? " navbar__link--active" : ""}`}
                    aria-current={isNavActive(link.label) ? "page" : undefined}
                  >
                    {link.label}
                    {link.dropdown && (
                      <svg className="navbar__chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    className="navbar__link"
                  >
                    {link.label}
                    {link.dropdown && (
                      <svg className="navbar__chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </a>
                )}
              </li>
            ))}
          </ul>

          {/* Desktop actions */}
          <div className="navbar__actions">
            <Link href="/projets#projects-search" className="navbar__search-btn" aria-label="Rechercher un projet">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </Link>
            {isProjectsPage ? (
              <>
                <Link className="navbar__notification" href="/connexion" aria-label="Connectez-vous pour accéder aux notifications">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>
                  </svg>
                  <span>3</span>
                </Link>
                <Link href="/connexion" className="navbar__account" aria-label="Mon compte, se connecter">
                  <span className="navbar__account-avatar">IG</span>
                  <span>Mon compte</span>
                  <svg className="navbar__chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </>
            ) : (
              <>
                <Link href="/connexion" className="btn btn--outline">Connexion</Link>
                <Link href="/inscription" className="btn btn--primary">Inscription</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="navbar__hamburger"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className={`navbar__bar${mobileOpen ? " navbar__bar--open-1" : ""}`} />
            <span className={`navbar__bar${mobileOpen ? " navbar__bar--open-2" : ""}`} />
            <span className={`navbar__bar${mobileOpen ? " navbar__bar--open-3" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu panel */}
      <div
        id="mobile-menu"
        ref={menuRef}
        className={`mobile-menu${mobileOpen ? " mobile-menu--open" : ""}`}
        aria-hidden={!mobileOpen}
      >
        <div className="mobile-menu__header">
          <div className="navbar__flag" aria-hidden="true">
            <span className="navbar__flag-stripe navbar__flag-stripe--red" />
            <span className="navbar__flag-stripe navbar__flag-stripe--yellow" />
            <span className="navbar__flag-stripe navbar__flag-stripe--green" />
          </div>
          <span className="navbar__brand-name">InvestGuinée</span>
          <button
            className="mobile-menu__close"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <ul className="mobile-menu__links" role="list">
          {navLinks.map((link) => (
            <li key={link.label}>
              {link.label === "Projets" || link.label === "Accueil" || link.label === "Investisseurs" || link.label === "Étudiants" || link.label === "À propos" ? (
                <Link
                  href={getNavHref(link.label)}
                  className={`mobile-menu__link${isNavActive(link.label) ? " mobile-menu__link--active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isNavActive(link.label) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="mobile-menu__link"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>

        <div className="mobile-menu__actions">
          <a href="/connexion" className="btn btn--outline btn--full" onClick={() => setMobileOpen(false)}>Connexion</a>
          <a href="/inscription" className="btn btn--primary btn--full" onClick={() => setMobileOpen(false)}>Inscription</a>
        </div>
      </div>
    </>
  );
}
