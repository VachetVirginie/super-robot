# SportMotiv – Plan de développement

## 1. Vision du projet

SportMotiv est une PWA mobile-first qui aide les personnes à :

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
- [ ] Auth Supabase (magic link) côté frontend
- [ ] Tables de base :
  - [ ] `profiles` (info utilisateur, fuseau horaire)
  - [ ] `sports` / `user_sports` (multi-sport)
  - [ ] `sessions` (séances réalisées)
  - [ ] `goals` (objectif de séances / semaine)
  - [ ] `notification_settings` (créneaux, fréquence max)
- [ ] Écran "Aujourd'hui" (objectif + bouton "J'ai fait une séance")
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
- [ ] Auth Supabase (à ajouter)
- [ ] Tables métier (profils, objectifs, séances, routines, social).

---

## 4. Prochaines étapes proposées

Ordre recommandé pour continuer le développement :

1. **Phase 1 – Base utilisateur et suivi simple**
   - [ ] Ajouter l'auth Supabase (magic link) dans le frontend.
   - [ ] Créer les tables `profiles`, `sports`, `user_sports`, `sessions`, `goals`, `notification_settings`.
   - [ ] Lier `push_subscriptions` à `user_id` (quand connecté).
   - [ ] Construire l'écran "Aujourd'hui" connecté à Supabase.
   - [ ] Construire un premier écran "Progression".
   - [ ] Implémenter une Edge Function d'envoi de notifications de rappel.

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
