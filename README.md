# Plateforme SaaS de suivi orthophonique --- Documentation du projet

> Document de référence du produit et du développement.\
> Statut : **MVP en phase de cadrage --- les décisions explicitement
> marquées « à valider » ne sont pas encore définitives.**\
> Nom commercial : à définir.

------------------------------------------------------------------------

## 1. Vision du produit

Construire une plateforme SaaS destinée aux cabinets d'orthophonie, au
Maroc dans un premier temps, qui relie trois espaces :

1.  **Espace Cabinet** : gestion du cabinet, des patients, des
    responsables légaux, des rendez-vous, des dossiers thérapeutiques,
    des objectifs, des plans et des séances.
2.  **Studio thérapeutique** : bibliothèque d'activités interactives
    utilisables pendant les séances au cabinet et, lorsqu'elles sont
    adaptées, à domicile.
3.  **Portail Famille / Patient** : espace simple permettant au parent
    ou au patient adulte de consulter les informations partagées, lancer
    les activités assignées et suivre leur réalisation.

Une quatrième interface est nécessaire :

4.  **Espace Platform Owner** : interface privée du propriétaire de la
    plateforme pour créer et administrer les cabinets, créer les comptes
    `Cabinet Admin`, gérer les offres, abonnements et paiements.

### Promesse centrale

Aider l'orthophoniste à organiser son cabinet, structurer le suivi
thérapeutique, utiliser des activités interactives et assurer la
continuité du travail entre le cabinet et le domicile.

### Principes produit

-   L'orthophoniste reste responsable de l'évaluation, des objectifs et
    des décisions thérapeutiques.
-   La plateforme fournit des outils d'organisation et d'exécution ;
    elle ne pose pas de diagnostic et ne remplace pas le jugement
    clinique.
-   Une activité est un contenu réutilisable ; son utilisation dans une
    séance ou son affectation à domicile sont deux contextes distincts.
-   Le portail famille doit être beaucoup plus simple que l'espace
    professionnel.
-   Les informations internes du dossier thérapeutique ne sont pas
    automatiquement visibles par la famille.
-   Le MVP privilégie un petit nombre d'activités fiables et vérifiées
    plutôt qu'une grande bibliothèque superficielle.
-   Le produit doit être utilisable sur ordinateur, tablette et
    téléphone.
-   Les données de chaque cabinet doivent être strictement isolées.

------------------------------------------------------------------------

## 2. Décisions produit retenues

Les décisions suivantes reprennent les choix validés par le fondateur.

  -----------------------------------------------------------------------
  Sujet                               Décision retenue
  ----------------------------------- -----------------------------------
  Population                          Enfants et adultes

  Organisation des activités          Une bibliothèque commune ; une
                                      activité peut être utilisée au
                                      cabinet et à domicile si
                                      l'orthophoniste la juge adaptée

  Connexion famille                   Téléphone + mot de passe pour le
                                      MVP

  Objectifs et plan thérapeutique     Définis par l'orthophoniste ; la
                                      plateforme peut fournir des outils
                                      d'aide, sans imposer de plan
                                      automatique

  Comptes enfants                     Le parent/responsable légal se
                                      connecte ; les enfants sont des
                                      profils patients liés à son compte,
                                      sans identifiants personnels
                                      obligatoires

  Plusieurs enfants                   Un même responsable peut être lié à
                                      plusieurs patients

  Espace professionnel                Dashboard séparé du portail famille

  Administration SaaS                 Espace Platform Owner distinct de
                                      l'espace Cabinet

  Cabinet Admin                       Compte principal du cabinet, avec
                                      toutes les permissions du cabinet
                                      et protégé contre la
                                      suppression/désactivation

  Rôles                               Cabinet Admin peut créer des rôles
                                      personnalisés, attribuer des
                                      permissions et affecter des rôles
                                      aux utilisateurs

  Permissions UI                      Les pages, menus, boutons et
                                      actions sont affichés selon les
                                      permissions

  Sécurité                            Les permissions doivent aussi être
                                      vérifiées côté serveur ; masquer un
                                      bouton ne suffit pas

  Base de données                     MySQL ou solution compatible MySQL
                                      ; fournisseur exact à valider

  Langage                             JavaScript, sans TypeScript pour le
                                      MVP

  Framework                           Next.js avec App Router

  Base de données ORM                 Prisma envisagé

  Hébergement initial                 Vercel pour prototype/démo, sous
                                      réserve des conditions
                                      d'utilisation

  Schéma DB                           Ne pas créer les tables avant
                                      validation du modèle de données et
                                      des relations
  -----------------------------------------------------------------------

### Décisions encore à valider

-   Nom de marque, logo et identité visuelle définitive.
-   Fournisseur MySQL compatible et région d'hébergement.
-   Solution d'authentification et procédure de récupération du compte.
-   Modèle exact d'accès des patients adultes : accès personnel ou accès
    par responsable/aidant.
-   Politique de partage des notes, résultats et rapports avec la
    famille.
-   Fournisseur de paiement et moyens de paiement adaptés au Maroc.
-   Formalités CNDP, rôles juridiques et éventuel transfert
    international des données.
