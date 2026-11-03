"use client";

import Link from "next/link";
import type { HomepageSector } from "../lib/homepage-api";

const sectorPresentation: Record<string, { icon: string; color: string; bg: string }> = {
  Agriculture: { icon: "🌿", color: "#008F63", bg: "#D0F8E9" },
  Technologie: { icon: "💻", color: "#2468B4", bg: "#D9EDFF" },
  Éducation: { icon: "🎓", color: "#008F63", bg: "#D0F8E9" },
  Santé: { icon: "♥", color: "#e53e3e", bg: "#fff0f0" },
  Énergie: { icon: "⚡", color: "#d97706", bg: "#fef3c7" },
  Industrie: { icon: "▦", color: "#2468B4", bg: "#D9EDFF" },
  Commerce: { icon: "▣", color: "#d97706", bg: "#fef3c7" },
  Environnement: { icon: "♧", color: "#008F63", bg: "#D0F8E9" },
};

function SectorCard({ sector }: { sector: HomepageSector }) {
  const presentation = sectorPresentation[sector.sector] ?? {
    icon: "···",
    color: "#2468B4",
    bg: "#D9EDFF",
  };

  return (
    <Link
      className="sector-card"
      href={`/projets?q=${encodeURIComponent(sector.sector)}`}
      aria-label={`Explorer les projets dans le secteur ${sector.sector}`}
    >
      <div
        className="sector-card__icon-wrap"
        style={{ background: presentation.bg, color: presentation.color }}
        aria-hidden="true"
      >
        <span className="sector-card__icon">{presentation.icon}</span>
      </div>
      <span className="sector-card__label">{sector.sector}</span>
      <small>{sector.project_count} projet{sector.project_count > 1 ? "s" : ""}</small>
    </Link>
  );
}

export default function SectorSection({ sectors }: { sectors: HomepageSector[] }) {
  return (
    <section className="sectors" aria-label="Nos secteurs clés">
      <div className="sectors__inner">
        {/* Section heading */}
        <div className="section-heading">
          <div className="section-heading__line section-heading__line--left" aria-hidden="true" />
          <h2 className="section-heading__title">Nos secteurs clés</h2>
          <div className="section-heading__line section-heading__line--right" aria-hidden="true" />
        </div>

        {/* Grid */}
        <div className="sectors__grid" role="list" aria-label="Liste des secteurs">
          {sectors.length > 0 ? sectors.map((sector) => (
            <div key={sector.sector} role="listitem">
              <SectorCard sector={sector} />
            </div>
          )) : <p role="status">Aucun secteur n’est associé à un projet publié.</p>}
        </div>
      </div>
    </section>
  );
}
