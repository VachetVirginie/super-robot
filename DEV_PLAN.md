# Motivly – Plan de développement

## 1. Vision du projet

Motivly est une PWA mobile-first qui aide les personnes à :

- Démarrer ou reprendre le sport en douceur.
- Créer et suivre des **routines sport + bien-être** (respiration, ancrage, mini-méditations).
- Mesurer leur **progression** (objectifs atteints, régularité).
- Se **motiver entre amis** via un volet social léger.

Backend : Supabase (Auth, DB, Edge Functions, notifications push).
Frontend : Vue 3 + Vite + TypeScript, PWA avec service worker + push.

---

## 2. Phases de développement

### Phase 1 – Habitude perso (MVP de base)

Objectif : permettre à un utilisateur de créer un compte, définir un objectif simple et suivre ses séances avec des rappels push.

- [x] PWA de base (Vue 3 + TS, service worker, manifest, push front)
- [x] Enregistrement des abonnements push dans Supabase (`push_subscriptions`)
- [x] Auth Supabase (magic link) côté frontend
- [ ] Tables de base (partiellement implémentées) :
  - [x] `profiles` (info utilisateur, fuseau horaire)
  - [ ] `sports` / `user_sports` (multi-sport)
  - [x] `sessions` (séances réalisées)
  - [x] `goals` (objectif de séances / semaine)
  - [x] `notification_settings` (créneaux, fréquence max)