-   Périmètre exact des premières activités et validation de leur
    contenu par des orthophonistes.

------------------------------------------------------------------------

## 3. Types d'utilisateurs et espaces

### 3.1 Platform Owner --- propriétaire de la plateforme

Utilisateur qui administre le SaaS dans son ensemble. Son compte est
distinct de tout compte de cabinet.

Fonctions MVP :

-   Dashboard globale de la plateforme.
-   Créer un cabinet.
-   Créer le compte principal `Cabinet Admin` du cabinet.
-   Modifier les informations administratives d'un cabinet.
-   Activer, suspendre ou désactiver un cabinet selon les règles
    définies.
-   Créer et gérer les plans tarifaires.
-   Créer, modifier et consulter les abonnements.
-   Enregistrer et consulter les paiements.
-   Consulter l'état des abonnements : trialing, active, past_due,
    canceled, expired (les états exacts seront définis dans le modèle).
-   Consulter l'historique des paiements et des changements
    d'abonnement.
-   Consulter les indicateurs globaux nécessaires à l'exploitation.

Règles de sécurité :

-   L'accès Platform Owner doit être contrôlé côté serveur.
-   Un utilisateur de cabinet ne doit jamais accéder à l'espace Platform
    Owner.
-   Les opérations sensibles doivent être journalisées.
-   Ne jamais se fier uniquement à un champ ou à un menu côté navigateur
    pour autoriser une opération.

### 3.2 Cabinet Admin --- administrateur principal du cabinet

Chaque cabinet possède un compte principal `Cabinet Admin`.

Règles :

-   Créé lors de la création du cabinet par le Platform Owner, ou via un
    processus d'invitation sécurisé à définir.
-   Possède toutes les permissions du cabinet.
-   Ne peut pas être supprimé, désactivé ou rétrogradé par les
    utilisateurs du cabinet.
-   Peut créer et modifier des rôles personnalisés.
-   Peut attribuer des permissions aux rôles.
-   Peut inviter, activer, désactiver et affecter des rôles aux membres
    du cabinet.
-   Peut gérer les paramètres du cabinet.

La protection du compte doit exister dans les règles métier et côté
serveur, pas uniquement dans l'interface.

### 3.3 Membres du cabinet

Exemples possibles : orthophoniste, assistant administratif, secrétaire,
collaborateur.

-   Un membre est rattaché à un cabinet.
-   Il reçoit un ou plusieurs rôles selon le modèle retenu.
-   Il ne voit que les pages et données autorisées.
-   Toute opération protégée doit vérifier l'autorisation côté serveur.
-   Les rôles sont personnalisables ; ne pas coder en dur uniquement «
    secrétaire » ou « orthophoniste ».

### 3.4 Parent / responsable légal

-   Se connecte avec son numéro de téléphone et son mot de passe.
-   Peut être lié à plusieurs patients/enfants.
-   Choisit le patient dont il souhaite consulter le programme.
-   Consulte les rendez-vous et les informations explicitement
    partagées.
-   Consulte les activités assignées.
-   Lance les activités et aide l'enfant selon les consignes.
-   Consulte l'historique et les résultats rendus visibles par
    l'orthophoniste.
-   Ne peut pas modifier les objectifs ou le plan thérapeutique.

### 3.5 Patient

Le patient peut être un enfant ou un adulte.

-   Un patient possède un dossier propre.
-   Pour un enfant, le dossier est lié à un ou plusieurs responsables
    légaux selon les règles de consentement et d'autorisation.
-   Pour un adulte, le modèle doit permettre un accès personnel ou un
    responsable autorisé ; le choix exact reste à valider.
-   Un patient n'a pas nécessairement besoin d'un compte utilisateur
    indépendant dans le MVP.

------------------------------------------------------------------------

## 4. Modules fonctionnels du MVP

### 4.1 Espace Cabinet

#### Dashboard

-   Rendez-vous du jour et à venir.
-   Nombre de patients actifs.
-   Séances terminées et à venir.
-   Rappels de suivi.
-   Programmes à domicile en attente de revue.
-   Raccourcis vers les tâches courantes.

Éviter les tableaux de bord financiers ou analytiques complexes au
début.

#### Gestion des patients et responsables

-   Créer, consulter, modifier et archiver un patient.
-   Créer ou rattacher un responsable légal.
-   Lier plusieurs patients à un même responsable.
-   Gérer les coordonnées de contact.
-   Rechercher et filtrer les patients.
-   Distinguer les informations administratives des informations
    thérapeutiques.

Informations minimales proposées : - Nom du patient. - Date de naissance
ou âge (préférer la date de naissance si nécessaire au calcul de l'âge ;
ne pas stocker les deux sans raison). - Type de patient :
enfant/adulte. - Responsable(s) lié(s), si applicable. - Téléphone du
responsable. - Date de début du suivi. - Statut : actif, en pause,
archivé.

Ne collecter que les données réellement nécessaires. Les données
cliniques et sensibles doivent être séparées logiquement et protégées.

#### Dossier thérapeutique

