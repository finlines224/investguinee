// ─── Centralized Data Configuration ─────────────────────────────────────────

export const navLinks = [
  { label: "Accueil", href: "#", active: true },
  { label: "Projets", href: "#projets", dropdown: true },
  { label: "Investisseurs", href: "#investisseurs", dropdown: true },
  { label: "Étudiants", href: "#etudiants", dropdown: true },
  { label: "À propos", href: "#apropos", dropdown: true },
];

export const stats = [
  {
    id: "members",
    icon: "handshake",
    value: "1 250",
    label: "Membres actifs",
    color: "#008F63",
  },
  {
    id: "projects",
    icon: "rocket",
    value: "420",
    label: "Projets publiés",
    color: "#2468B4",
  },
  {
    id: "investors",
    icon: "users",
    value: "180",
    label: "Investisseurs",
    color: "#008F63",
  },
  {
    id: "secure",
    icon: "shield",
    value: "100%",
    label: "Sécurisé",
    color: "#008F63",
  },
];

export type SectorItem = {
  id: string;
  icon: string;
  label: string;
  color: string;
  bg: string;
};

export const sectors: SectorItem[] = [
  { id: "agriculture", icon: "🌿", label: "Agriculture", color: "#008F63", bg: "#D0F8E9" },
  { id: "numerique", icon: "💻", label: "Numérique &\nTechnologie", color: "#2468B4", bg: "#D9EDFF" },
  { id: "education", icon: "🎓", label: "Éducation", color: "#008F63", bg: "#D0F8E9" },
  { id: "sante", icon: "❤️", label: "Santé", color: "#e53e3e", bg: "#fff0f0" },
  { id: "energie", icon: "⚡", label: "Énergie", color: "#d97706", bg: "#fef3c7" },
  { id: "industrie", icon: "🏭", label: "Industrie", color: "#2468B4", bg: "#D9EDFF" },
  { id: "commerce", icon: "🛒", label: "Commerce", color: "#d97706", bg: "#fef3c7" },
  { id: "environnement", icon: "🌳", label: "Environnement", color: "#008F63", bg: "#D0F8E9" },
  { id: "autres", icon: "···", label: "Autres", color: "#2468B4", bg: "#D9EDFF" },
];

export type ProjectStatus = "En cours" | "Publié" | "En recherche";

export type Project = {
  id: number;
  image: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  title: string;
  location: string;
  amount: string;
  status: ProjectStatus;
};

export const projects: Project[] = [
  {
    id: 1,
    image: "/project_agriculture.png",
    tag: "Agriculture",
    tagColor: "#008F63",
    tagBg: "#D0F8E9",
    title: "Village agricole intelligent",
    location: "Kindia",
    amount: "250 M GNF",
    status: "En cours",
  },
  {
    id: 2,
    image: "/project_solar.png",
    tag: "Énergie",
    tagColor: "#d97706",
    tagBg: "#fef3c7",
    title: "Solutions solaires pour tous",
    location: "Conakry",
    amount: "500 M GNF",
    status: "Publié",
  },
  {
    id: 3,
    image: "/project_edtech.png",
    tag: "Technologie",
    tagColor: "#2468B4",
    tagBg: "#D9EDFF",
    title: "Start-up EdTech Guinée",
    location: "Labé",
    amount: "200 M GNF",
    status: "En recherche",
  },
];

export const whyItems = [
  "Une plateforme fiable et sécurisée",
  "Une mise en relation ciblée",
  "Un écosystème dynamique",
  "Un accompagnement dédié",
];

// ─── Project Detail Data ─────────────────────────────────────────────────────

export type TeamMember = {
  name: string;
  role: string;
  avatar: string;
};

export type ProjectDocument = {
  name: string;
  type: string;
  size: string;
  date: string;
};

export type ProjectDetail = {
  id: number;
  slug: string;
  status: ProjectStatus;
  category: string;
  categoryColor: string;
  categoryBg: string;
  title: string;
  subtitle: string;
  location: string;
  stage: string;
  publishedAt: string;
  heroImage: string;
  gallery: string[];
  summary: string;
  problem: string;
  solution: string;
  objectives: string[];
  owner: {
    name: string;
    type: string;
    logo: string;
    verified: boolean;
    level: number;
    rating: number;
    reviews: number;
    projects: number;
    subscribers: string;
  };
  financing: {
    goal: number;
    raised: number;
    currency: string;
    usage: string;
  };
  keyInfo: {
    sector: string;
    location: string;
    amount: string;
    stage: string;
    visibility: string;
  };
  team: TeamMember[];
  documents: ProjectDocument[];
  history: { date: string; event: string }[];
};

export const projectDetails: ProjectDetail[] = [
  {
    id: 1,
    slug: "projet-agricole-intelligent-guinee",
    status: "Publié",
    category: "Agriculture",
    categoryColor: "#008F63",
    categoryBg: "#D0F8E9",
    title: "Projet agricole intelligent en Guinée",
    subtitle:
      "Une agriculture durable et connectée pour nourrir la Guinée tout en préservant notre environnement.",
    location: "Kindia",
    stage: "Prototype",
    publishedAt: "15/10/2025",
    heroImage: "/project_agriculture.png",
    gallery: [
      "/gallery_agri_1.png",
      "/gallery_agri_2.png",
      "/gallery_agri_3.png",
    ],
    summary:
      "Ce projet vise à développer une agriculture intelligente basée sur les technologies modernes (irrigation automatique, capteurs et analyse de données) pour améliorer les rendements et réduire l'impact environnemental.",
    problem:
      "Faible productivité agricole, dépendance aux aléas climatiques et manque d'accès aux technologies modernes.",
    solution:
      "Mise en place de solutions agricoles innovantes : irrigation intelligente, semences améliorées et suivi des cultures par capteurs.",
    objectives: [
      "Augmenter la productivité de 50%",
      "Créer 200 emplois directs",
      "Contribuer à la sécurité alimentaire",
    ],
    owner: {
      name: "AgriTech Guinée",
      type: "Entrepreneur",
      logo: "/agritech_logo.png",
      verified: true,
      level: 2,
      rating: 4.8,
      reviews: 24,
      projects: 3,
      subscribers: "1.2k",
    },
    financing: {
      goal: 250000000,
      raised: 87500000,
      currency: "GNF",
      usage: "60% Équipement • 40% Formation",
    },
    keyInfo: {
      sector: "Agriculture",
      location: "Kindia, Guinée",
      amount: "250 000 000 GNF",
      stage: "Prototype",
      visibility: "Membres autorisés",
    },
    team: [
      { name: "Mamadou Diallo", role: "Directeur général", avatar: "MD" },
      { name: "Fatoumata Bah", role: "Agronome en chef", avatar: "FB" },
      { name: "Ibrahim Camara", role: "Ingénieur IoT", avatar: "IC" },
    ],
    documents: [
      { name: "Business Plan 2025", type: "PDF", size: "2.4 Mo", date: "10/10/2025" },
      { name: "Étude de marché", type: "PDF", size: "1.8 Mo", date: "05/10/2025" },
    ],
    history: [
      { date: "15/10/2025", event: "Projet publié sur InvestGuinée" },
      { date: "01/10/2025", event: "Validation du prototype en cours" },
      { date: "15/07/2025", event: "Lancement du projet pilote à Kindia" },
    ],
  },
];
