# Backend Django

## Lancement local

1. Renseigner les réglages de développement dans `backend/.env` (voir
   `.env.example`). Le fichier `.env` local ne doit pas être partagé.
2. Depuis le dossier `backend`, installer les dépendances si nécessaire,
   appliquer les migrations puis lancer Django :

   ```powershell
   python -m pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver 127.0.0.1:8000
   ```

En développement, l'interface Next.js appelle automatiquement
`http://localhost:8000/api`. Définir `NEXT_PUBLIC_AUTH_API_URL` dans
`frontend/.env.local` pour employer une autre adresse.

## PostgreSQL avec Neon

Le navigateur ne se connecte jamais directement à PostgreSQL : le frontend
appelle l'API Django, et Django accède à la base. Pour activer Neon, renseigner
`DATABASE_URL` dans `backend/.env` uniquement, par exemple sous la forme
`postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require`. Garder cette valeur
hors du frontend et ne jamais la nommer `NEXT_PUBLIC_*`. Encoder les caractères
réservés présents dans le nom d'utilisateur ou le mot de passe.

Le pilote `psycopg` est installé et les paramètres de l'URL sont transmis au
pilote; `sslmode=require` active TLS pour Neon. L'absence de `DATABASE_URL`
conserve SQLite pour le développement local. Utiliser de préférence l'URL
poolée Neon pour le serveur applicatif et vérifier la configuration cible avant
d'exécuter `python manage.py migrate`. Les migrations créent le schéma, mais ne
copient pas les données existantes de `db.sqlite3` vers Neon.

Avant la première migration distante, contrôler la cible avec
`python manage.py check` et `python manage.py showmigrations`, puis prévoir une
sauvegarde et une procédure distincte si les données SQLite doivent être
transférées.

## API d'authentification

- `GET /api/auth/csrf/` — initialise le cookie CSRF et fournit le jeton masqué.
- `GET /api/auth/session/` — retourne le profil minimal de l'utilisateur connecté (401 si la session est absente).
- `POST /api/auth/register/` — crée un compte après validation côté serveur.
- `POST /api/auth/login/` — ouvre une session Django et retourne le rôle du compte pour orienter l'utilisateur vers son espace.
- `POST /api/auth/logout/` — ferme la session.
- `POST /api/auth/password-reset/` — envoie un email de récupération sans
  révéler si l'adresse correspond à un compte.
- `POST /api/auth/password-reset/confirm/` — valide le jeton temporaire et
  enregistre le nouveau mot de passe.

Le navigateur conserve la session dans un cookie HTTP-only. Les appels
inter-origines utilisent les cookies et le jeton CSRF. Les tentatives de
connexion et de récupération sont limitées avec le cache Django : configurer un
cache partagé en production pour appliquer les limites entre tous les processus.
Les emails sont écrits dans le terminal en développement ; configurer SMTP avant
d'activer la récupération de mot de passe en production.

## Catalogue étudiant des formations

Les ressources présentées dans l'espace étudiant sont gérées dans
l'administration Django (`/admin/`) avec le modèle `TrainingResource`.
Enregistrer une ressource comme brouillon la masque du catalogue; activer
« Publié » la rend disponible aux comptes étudiants. Le lien externe est
facultatif.

- `GET /api/student/trainings/` — renvoie les ressources publiées aux étudiants
  connectés. La recherche, le filtre `category`, la page `page` et la taille
  `pageSize` sont exécutés côté serveur.
- Les inscriptions et le suivi de progression ne sont pas encore pris en charge.