-   Motif de consultation / raison de suivi.
-   Informations d'évaluation initiale.
-   Notes professionnelles privées.
-   Objectifs thérapeutiques.
-   Plan thérapeutique.
-   Historique des séances.
-   Activités utilisées et résultats.
-   Documents ou pièces jointes uniquement si le besoin est confirmé et
    si le stockage sécurisé est prêt.
-   Résumés ou rapports partageables avec la famille, choisis par
    l'orthophoniste.

#### Objectifs et plan

-   L'orthophoniste crée et modifie les objectifs.
-   Chaque objectif peut avoir un statut, une date de début, une date de
    révision et des critères de suivi.
-   Le plan explique les approches ou étapes envisagées.
-   Les objectifs peuvent évoluer avec le suivi.
-   Aucun diagnostic ou objectif thérapeutique ne doit être généré
    automatiquement par le logiciel.

#### Rendez-vous

-   Créer, modifier, annuler et consulter un rendez-vous.
-   Associer le rendez-vous à un patient et à un professionnel si le
    cabinet compte plusieurs professionnels.
-   Gérer date, heure, durée, statut et notes administratives.
-   Vue calendrier et liste.
-   Prévenir les conflits de rendez-vous selon la règle métier qui sera
    décidée.
-   Les rappels SMS/WhatsApp automatiques sont hors MVP initial, sauf
    validation d'un besoin prioritaire.

#### Séances

-   Créer une séance à partir d'un rendez-vous ou indépendamment.
-   Associer le patient et les objectifs travaillés.
-   Sélectionner les activités.
-   Enregistrer les observations et résultats.
-   Marquer présence/absence.
-   Terminer la séance et conserver son historique.
-   Préparer la prochaine séance.

### 4.2 Studio thérapeutique interactif

La bibliothèque est commune. Un même modèle d'activité peut être utilisé
dans une séance au cabinet et être affecté à domicile.

Types d'activités candidates : - Identification et discrimination de
sons. - Articulation et répétition. - Dénomination d'images. -
Vocabulaire et catégorisation. - Association image/mot. - Construction
de phrases. - Compréhension. - Séquençage d'images et narration.

Le choix des premières activités doit être validé avec 3 à 5
orthophonistes. Le MVP vise environ 10 à 15 activités de qualité,
révisées par des professionnels, et non des centaines d'activités.

Chaque activité devrait décrire : - Nom, consigne et description. -
Domaine thérapeutique. - Tranche d'âge ou public indicatif si validé. -
Niveau de difficulté. - Médias nécessaires (images, audio). - Mode
d'interaction. - Paramètres configurables. - Compatibilité
cabinet/domicile. - Méthode de collecte des résultats. - Auteur, version
et statut de validation du contenu.

Ne pas confondre : - **Activity Template** : modèle réutilisable de la
bibliothèque. - **Activity Assignment** : affectation personnalisée à un
patient. - **Activity Attempt / Result** : exécution et résultat d'une
activité. - **Session Activity** : utilisation d'une activité pendant
une séance.

Ne pas copier le modèle d'activité à chaque affectation. Les paramètres
propres à l'affectation doivent être conservés séparément.

L'activité peut être exécutée au cabinet ou à domicile, mais les
résultats des deux contextes doivent être identifiables. Un résultat à
domicile ne doit pas être présenté automatiquement comme une évaluation
clinique.

### 4.3 Programme thérapeutique à domicile

-   L'orthophoniste choisit les activités de la bibliothèque.
-   Il les affecte à un patient.
-   Il définit une période, une fréquence ou un nombre de répétitions.
-   Il ajoute des consignes adaptées à la famille.
-   Il décide si le résultat est visible par la famille et s'il
    nécessite une revue professionnelle.
-   Le programme apparaît dans le portail famille.
-   Le parent aide le patient à lancer et réaliser les activités.
-   Le système enregistre la réalisation, la date, les tentatives et les
    résultats disponibles.
-   L'orthophoniste consulte les réalisations avant ou pendant la séance
    suivante.
-   L'orthophoniste peut modifier, suspendre ou terminer le programme.

### 4.4 Portail Famille / Patient

Interface mobile-first, simple et sans fonctions professionnelles
complexes.

-   Connexion téléphone + mot de passe.
-   Choix du patient associé au compte.
-   Accueil avec activités à faire.
-   Consultation du programme à domicile.
-   Instructions de l'orthophoniste.
-   Lancement des activités.
-   Confirmation de réalisation.
-   Historique des activités.
-   Rendez-vous passés et à venir.
-   Résumé de progrès explicitement partagé.
-   Paramètres du compte et déconnexion.

Ne pas afficher par défaut : - Notes internes du professionnel. -
Informations cliniques non destinées à la famille. - Dossiers d'autres
patients. - Résultats non validés ou non partagés.

### 4.5 Espace Platform Owner

-   Dashboard globale.
-   Gestion des cabinets.
-   Création des cabinets.
-   Création et gestion du `Cabinet Admin`.
-   Gestion des plans.
-   Gestion des abonnements.
-   Enregistrement et consultation des paiements.
-   Historique des paiements.
-   États et dates d'abonnement.
-   Suspension/réactivation selon règles définies.
-   Journal des opérations administratives importantes.

