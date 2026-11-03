export const resourceCategories = [
  "Toutes les ressources",
  "Entrepreneuriat",
  "Finance",
  "Compétences",
] as const;

export const studentResources = [
  {
    id: "idee-projet",
    category: "Entrepreneuriat",
    icon: "rocket",
    title: "De l’idée au projet",
    description:
      "Apprenez à clarifier un besoin, définir une proposition de valeur et structurer les premières étapes d’une idée.",
    format: "Parcours découverte",
    level: "Débutant",
  },
  {
    id: "plan-affaires",
    category: "Entrepreneuriat",
    icon: "folder",
    title: "Les bases d’un plan d’affaires",
    description:
      "Repérez les éléments essentiels pour présenter un projet, ses objectifs et son modèle économique.",
    format: "Guide pratique",
    level: "Intermédiaire",
  },
  {
    id: "budget",
    category: "Finance",
    icon: "handshake",
    title: "Comprendre un budget de projet",
    description:
      "Familiarisez-vous avec les dépenses, les ressources nécessaires et les notions simples de prévision.",
    format: "Fiche pédagogique",
    level: "Débutant",
  },
  {
    id: "pitch",
    category: "Compétences",
    icon: "search",
    title: "Présenter son idée avec clarté",
    description:
      "Découvrez comment organiser un message court, expliquer un besoin et mettre en valeur une solution.",
    format: "Atelier — aperçu",
    level: "Tous niveaux",
  },
  {
    id: "equipe",
    category: "Compétences",
    icon: "handshake",
    title: "Construire une équipe projet",
    description:
      "Identifiez les rôles, les compétences complémentaires et les bons réflexes pour travailler en équipe.",
    format: "Parcours découverte",
    level: "Débutant",
  },
  {
    id: "financement",
    category: "Finance",
    icon: "folder",
    title: "Les modes de financement",
    description:
      "Explorez les grandes différences entre apport personnel, financement participatif et autres sources.",
    format: "Fiche pédagogique",
    level: "Intermédiaire",
  },
] as const;
