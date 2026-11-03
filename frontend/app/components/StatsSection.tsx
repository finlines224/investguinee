import type { HomepageStats } from "../lib/homepage-api";

// Icon components
function HandshakeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/>
    </svg>
  );
}
function RocketIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/>
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  );
}

const iconMap: Record<string, React.ReactNode> = {
  handshake: <HandshakeIcon />,
  rocket: <RocketIcon />,
  users: <UsersIcon />,
  shield: <ShieldIcon />,
};

export default function StatsSection({ stats }: { stats: HomepageStats | null }) {
  if (!stats) return null;

  const items = [
    { id: "members", icon: "handshake", value: stats.members, label: "Membres actifs", color: "#008F63" },
    { id: "projects", icon: "rocket", value: stats.publishedProjects, label: "Projets publiés", color: "#2468B4" },
    { id: "investors", icon: "users", value: stats.investors, label: "Investisseurs", color: "#008F63" },
    { id: "entrepreneurs", icon: "users", value: stats.entrepreneurs, label: "Entrepreneurs", color: "#d97706" },
  ];

  return (
    <section className="stats" aria-label="Statistiques de la plateforme">
      <div className="stats__inner">
        {items.map((s, i) => (
          <div
            key={s.id}
            className={`stats__item${i < items.length - 1 ? " stats__item--bordered" : ""}`}
          >
            <div className="stats__icon" style={{ color: s.color }}>
              {iconMap[s.icon]}
            </div>
            <div>
              <div className="stats__value">{s.value.toLocaleString("fr-FR")}</div>
              <div className="stats__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