Pour le premier MVP, la gestion des paiements peut commencer par
l'enregistrement manuel d'un paiement et de sa référence. L'intégration
d'une passerelle de paiement marocaine sera une étape séparée après
étude des prestataires, frais, contrats et exigences légales.

------------------------------------------------------------------------

## 5. Workflow principal

### 5.1 Parcours d'un nouveau patient

1.  Un membre autorisé crée ou sélectionne le responsable légal.
2.  Il crée le profil patient.
3.  Il renseigne les informations administratives minimales.
4.  L'orthophoniste ouvre le dossier thérapeutique.
5.  Il réalise l'évaluation et ajoute ses observations.
6.  Il définit les objectifs et le plan.
7.  Il planifie une séance.

### 5.2 Parcours d'une séance

1.  Ouvrir le rendez-vous ou créer une séance.
2.  Confirmer la présence.
3.  Sélectionner les objectifs travaillés.
4.  Lancer une ou plusieurs activités.
5.  Enregistrer les observations et résultats.
6.  Terminer la séance.
7.  Décider si un programme à domicile est utile.

### 5.3 Parcours domicile

1.  L'orthophoniste sélectionne des activités existantes.
2.  Il crée une affectation propre au patient.
3.  Il définit les consignes, la période et la fréquence.
4.  Le parent se connecte au portail.
5.  Il choisit le patient.
6.  Il lance les activités assignées.
7.  Le système enregistre les tentatives et la réalisation.
8.  L'orthophoniste consulte les données et décide de la suite.

### 5.4 Parcours de création d'un cabinet

1.  Le Platform Owner crée le cabinet.
2.  Il crée ou invite le `Cabinet Admin`.
3.  Le compte principal reçoit un moyen d'accès sécurisé.
4.  Le Cabinet Admin complète les informations du cabinet.
5.  Il crée les membres et les rôles.
6.  Il configure les permissions.

------------------------------------------------------------------------

## 6. Règles de permissions et de multi-tenancy

-   Chaque ressource appartenant à un cabinet doit être liée à un
    identifiant de cabinet.
-   Chaque requête doit être limitée au cabinet courant côté serveur.
-   Ne jamais accepter aveuglément un `clinicId` envoyé par le
    navigateur.
-   L'appartenance au cabinet doit être vérifiée avant lecture,
    modification, export ou suppression.
-   Les permissions doivent être contrôlées côté serveur sur chaque
    opération.
-   Le frontend utilise les permissions pour adapter menus, pages et
    boutons, mais le frontend n'est pas la frontière de sécurité.
-   Le `Cabinet Admin` ne peut pas être supprimé, désactivé ou
    rétrogradé par un membre du cabinet.
-   Les opérations Platform Owner sont distinctes des permissions du
    cabinet.
-   Les accès aux fichiers doivent être privés et autorisés côté
    serveur.
-   Les changements sensibles doivent être journalisés.

Le modèle exact des utilisateurs, memberships, rôles et permissions sera
défini avant la création des migrations.

------------------------------------------------------------------------

## 7. Architecture technique envisagée

### Stack de départ

  -----------------------------------------------------------------------
  Couche                              Choix envisagé
  ----------------------------------- -----------------------------------
  Langage                             JavaScript (pas TypeScript pour le
                                      MVP)

  Framework                           Next.js App Router

  UI                                  React

  Styling                             Tailwind CSS

  Composants                          shadcn/ui, après validation de
                                      compatibilité et personnalisation

  Backend                             Next.js Route Handlers et Server
                                      Actions selon le cas

  Validation                          Zod

  Formulaires                         React Hook Form

  ORM                                 Prisma

  Base de données                     MySQL ou service compatible MySQL

  Hébergement prototype               Vercel Hobby, uniquement dans les
                                      limites de ses conditions
                                      d'utilisation

  Fichiers privés                     Cloudflare R2 à étudier lorsque les
                                      fichiers deviennent nécessaires

  Tests                               Vitest et Playwright, à introduire
                                      progressivement
  -----------------------------------------------------------------------

### Base de données

MySQL est le choix privilégié du fondateur. PostgreSQL n'est pas
obligatoire.

TiDB Cloud Starter est une option candidate compatible avec le protocole
MySQL, mais le fournisseur n'est pas encore définitivement choisi. Avant
de le retenir : - vérifier la compatibilité des fonctionnalités
nécessaires ; - vérifier les limites de la formule gratuite et les
règles de suspension ; - vérifier la région et les conditions de
transfert des données ; - tester Prisma, les transactions, les
contraintes et les migrations ; - ne pas y stocker de vraies données de
santé avant validation juridique et sécurité.

### Hébergement et coût

Le but est de réduire les coûts de développement et de démonstration. «
Gratuit à 100 % » ne doit pas être considéré comme une garantie pour un
SaaS commercial.

-   Vercel Hobby est destiné à un usage personnel/non commercial selon
    ses conditions ; réévaluer le plan avant toute exploitation
    commerciale.
-   Les plans gratuits des bases de données peuvent avoir des limites de
    stockage, calcul, connexions, disponibilité ou inactivité.