- [x] Écran "Aujourd'hui" (v1 : objectif + bouton "J'ai fait une séance")
- [ ] Écran "Progression" simple (sessions / semaine, état de l'objectif)
- [ ] Edge Function Supabase pour envoyer des notifications de rappel
- [ ] Cron/planification Supabase pour les rappels quotidiens/hebdo

### Phase 2 – Routines + bien-être

Objectif : accompagner l'utilisateur dans des routines structurées incluant sport + respiration/ancrage/méditation.

- [ ] Catalogue d'exercices bien-être (texte + timer)
  - [ ] Respiration (ex. cohérence cardiaque simple)
  - [ ] Ancrage (scan corporel / présence)
  - [ ] Mini-méditations (1–10 minutes)
- [ ] Modèle de données pour les routines :
  - [ ] `routines`
  - [ ] `routine_steps`
  - [ ] `routine_schedules`
- [ ] Écran "Routines" (liste de routines, activer/désactiver)
- [ ] Écran "Routine du jour" (enchaînement des étapes avec timer)
- [ ] Notifications spécifiques routines ("Ta routine du matin commence...", "Routine complétée X jours de suite")

### Phase 3 – Social et motivation entre amis

Objectif : ajouter une couche sociale légère pour se motiver en groupe.

- [ ] Modèle de données social :
  - [ ] `friends` (relations d'amitié)
  - [ ] éventuellement `boosts` (messages de motivation)
- [ ] Écran "Amis" (statut des objectifs/routines des amis)
- [ ] Action "Envoyer un boost" (déclenche une notification ciblée)
- [ ] Notifications sociales (boosts, récap hebdo entre amis)

---

## 3. État technique actuel

- [x] Projet Vite + Vue 3 + TypeScript créé.
- [x] PWA configurée :
  - [x] `manifest.webmanifest`
  - [x] `sw.js` (cache + gestion des push)
  - [x] Enregistrement du service worker dans `main.ts`.
- [x] Intégration Supabase côté frontend :
  - [x] `supabaseClient.ts` utilisant `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
  - [x] `pushNotifications.ts` (abonnement push + sauvegarde dans `push_subscriptions`).
- [x] Table `push_subscriptions` dans Supabase + policies RLS pour `anon`.
- [x] Auth Supabase (email + mot de passe pour l'instant).
- [ ] Tables métier restantes (routines, social) – `profiles`, `sessions`, `goals`, `notification_settings` déjà en place.

---

## 4. Prochaines étapes proposées

Ordre recommandé pour continuer le développement :

1. **Phase 1 – Base utilisateur et suivi simple**
   - [ ] Faire évoluer l'auth existante (email + mot de passe) vers le **magic link** si souhaité.
   - [ ] Compléter les tables `sports`, `user_sports`, `notification_settings` avancées et vérifier le schéma de `profiles`, `sessions`, `goals`.
   - [ ] Lier `push_subscriptions` à `user_id` (quand connecté).
   - [ ] Raffiner l'écran "Aujourd'hui" (UX + clean code) et le connecter complètement à Supabase.
   - [ ] Construire un premier écran "Progression".
   - [ ] Implémenter une Edge Function d'envoi de notifications de rappel.
   - [ ] Refactorer l'UI en composants Vue (`TodayDashboard`, `ProfilePage`, `NotificationsCard`, dialogs, etc.) pour respecter les principes de clean code.

2. **Phase 2 – Routines + bien-être**
   - [ ] Définir quelques routines types (débutant, matin, fin de journée).
   - [ ] Implémenter les tables de routines et écrans associés.
   - [ ] Ajouter les écrans d'exercices de respiration/ancrage/méditation (texte + timer).

3. **Phase 3 – Social**
   - [ ] Ajouter gestion des amis (`friends`).
   - [ ] Écran "Amis" et envoi de boosts.
   - [ ] Notifications sociales.

---

## 5. Idées futures (au-delà du MVP)

- Intégration de **contenus audio** pour les pratiques bien-être.
- Routines partagées / programmes de groupe.
- Intégration de données externes (météo, vent) pour adapter les suggestions de sessions.
- Gamification : badges, niveaux, défis.
- Export / partage de progression (captures, récap mensuel).

---

## 6. Comment utiliser ce document

- Mettre à jour les cases `[ ]` / `[x]` au fur et à mesure de l'avancement.
- Ajouter des sous-tâches sous chaque phase quand des détails apparaissent.
- Servir de référence rapide pour :
  - ce qui est déjà fait,
  - ce qui est en cours,
  - ce qui est prévu ensuite.

---

## 7. Parcours cible – Objectifs & planning hebdo

Ce parcours est la **vision cible** pour la création d’objectifs dans Motivly. Il n’est pas encore implémenté mais sert de boussole produit.

### 7.1 Principe

- L’utilisateur ne configure pas des objectifs abstraits, mais **planifie des moments concrets dans sa semaine**.
- Chaque "objectif" est la somme de ces moments ("créneaux") : par exemple, **3 créneaux matin** ou **2 soirs + 1 samedi matin**.
- Les objectifs par type / moment sont dérivés de ce planning, pas saisis à la main.

### 7.2 Parcours utilisateur

1. **Entrée – "Planifier ma semaine"**
   - Bouton central sur Today / Progression.
   - Ouvre un écran plein écran de planification.

2. **Étape 1 – Nombre de moments réalistes**
   - Question : "Combien de fois par semaine peux-tu te bloquer un moment pour toi ?".
   - Choix rapides : `1x / 2x / 3x / 4x / 5x+`.
   - Sert à définir un **budget de créneaux** pour la semaine.

3. **Étape 2 – Placement des créneaux dans la semaine**
   - Vue en forme de **grille semaine x moments de la journée** :
     - Lignes = jours (Lun → Dim).
     - Colonnes = moments : Matin / Après-midi / Soir.
   - L’utilisateur clique pour remplir ses créneaux jusqu’à atteindre le budget défini à l’étape 1.
   - Exemple : Lun matin, Mer soir, Sam matin.

4. **Étape 3 – Type de séance par créneau (optionnel)**
   - Pour chaque créneau sélectionné :
     - "Peu importe (bouger)"
     - "Cardio / course"
     - "Renfo"
     - "Mobilité / yoga"
     - "Routine bien-être"
   - Par défaut : "Peu importe" pour réduire la friction.

5. **Étape 4 – Récap visuel**
   - Récap sous forme de mini planning coloré.
   - Phrase en langage naturel, ex. :
     - "Cette semaine, tu te bloques **3 moments** : Lun matin (bouger), Mer soir (renfo), Sam matin (course)."
   - Bouton d’engagement : "Je m’engage pour cette semaine".

### 7.3 Modèle de données envisagé

- **`sessions`**
  - `user_id`
  - `performed_at`
  - `sport_id` (nullable)
  - `time_of_day` (`'morning' | 'afternoon' | 'evening' | null`)

- **`goals`** (objectifs stockés, dérivés du planning)
  - `user_id`
  - `per_week_sessions` (nombre de créneaux visés)
  - `sport_id` (nullable, pour les objectifs par type)
  - `time_of_day` (nullable, pour les objectifs matin / soir)
  - `is_active`

- **(Option) `user_weekly_slots`**
  - Représentation directe des créneaux choisis par l’utilisateur pour une semaine donnée (slot = jour + moment + type).

### 7.4 Logique de progression

Pour chaque objectif actif (`goals`) :

- Filtrer les `sessions` de la semaine courante en fonction :
  - du `sport_id` (si non null),
  - du `time_of_day` (si non null).
- Calculer :
  - `doneThisWeek` = nombre de séances correspondantes,
  - `progressPercent` = `doneThisWeek / per_week_sessions * 100` (0–100%),
  - un `statusLabel` en texte naturel ("Plus que 1 séance matin pour atteindre ton objectif.").

Ces données alimentent les écrans Today (résumé court) et Progression (vue plus détaillée des objectifs).
