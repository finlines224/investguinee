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
- `GET /api/investor/profile/` — retourne le profil de l’investisseur connecté.
- `PATCH /api/investor/profile/` — modifie son prénom, son nom, son téléphone,
  son type de profil et son secteur; session investisseur et jeton CSRF requis.
  L’adresse e-mail reste en lecture seule.
- `GET /api/investor/subscriptions/` — historique paginé en lecture seule,
  réservé à l’investisseur connecté (`status`, `page`, `pageSize` facultatifs).
  Les dossiers sont gérés dans l’administration Django; aucun paiement n’est
  déclenché ni simulé.
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

Pour un frontend et un backend hébergés sur des sites différents, ajouter
l’origine exacte du frontend (sans chemin) à
`DJANGO_CORS_ALLOWED_ORIGINS` et `DJANGO_CSRF_TRUSTED_ORIGINS`, par exemple
`https://investguinee.vercel.app`. Régler également
`DJANGO_CSRF_COOKIE_SAMESITE=None` et
`DJANGO_SESSION_COOKIE_SAMESITE=None`, avec `DJANGO_SECURE_COOKIES=True`.
Les valeurs `None` forcent aussi les cookies `Secure`. Le navigateur peut
toutefois bloquer les cookies tiers selon ses paramètres; un domaine frontend
et API sous le même site est préférable pour une compatibilité maximale.

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

## Tableau de bord administrateur

- `GET /api/admin/overview/` — réservé aux administrateurs connectés; renvoie
  les totaux des comptes, des projets publics publiés et des organisations,
  ainsi que le nombre de comptes par rôle.
- `GET /api/admin/users/` — liste les comptes pour les administrateurs, avec
  recherche `q`, filtres `role`/`status` et pagination. Les données de compte
  sont exposées en lecture seule dans cette étape.
- `GET /api/admin/projects/` — liste les projets pour les administrateurs,
  avec recherche `q`, filtres `status`/`sector` et pagination. Les projets sont
  consultables sans action de modération dans cette étape.
- `GET /api/admin/organizations/` — liste les organisations pour les
  administrateurs, avec recherche `q`, filtre `status` et pagination. Les
  informations de vérification sont consultables sans décision de validation
  dans cette étape.
- `GET /api/admin/access-requests/` — liste les demandes d’accès aux projets,
  avec recherche `q`, filtre `status` (`PENDING` par défaut) et pagination.
- `PATCH /api/admin/access-requests/<id>/` — approuve ou refuse une demande
  (`decision` et `reviewerNote`); réservé aux administrateurs et protégé par
  jeton CSRF. Une demande traitée ne peut pas recevoir une seconde décision.
- `GET /api/admin/trainings/` — liste les formations, y compris les brouillons,
  avec recherche `q`, filtres `status`/`category` et pagination.
- `POST /api/admin/trainings/create/` — crée une ressource (session admin et
  jeton CSRF requis).
- `PATCH /api/admin/trainings/<id>/` — modifie ou publie/dépublie une ressource
  (session admin et jeton CSRF requis).

## Demandes d’accès aux projets

Un investisseur connecté peut parcourir les projets publiés en visibilité
`MEMBERS_ONLY` ou `RESTRICTED` sans voir leur description, puis envoyer une
justification de 10 à 2 000 caractères. Une seule demande en attente ou
approuvée est possible par investisseur et projet; après un refus, une nouvelle
demande peut être déposée.

- `GET /api/investor/access-requests/projects/` — liste les projets restreints
  et les statuts de demande de l’investisseur connecté, avec recherche `q` et
  pagination.
- `GET /api/investor/access-requests/` — liste les demandes de l’investisseur,
  avec filtre `status` et pagination.
- `POST /api/investor/access-requests/` — dépose une demande avec `projectId`
  et `justification` (session investisseur et jeton CSRF requis).
- `GET /api/projects/<slug>/` — retourne la fiche d’un projet public ou celle
  d’un projet restreint uniquement à l’investisseur dont la demande est
  approuvée. Les accès approuvés ne donnent pas accès aux autres rôles.

## Rendez-vous investisseurs