-   Les services de stockage et d'envoi de SMS/WhatsApp peuvent devenir
    payants.
-   Ne jamais promettre une disponibilité ou une conformité
    réglementaire sur la seule base d'une formule gratuite.

### Authentification

Choisir une solution compatible avec Next.js, Prisma et MySQL après un
petit prototype technique. Exigences : - sessions sécurisées ; - mots de
passe hachés avec un algorithme adapté ; - protection contre les
tentatives répétées ; - récupération du compte ; - séparation des
espaces Platform Owner, Cabinet et Famille ; - contrôle d'accès côté
serveur.

Le login famille retenu pour le MVP est téléphone + mot de passe. La
vérification du numéro et la récupération du compte doivent être conçues
séparément ; ne pas prétendre qu'un numéro est vérifié sans mécanisme
réel.

------------------------------------------------------------------------

## 8. Identité visuelle et UX

### Palettes validées pour le MVP

Les deux palettes ci-dessous sont fournies par le fondateur. La palette
Professional est appliquée par défaut ; Family est activée avec
`.family-theme`. Les échelles complètes sont aussi enregistrées dans
`tailwind.config.js`.

#### Professional — Platform Owner, Cabinet, authentification et public

| Échelle | 100 | 200 | 300 | 400 | 500 / défaut | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `space_indigo` | `#07070c` | `#0d0d17` | `#141423` | `#1b1b2f` | `#22223b` | `#40406f` | `#6060a3` | `#9595c2` | `#cacae0` |
| `dusty_grape` | `#0f1015` | `#1e1f2a` | `#2c2f3f` | `#3b3e54` | `#4a4e69` | `#666b8f` | `#8b8fac` | `#b1b4c8` | `#d8dae3` |
| `lilac_ash` | `#1f1c1f` | `#3f383e` | `#5e535c` | `#7d6f7b` | `#9a8c98` | `#aea4ad` | `#c3bbc1` | `#d7d2d6` | `#ebe8ea` |
| `almond_silk` | `#2e1f1c` | `#5b3e38` | `#895d54` | `#ad8279` | `#c9ada7` | `#d4bdb8` | `#dececa` | `#e9dedc` | `#f4efed` |
| `parchment` | `#3f2a1e` | `#7f543d` | `#b58165` | `#d3b5a4` | `#f2e9e4` | `#f4ede9` | `#f7f1ee` | `#faf6f4` | `#fcfaf9` |

| Jeton sémantique | Valeur | Usage |
|---|---|---|
| `--primary` / `--primary-hover` | `#22223b` / `#40406f` | Actions / survol |
| `--primary-fg` | `#f2e9e4` | Texte sur l'action primaire |
| `--text` / `--text-muted` | `#22223b` / `#4a4e69` | Texte principal / secondaire |
| `--bg` / `--surface` / `--surface-soft` | `#f2e9e4` / `#fcfaf9` / `#f7f1ee` | Fond / carte / surface douce |
| `--border` / `--accent` / `--ring` | `#c9ada7` / `#9a8c98` / `#6060a3` | Bordure / décoration / focus |
| `--success` / `--warning` / `--danger` | `#195e56` / `#755912` / `#a43316` | États accessibles sur parchment |
| `--radius` | `0.75rem` | Rayon par défaut |

#### Family — portail Famille et connexion famille

| Échelle | 100 | 200 | 300 | 400 | 500 / défaut | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `charcoal_blue` | `#080e11` | `#0f1c22` | `#172b32` | `#1f3943` | `#264653` | `#3f7489` | `#609db6` | `#95bece` | `#cadee7` |
| `verdigris` | `#081f1d` | `#113f39` | `#195e56` | `#217e73` | `#2a9d8f` | `#3acbba` | `#6cd8cb` | `#9de5dc` | `#cef2ee` |
| `tuscan_sun` | `#3b2c09` | `#755912` | `#b0851a` | `#e0ad2e` | `#e9c46a` | `#edd086` | `#f1dca4` | `#f6e7c3` | `#faf3e1` |
| `sandy_brown` | `#401f04` | `#803e09` | `#c05e0d` | `#f07e22` | `#f4a261` | `#f6b681` | `#f8c8a1` | `#fbdac0` | `#fdede0` |
| `burnt_peach` | `#371107` | `#6e220f` | `#a43316` | `#db441e` | `#e76f51` | `#ec8b73` | `#f1a896` | `#f5c5b9` | `#fae2dc` |

| Jeton sémantique | Valeur | Usage |
|---|---|---|
| `--primary` / `--primary-hover` | `#217e73` / `#195e56` | Actions / survol, texte blanc |
| `--primary-fg` | `#ffffff` | Texte sur l'action primaire |
| `--text` / `--text-muted` | `#264653` / `#1f3943` | Texte principal / secondaire |
| `--bg` / `--surface` / `--surface-soft` | `#faf3e1` / `#ffffff` / `#f6e7c3` | Fond / carte / surface douce |
| `--border` / `--accent` / `--accent-2` / `--ring` | `#f8c8a1` / `#e76f51` / `#e9c46a` / `#2a9d8f` | Bordure / décoration / badge / focus |
| `--success` / `--warning` / `--danger` | `#195e56` / `#755912` / `#a43316` | États accessibles sur Tuscan Sun 900 |
| `--radius` | `1.25rem` | Rayon plus généreux |

