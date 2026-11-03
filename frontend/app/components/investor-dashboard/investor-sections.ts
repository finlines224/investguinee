export const investorSections = [
  { id: "dashboard", label: "Tableau de bord", icon: "home" },
  { id: "projects", label: "Mes projets", icon: "folder" },
  { id: "explore", label: "Explorer les projets", icon: "search" },
  { id: "requests", label: "Demandes d’accès", icon: "handshake" },
  { id: "messages", label: "Messagerie", icon: "mail" },
  { id: "appointments", label: "Rendez-vous", icon: "calendar" },
  { id: "favorites", label: "Favoris", icon: "heart" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "profile", label: "Profil & paramètres", icon: "user" },
  { id: "subscriptions", label: "Abonnements", icon: "briefcase" },
] as const;

export type InvestorSection = (typeof investorSections)[number]["id"];
