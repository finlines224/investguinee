export type AdminPeriod = "7d" | "30d" | "90d" | "12m";

export type PlatformPoint = {
  label: string;
  users: number;
  projects: number;
  activities: number;
};

export type DemoActivity = {
  id: number;
  title: string;
  description: string;
  time: string;
  kind: "user" | "project" | "access" | "payment" | "message";
};

export type DemoAccessRequest = {
  id: number;
  name: string;
  reason: string;
  age: string;
  initials: string;
};

export type RoleDistribution = {
  name: string;
  value: number;
  color: string;
};

export type AdminSearchRecord = {
  id: string;
  title: string;
  detail: string;
  type: "Utilisateur" | "Entreprise" | "Projet";
};

export const adminStats = [
  { label: "Utilisateurs inscrits", value: "12 480", change: "+12 %", color: "blue", icon: "users" },
  { label: "Projets publiés", value: "1 245", change: "+18 %", color: "violet", icon: "projects" },
  { label: "Entreprises", value: "892", change: "+14 %", color: "green", icon: "buildings" },
  { label: "Rendez-vous", value: "246", change: "+20 %", color: "orange", icon: "calendar" },
  { label: "Transactions", value: "8,7 M GNF", change: "+28 %", color: "sky", icon: "transactions" },
] as const;

export const platformSeries: Record<AdminPeriod, PlatformPoint[]> = {
  "7d": [
    { label: "Lun", users: 90, projects: 54, activities: 72 },
    { label: "Mar", users: 118, projects: 67, activities: 85 },
    { label: "Mer", users: 104, projects: 61, activities: 79 },
    { label: "Jeu", users: 145, projects: 82, activities: 104 },
    { label: "Ven", users: 132, projects: 74, activities: 96 },
    { label: "Sam", users: 166, projects: 91, activities: 121 },
    { label: "Dim", users: 184, projects: 103, activities: 138 },
  ],
  "30d": [
    { label: "01 oct.", users: 240, projects: 120, activities: 180 },
    { label: "05 oct.", users: 310, projects: 165, activities: 230 },
    { label: "09 oct.", users: 285, projects: 148, activities: 215 },
    { label: "13 oct.", users: 390, projects: 205, activities: 286 },
    { label: "17 oct.", users: 360, projects: 192, activities: 264 },
    { label: "21 oct.", users: 455, projects: 243, activities: 331 },
    { label: "25 oct.", users: 420, projects: 226, activities: 315 },
    { label: "29 oct.", users: 540, projects: 298, activities: 402 },
  ],
  "90d": [
    { label: "Août", users: 950, projects: 420, activities: 720 },
    { label: "Mi-août", users: 1100, projects: 510, activities: 810 },
    { label: "Sept.", users: 1240, projects: 590, activities: 920 },
    { label: "Mi-sept.", users: 1390, projects: 655, activities: 1020 },
    { label: "Oct.", users: 1510, projects: 730, activities: 1110 },
    { label: "Fin oct.", users: 1730, projects: 840, activities: 1280 },
  ],
  "12m": [
    { label: "Nov.", users: 420, projects: 180, activities: 310 },
    { label: "Janv.", users: 560, projects: 245, activities: 390 },
    { label: "Mars", users: 690, projects: 310, activities: 460 },
    { label: "Mai", users: 880, projects: 395, activities: 590 },
    { label: "Juil.", users: 1030, projects: 470, activities: 720 },
    { label: "Sept.", users: 1290, projects: 590, activities: 910 },
    { label: "Oct.", users: 1510, projects: 730, activities: 1110 },
  ],
};

export const demoActivities: DemoActivity[] = [
  { id: 1, title: "Nouvel utilisateur inscrit", description: "Inscription d'un nouvel utilisateur", time: "Il y a 12 min", kind: "user" },
  { id: 2, title: "Nouveau projet publié", description: "Nouveau projet SolarGuinée", time: "Il y a 38 min", kind: "project" },
  { id: 3, title: "Demande d'accès approuvée", description: "Demande d'accès traitée par un administrateur", time: "Il y a 1 h", kind: "access" },
  { id: 4, title: "Paiement confirmé", description: "Abonnement Premium confirmé", time: "Il y a 2 h", kind: "payment" },
  { id: 5, title: "Nouveau message", description: "Nouveau message reçu", time: "Il y a 3 h", kind: "message" },
];

export const demoAccessRequests: DemoAccessRequest[] = [
  { id: 101, name: "Fatoumata Bah", reason: "Accès à un projet sensible", age: "Il y a 1 h", initials: "FB" },
  { id: 102, name: "Ibrahima Camara", reason: "Accès partenaire", age: "Il y a 2 h", initials: "IC" },
  { id: 103, name: "Aminata Keita", reason: "Accès à la base de données", age: "Il y a 3 h", initials: "AK" },
];

export const roleDistribution: RoleDistribution[] = [
  { name: "Investisseurs", value: 32, color: "#0875FF" },
  { name: "Entrepreneurs", value: 40, color: "#00A66A" },
  { name: "Étudiants", value: 18, color: "#7038E8" },
  { name: "Administrateurs", value: 10, color: "#FFA500" },
];

export const adminSearchRecords: AdminSearchRecord[] = [
  { id: "user-1", title: "Fatoumata Bah", detail: "Investisseuse · Conakry", type: "Utilisateur" },
  { id: "user-2", title: "Ibrahima Camara", detail: "Entrepreneur · Kindia", type: "Utilisateur" },
  { id: "org-1", title: "AgriTech Guinée", detail: "Entreprise · Agriculture", type: "Entreprise" },
  { id: "org-2", title: "SolarGuinée", detail: "Entreprise · Énergie", type: "Entreprise" },
  { id: "project-1", title: "Énergie solaire pour tous", detail: "Projet · Énergie renouvelable", type: "Projet" },
  { id: "project-2", title: "Plateforme éducative guinéenne", detail: "Projet · Éducation", type: "Projet" },
];

export const adminDemoNotice = "Données de démonstration : aucun indicateur ou événement ci-dessous n'est chargé depuis l'API.";