Les contrastes des couleurs de statut sont supérieurs à 4.5:1 sur le fond
de leur palette. Pour Family, le primaire `#217e73` donne 4.89:1 avec du
texte blanc sur surface blanche. Les valeurs et noms des alias Tailwind
sont détaillés dans `docs/decisions/0001-color-palettes.md`.

### Typographie

-   Police principale : **Winky Sans**.
-   Notes manuscrites : **Playwrite HU**.
-   Traductions arabes : **Playpen Sans Arabic**.
-   Les polices sont servies localement via `next/font/google`.
-   Le texte arabe utilise la classe `.arabic-text` pour la police et la
    direction RTL locales ; l'application reste `lang="fr"` et `dir="ltr"`
    jusqu'à la phase i18n.
-   Les composants de base utilisent shadcn/ui avec Radix. Le registre
    actuel ne distribuant plus `toast`, le composant Toast local s'appuie
    directement sur la primitive Radix correspondante.

### Principes UX

-   Interface professionnelle, rassurante, calme et claire.
-   Pas de surcharge de cartes ou de graphiques.
-   Navigation latérale pour l'espace Cabinet sur desktop.
-   Navigation mobile adaptée.
-   RTL/LTR complet, pas uniquement un changement d'alignement.
-   Portail famille mobile-first, grands boutons et consignes simples.
-   Studio thérapeutique en mode concentré, avec peu de distractions.
-   États de chargement, erreur, vide et succès conçus pour chaque flux.
-   Accessibilité clavier et contrastes suffisants.
-   Les interfaces famille, cabinet et Platform Owner doivent avoir une
    hiérarchie visuelle cohérente mais des navigations distinctes.

### Design system à créer avant les modules métier

-   Tokens couleurs, typographie, espacements, rayons, ombres.
-   Boutons et variantes.
-   Inputs, selects, textareas.
-   Dialogs et drawers.
-   Tables et listes.
-   Badges de statut.
-   Cards et panneaux.
-   Dropdowns et menus.
-   Toasts et messages d'erreur.
-   Skeletons et états vides.
-   Navigation et breadcrumbs.
-   Composants RTL/LTR.

------------------------------------------------------------------------

## 9. Organisation des dossiers proposée

À confirmer lors de la phase de scaffolding. Ne pas créer tous les
fichiers métier vides sans nécessité.

``` text
project/
├── public/
│   ├── images/
│   └── icons/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── (platform)/
│   │   ├── (cabinet)/
│   │   ├── (family)/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── shared/
│   │   └── layouts/
│   ├── features/
│   │   ├── authentication/
│   │   ├── platform/
│   │   ├── clinics/
│   │   ├── users/
│   │   ├── roles-permissions/
│   │   ├── patients/
│   │   ├── guardians/
│   │   ├── appointments/
│   │   ├── clinical-records/
│   │   ├── goals-plans/
│   │   ├── sessions/
│   │   ├── activities/
│   │   ├── home-programs/
│   │   ├── family-portal/
│   │   └── subscriptions/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── permissions/
│   │   ├── validation/
│   │   └── utils/
│   ├── config/
│   └── styles/
├── prisma/
│   └── schema.prisma
├── tests/
│   ├── unit/
│   └── e2e/
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── database/
│   ├── workflows/
│   └── decisions/
├── .env.example
├── .gitignore
├── README.md
└── GIT_WORKFLOW.md
```

Règles : - Les composants réutilisables vont dans `components`. - La
logique d'un domaine métier reste dans son dossier `features`. - Les
pages Next.js orchestrent l'interface et appellent les fonctions métier
; éviter d'y mettre toute la logique. - Les secrets restent dans les
variables d'environnement et ne sont jamais commités. - `docs/` conserve
les décisions durables. - Le schéma Prisma reste minimal jusqu'à
validation du modèle relationnel.

------------------------------------------------------------------------

## 10. Roadmap de développement

Chaque phase doit être développée dans une branche dédiée, testée,
revue, puis fusionnée dans `develop`. Une version stable est ensuite
fusionnée dans `main` et taguée.

### Phase 0 --- GitHub et fondations du projet

-   Créer le repository GitHub privé.
-   Créer `main` et `develop`.
-   Ajouter README et guide Git.
-   Ajouter `.gitignore` et `.env.example`.
-   Configurer les protections de branches si disponibles.
-   Vérifier le premier push et le clonage.

**Livrable :** repository propre et stratégie Git opérationnelle.

### Phase 1 --- Initialisation technique

-   Créer l'application Next.js avec JavaScript.
-   Vérifier le démarrage local et le build.
-   Installer Tailwind CSS.
-   Ajouter les composants UI de base.
-   Configurer les alias d'import et les scripts.
-   Ne pas connecter encore la base de données.

**Livrable :** application Next.js propre qui démarre et se construit.