Un investisseur peut demander un rendez-vous avec le porteur d’un projet publié
et accessible. Le créneau doit être futur, inclure son fuseau horaire, être
proposé par intervalles de 30 minutes, respecter un préavis d’une heure et se
situer dans les 90 jours. Les créneaux actifs d’un entrepreneur ne peuvent pas
se chevaucher.

- `GET /api/investor/appointments/` — liste les rendez-vous de l’investisseur,
  avec recherche `q`, filtre `status` et pagination.
- `POST /api/investor/appointments/` — demande un rendez-vous avec
  `projectId`, `scheduledAt` et `message` (session investisseur et jeton CSRF
  requis). Le motif doit contenir entre 10 et 2 000 caractères.
- `PATCH /api/investor/appointments/<id>/` — annule une demande encore en
  attente (`action: "cancel"`; session investisseur et jeton CSRF requis).
- `GET /api/entrepreneur/appointments/` — liste les rendez-vous de
  l’entrepreneur connecté, avec recherche, filtre et pagination.
- `PATCH /api/entrepreneur/appointments/<id>/` — confirme ou refuse une demande
  en attente (`decision`, `responseNote`; session entrepreneur et jeton CSRF
  requis).
- `GET /api/admin/appointments/` — permet aux administrateurs de consulter les
  rendez-vous avec recherche, filtre et pagination; l’administration ne décide
  pas à la place des participants.

## Messagerie privée entre investisseurs et entrepreneurs

Les conversations sont privées entre l’investisseur et le porteur d’un projet
publié auquel l’investisseur a accès. Une même paire investisseur-projet ne
crée qu’une conversation. Les administrateurs peuvent consulter les
métadonnées et le nombre de messages, mais pas le contenu des échanges.

- `GET /api/investor/conversations/` — liste les conversations de
  l’investisseur connecté, avec recherche `q` et pagination.
- `POST /api/investor/conversations/` — ouvre ou reprend la conversation du
  projet avec `projectId` et envoie le premier message `body` (session
  investisseur et jeton CSRF requis).
- `GET /api/investor/conversations/<id>/messages/` et
  `POST /api/investor/conversations/<id>/messages/` — lisent ou envoient les
  messages d’une conversation appartenant à l’investisseur.
- `GET /api/entrepreneur/conversations/` — liste les conversations de
  l’entrepreneur connecté.
- `GET /api/entrepreneur/conversations/<id>/messages/` et
  `POST /api/entrepreneur/conversations/<id>/messages/` — lisent ou envoient
  les messages d’une conversation appartenant à l’entrepreneur.
- `POST /api/conversations/<id>/read/` — marque comme lus les messages reçus
  par le participant connecté.
- `GET /api/admin/conversations/` — expose uniquement les métadonnées des
  conversations, avec recherche `q` et pagination; aucun contenu de message
  n’est retourné.

Les messages sont limités à 4 000 caractères. Les modifications requièrent un
cookie de session et un jeton CSRF.

## Notifications

Les comptes connectés reçoivent des notifications lors d’un nouveau message,
d’une demande ou réponse de rendez-vous, et d’une demande ou décision d’accès
à un projet. Les administrateurs actifs reçoivent les nouvelles demandes
d’accès. Les administrateurs peuvent envoyer une annonce à tous les comptes
actifs; son texte et son lien sont également enregistrés dans l’historique.
Les liens de notification et d’annonce sont des chemins internes à
l’application.

- `GET /api/notifications/` — liste les notifications du compte connecté, avec
  recherche `q`, filtre `status` (`all`, `unread` ou `read`) et pagination.
- `POST /api/notifications/` — marque toutes les notifications du compte
  comme lues (`action: "mark_all_read"`).
- `PATCH /api/notifications/<id>/` — marque comme lue une notification
  appartenant au compte (`action: "mark_read"`).
- `DELETE /api/notifications/<id>/` — supprime une notification appartenant au
  compte.
- `GET /api/admin/notification-broadcasts/` — consulte l’historique des
  annonces, avec recherche et pagination.
- `POST /api/admin/notification-broadcasts/` — diffuse une annonce aux comptes
  actifs avec `title`, `body` et `targetUrl` (chemin interne facultatif).

Les mutations requièrent une session et un jeton CSRF. Les comptes non
administrateurs ne peuvent ni envoyer ni consulter les annonces globales.
