export const challengeCategories = [
  "Toutes les opportunités",
  "Défis",
  "Concours",
] as const;

export const studentChallenges = [
  {
    id: "innovation-jeunesse",
    category: "Concours",
    title: "Innovation jeunesse",
    description:
      "Exemple de concours autour de solutions innovantes répondant à un besoin local.",
    theme: "Innovation · Entrepreneuriat",
  },
  {
    id: "projet-durable",
    category: "Défis",
    title: "Projet à impact durable",
    description:
      "Exemple de défi pour imaginer un projet utile aux communautés et respectueux de l’environnement.",
    theme: "Impact · Environnement",
  },
  {
    id: "idee-numerique",
    category: "Défis",
    title: "Idée numérique",
    description:
      "Exemple de défi de conception d’un service numérique répondant à un enjeu du quotidien.",
    theme: "Numérique · Services",
  },
] as const;