### Phase 2 --- Identité visuelle et structure UI

-   Valider la palette, les polices et le logo provisoire.
-   Configurer RTL/LTR et langues.
-   Créer les tokens et composants de base.
-   Créer les layouts vides Platform Owner, Cabinet et Famille.
-   Construire les navigations et les pages placeholders.
-   Tester responsive et accessibilité de base.

**Livrable :** squelette UI cohérent, sans logique métier lourde.

### Phase 3 --- Analyse métier et conception de la base de données

-   Décrire les entités.
-   Définir les relations et cardinalités.
-   Définir les règles de suppression et d'archivage.
-   Définir les états et transitions.
-   Définir l'isolation multi-tenant.
-   Construire ERD et dictionnaire de données.
-   Vérifier le modèle avec les workflows.
-   Faire valider le schéma par le fondateur avant migrations.

**Important : aucune migration métier ni création de tables avant
validation explicite.**

### Phase 4 --- Base de données et couche d'accès

-   Choisir définitivement le fournisseur MySQL.
-   Configurer Prisma.
-   Écrire le schéma validé.
-   Créer les migrations initiales.
-   Ajouter les seeds uniquement nécessaires.
-   Tester les relations, contraintes, transactions et isolation.

### Phase 5 --- Authentification et sécurité des espaces

-   Authentification Platform Owner.
-   Authentification des membres du cabinet.
-   Authentification téléphone + mot de passe pour la famille.
-   Sessions et récupération de compte.
-   Middleware ou contrôles serveur appropriés.
-   Tests d'accès croisé entre cabinets.

### Phase 6 --- Gestion des cabinets et permissions

-   Création d'un cabinet par Platform Owner.
-   Création du Cabinet Admin.
-   Protection du compte principal.
-   Membres du cabinet.
-   Rôles personnalisés.
-   Permissions granulaires.
-   Vérification serveur de chaque permission.
-   Menus et boutons conditionnés par les permissions.

### Phase 7 --- Patients et responsables

-   Gestion des responsables.
-   Gestion des patients enfants et adultes.
-   Liaison parent-patient.
-   Plusieurs patients par responsable.
-   Recherche, consultation, modification, archivage.
-   Tests d'isolation.

### Phase 8 --- Rendez-vous et dashboard Cabinet

-   Calendrier.
-   Création et gestion des rendez-vous.
-   Statuts et présence.
-   Dashboard quotidienne.
-   Gestion des conflits selon les règles validées.

### Phase 9 --- Dossier thérapeutique et séances

-   Évaluations et observations.
-   Objectifs.
-   Plans thérapeutiques.
-   Séances.
-   Notes professionnelles.
-   Historique et résultats.

### Phase 10 --- Bibliothèque et Studio thérapeutique

-   Modèle d'activité.
-   Premières activités validées professionnellement.
-   Interface d'exécution.
-   Paramètres de difficulté.
-   Enregistrement des tentatives et résultats.
-   Utilisation pendant une séance.

### Phase 11 --- Programmes à domicile et portail famille

-   Affectations d'activités.
-   Fréquence et période.
-   Instructions.
-   Portail famille.
-   Exécution à domicile.
-   Historique et résultats.
-   Partage contrôlé des informations.

### Phase 12 --- Platform Owner : plans, abonnements et paiements

-   Gestion des plans.
-   Création et suivi des abonnements.
-   Périodes d'essai.
-   Enregistrement des paiements.
-   Historique et états.
-   Suspension/réactivation.
-   Intégration de paiement en ligne seulement après validation du
    prestataire.

### Phase 13 --- Qualité, conformité et déploiement pilote

-   Tests unitaires et end-to-end.
-   Revue des permissions et isolation.
-   Sauvegardes et restauration.
-   Gestion des erreurs et logs.
-   Protection des fichiers.
-   Politique de conservation et suppression.
-   Documentation utilisateur.
-   Validation des formalités CNDP et transferts éventuels.
-   Pilote avec données réelles uniquement après validation juridique et
    sécurité.

------------------------------------------------------------------------

## 11. Confidentialité, sécurité et réglementation

Le produit peut traiter des données de santé, des données de mineurs,
des coordonnées familiales et éventuellement des enregistrements audio.
Ces données nécessitent une approche stricte.

Avant tout usage avec de vrais patients : - Clarifier les rôles du
cabinet et de l'éditeur SaaS. - Vérifier les formalités applicables
auprès de la CNDP. - Vérifier les règles relatives aux données de santé
et aux mineurs. - Vérifier les formalités de transfert si des données
sont hébergées hors du Maroc. - Préparer les contrats et clauses de
sous-traitance nécessaires. - Définir la base légale, les consentements
et les droits des personnes. - Définir une politique de conservation et
de suppression. - Utiliser des données fictives pour le développement et
les démos. - Éviter l'enregistrement audio dans la toute première
version tant que le besoin, le consentement, la sécurité et le cadre
légal ne sont pas validés.

