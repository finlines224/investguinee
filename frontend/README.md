This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Authentification

Les interfaces sont disponibles sur `/connexion`, `/inscription`,
`/mot-de-passe-oublie` et `/reinitialiser-mot-de-passe`. En développement,
l'application appelle automatiquement le backend Django local.

Lancer le backend en suivant les étapes de
[backend/README.md](../backend/README.md). En production ou pour employer une
autre adresse, définir `NEXT_PUBLIC_AUTH_API_URL` dans `frontend/.env.local`,
par exemple `https://api.example.com/api`. Le frontend envoie des requêtes JSON
avec cookies inclus vers :

- `GET /auth/csrf/`
- `POST /auth/login/`
- `POST /auth/register/`
- `POST /auth/password-reset/`
- `POST /auth/password-reset/confirm/`

Le backend répond avec un statut de succès uniquement après avoir traité la
demande. Il assure la validation, la protection CSRF, les sessions, le hachage
des mots de passe et les limites de requêtes. Les boutons Google et LinkedIn ne
démarrent pas de flux OAuth tant que leurs fournisseurs ne sont pas configurés.
