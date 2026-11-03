export type CatalogStatus = "Publié" | "En cours" | "En attente";

export type CatalogProject = {
  id: number;
  slug: string;
  title: string;
  description: string;
  summary: string;
  images: string[];
  status: CatalogStatus;
  sectors: string[];
  location: string;
  region: string;
  amountRequested: number;
  amountCollected?: number;
  fundingPercentage?: number;
  developmentStage: string;
  publishedAt: string;
  views?: number;
  owner: string;
};

export const projectCatalogStats = [
  { label: "Projets publiés", value: "1 250", icon: "folder" },
  { label: "Investisseurs", value: "420", icon: "handshake" },
  { label: "Projets financés", value: "320", icon: "rocket" },
] as const;

export const projectSectors = [
  "Agriculture",
  "Technologie",
  "Énergie",
  "Santé",
  "Éducation",
  "Commerce",
  "Environnement",
  "Industrie",
  "Autres",
] as const;

export const guineanRegions = [
  "Boké",
  "Conakry",
  "Faranah",
  "Kankan",
  "Kindia",
  "Labé",
  "Mamou",
  "N'Zérékoré",
] as const;

export const developmentStages = [
  "Idée",
  "Étude de faisabilité",
  "Prototype",
  "En développement",
  "Opérationnel",
] as const;

export const amountRanges = [
  { id: "under-50m", label: "Moins de 50 millions GNF", min: 0, max: 50_000_000 },
  { id: "50m-100m", label: "50 à 100 millions GNF", min: 50_000_000, max: 100_000_000 },
  { id: "100m-250m", label: "100 à 250 millions GNF", min: 100_000_000, max: 250_000_000 },
  { id: "250m-500m", label: "250 à 500 millions GNF", min: 250_000_000, max: 500_000_000 },
  { id: "over-500m", label: "Plus de 500 millions GNF", min: 500_000_000, max: Number.POSITIVE_INFINITY },
] as const;

export const catalogProjects: CatalogProject[] = [
  {
    id: 1,
    slug: "agritech-guinee",
    title: "AgriTech Guinée",
    description: "Projet d’agriculture intelligente avec irrigation solaire.",
    summary: "Des outils connectés et une irrigation à énergie solaire pour améliorer les récoltes et accompagner durablement les producteurs guinéens.",
    images: ["/project_agriculture.png", "/gallery_agri_3.png"],
    status: "Publié",
    sectors: ["Agriculture", "Technologie"],
    location: "Conakry",
    region: "Conakry",
    amountRequested: 250_000_000,
    amountCollected: 175_000_000,
    fundingPercentage: 70,
    developmentStage: "Prototype",
    publishedAt: "2025-10-15",
    views: 1200,
    owner: "AgriTech Guinée",
  },
  {
    id: 2,
    slug: "solarguinee",
    title: "SolarGuinée",
    description: "Solutions d’énergie solaire pour les zones rurales.",
    summary: "Des installations solaires accessibles pour renforcer l’autonomie énergétique et les services de proximité dans les communautés rurales.",
    images: ["/project_solar.png"],
    status: "En cours",
    sectors: ["Énergie", "Environnement"],
    location: "Kindia",
    region: "Kindia",
    amountRequested: 500_000_000,
    amountCollected: 225_000_000,
    fundingPercentage: 45,
    developmentStage: "En développement",
    publishedAt: "2025-10-12",
    views: 980,
    owner: "SolarGuinée",
  },
  {
    id: 3,
    slug: "sante-plus-guinee",
    title: "Santé Plus Guinée",
    description: "Plateforme numérique de télémédecine pour tous.",
    summary: "Une solution numérique qui facilite la prise de rendez-vous et met les patients en relation avec des professionnels de santé.",
    images: ["/project_edtech.png"],
    status: "Publié",
    sectors: ["Santé", "Technologie"],
    location: "Labé",
    region: "Labé",
    amountRequested: 300_000_000,
    amountCollected: 240_000_000,
    fundingPercentage: 80,
    developmentStage: "Prototype",
    publishedAt: "2025-10-10",
    views: 1500,
    owner: "Santé Plus Guinée",
  },
  {
    id: 4,
    slug: "industrie-locale",
    title: "Industrie Locale",
    description: "Transformation locale des produits agricoles.",
    summary: "Une unité de transformation qui valorise les récoltes locales et facilite l’accès des producteurs aux circuits commerciaux.",
    images: ["/gallery_agri_1.png"],
    status: "En attente",
    sectors: ["Industrie", "Agriculture"],
    location: "Kankan",
    region: "Kankan",
    amountRequested: 420_000_000,
    amountCollected: 84_000_000,
    fundingPercentage: 20,
    developmentStage: "Étude de faisabilité",
    publishedAt: "2025-10-08",
    views: 640,
    owner: "Industrie Locale",
  },
  {
    id: 5,
    slug: "educonnect-guinee",
    title: "EduConnect Guinée",
    description: "Plateforme d’apprentissage numérique pour les étudiants.",
    summary: "Des contenus et des outils d’apprentissage en ligne adaptés aux étudiants et aux établissements de formation guinéens.",
    images: ["/project_edtech.png"],
    status: "Publié",
    sectors: ["Éducation", "Technologie"],
    location: "Conakry",
    region: "Conakry",
    amountRequested: 180_000_000,
    amountCollected: 117_000_000,
    fundingPercentage: 65,
    developmentStage: "En développement",
    publishedAt: "2025-10-05",
    views: 1100,
    owner: "EduConnect Guinée",
  },
  {
    id: 6,
    slug: "ecoguinee",
    title: "EcoGuinée",
    description: "Reboisement et protection de l’environnement guinéen.",
    summary: "Des actions communautaires de reboisement et de préservation des paysages naturels dans le sud-est de la Guinée.",
    images: ["/gallery_agri_2.png"],
    status: "Publié",
    sectors: ["Environnement", "Agriculture"],
    location: "N'Zérékoré",
    region: "N'Zérékoré",
    amountRequested: 95_000_000,
    amountCollected: 57_000_000,
    fundingPercentage: 60,
    developmentStage: "Opérationnel",
    publishedAt: "2025-10-01",
    views: 760,
    owner: "EcoGuinée",
  },
];