Mesures techniques à prévoir : - HTTPS. - Hashage sécurisé des mots de
passe. - Contrôle d'accès côté serveur. - Isolation stricte par
cabinet. - Validation des entrées. - Protection contre les attaques
courantes. - Journalisation des actions sensibles. - Sauvegardes
testées. - Fichiers privés et URLs signées à durée limitée si stockage
externe. - Pas de données sensibles dans les logs. - Secrets uniquement
dans les variables d'environnement.

Ce document ne remplace pas un avis juridique. Ne pas présenter
l'utilisation d'un fournisseur cloud comme une preuve automatique de
conformité.

------------------------------------------------------------------------

## 12. Règles de travail avec un assistant IA

Tout assistant IA intervenant sur ce projet doit respecter ces règles :

1.  Lire ce README et `GIT_WORKFLOW.md` avant de commencer une tâche
    importante.
2.  Ne pas modifier le périmètre MVP sans demander l'accord du
    fondateur.
3.  Ne pas créer de tables ou migrations avant validation explicite du
    schéma.
4.  Ne pas inventer l'état du repository, des fichiers ou des commandes.
5.  Avant de modifier du code, inspecter les fichiers existants.
6.  Travailler sur une seule tâche/branche à la fois.
7.  Préférer une solution simple, maintenable et peu coûteuse.
8.  Ne pas ajouter de dépendance sans expliquer son utilité.
9.  Ne pas introduire TypeScript sans décision explicite.
10. Ne pas ajouter de microservices, Redis ou architecture complexe au
    MVP sans besoin démontré.
11. Vérifier les permissions côté serveur.
12. Respecter l'isolation des données de chaque cabinet.
13. Écrire ou mettre à jour les tests pertinents.
14. Exécuter les vérifications disponibles avant de déclarer une tâche
    terminée.
15. Résumer les fichiers modifiés, les commandes exécutées, les tests
    passés et les limites restantes.
16. Ne jamais prétendre qu'un test, un push ou un déploiement a réussi
    sans résultat vérifiable.
17. Mettre à jour les documents de `docs/` lorsqu'une décision durable
    change.

### Format attendu à la fin de chaque tâche IA

-   Objectif réalisé.
-   Fichiers créés/modifiés.
-   Décisions prises.
-   Commandes exécutées.
-   Tests et résultats.
-   Points non terminés.
-   Prochaine petite tâche recommandée.
-   Instructions Git pour commit/push/merge (sans exécuter ces
    opérations sans autorisation).

------------------------------------------------------------------------

## 13. Définition de « terminé » pour une phase

Une phase n'est terminée que si : - son périmètre est respecté ; - le
code est cohérent avec l'architecture ; - les erreurs importantes sont
traitées ; - les tests pertinents passent ; - aucune donnée secrète
n'est commitée ; - les permissions et l'isolation sont vérifiées si la
phase les concerne ; - la documentation est mise à jour ; - le fondateur
a vérifié le résultat ; - la branche est fusionnée selon
`GIT_WORKFLOW.md`.

------------------------------------------------------------------------

## 14. Première tâche à exécuter

**Ne pas commencer par la base de données.**

Ordre de démarrage : 1. Créer le repository GitHub privé. 2. Préparer
`main` et `develop`. 3. Ajouter ce README et `GIT_WORKFLOW.md`. 4. Créer
le projet Next.js en JavaScript. 5. Vérifier que l'application démarre
et que le build fonctionne. 6. Mettre en place l'organisation des
dossiers. 7. Valider la direction visuelle et les polices. 8. Construire
les composants UI et les trois layouts principaux. 9. Ensuite seulement,
analyser les entités et concevoir l'ERD. 10. Attendre la validation du
fondateur avant toute migration.

**Prochaine étape :** créer le repository et initialiser proprement le
projet en suivant le guide Git.

------------------------------------------------------------------------

## 15. Authentification et espace Platform Owner

L'authentification Platform Owner utilise Auth.js avec une session JWT.
Configurer les variables suivantes dans l'environnement local ou de
déploiement, sans les commiter :

- `DATABASE_URL`
- `AUTH_SECRET` (secret aléatoire fort pour signer les sessions)
- `PLATFORM_OWNER_NAME`
- `PLATFORM_OWNER_EMAIL`
- `PLATFORM_OWNER_PASSWORD` (au moins 12 caractères)

Pour le développement local, copier `.env.example` en `.env`, puis
remplacer l'URL de base de données, `AUTH_SECRET` et le mot de passe
d'exemple par vos propres valeurs. Les identifiants de `.env.example`
sont uniquement des exemples : ne pas les utiliser en production.

Après configuration de la base :

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed # crée le compte Platform Owner depuis les variables PLATFORM_OWNER_*
npm run dev
```

Connectez-vous sur `/login` avec `PLATFORM_OWNER_EMAIL` et
`PLATFORM_OWNER_PASSWORD`. Le seed crée le compte s'il n'existe pas ;
sinon, il ne change pas le mot de passe existant.

Le seed peut être relancé sans changer le mot de passe d'un compte
existant. Les pages et API sous `/owner` sont réservées aux sessions dont
`isPlatformOwner` vaut `true`. Sur Next.js 16, les contrôles de routage
utilisent le fichier `src/proxy.js` (la convention `middleware.js` est
dépréciée).
