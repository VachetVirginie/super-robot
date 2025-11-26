# Vision produit – Journée de boulot + sport & anti-stress

## Mission

Aider les personnes stressées et sédentaires à vivre des journées de travail plus sereines, en les aidant à bouger un peu et à faire redescendre la pression, même si elles partent de zéro en sport.

> Une app qui t’accompagne tout au long de ta journée de travail pour éviter le burn-out, en t’aidant à bouger un peu et à faire redescendre la pression, sans culpabilité.

Public cible :
- Personnes stressées au boulot (charge mentale élevée, fatigue).
- Mode de vie plutôt sédentaire, difficulté à "se mettre au sport".
- Souhait de changement réaliste, sans injonction à la performance.

Plateforme :
- Mobile-first (web + futur Capacitor), francophone.
- Offline-friendly à terme.

Business :
- V1 gratuite.
- Freemium / abonnement plus tard (contenus et fonctionnalités avancés).

---

## Expérience quotidienne – 3 moments clés + SOS

L’app structure la **journée de travail** autour de 3 moments, avec un espace spécial pour les pics de stress imprévus.

### 1. Matin – "Commencer ma journée"

Objectif : poser un *petit* plan réaliste pour soi avant que le boulot n’embarque tout.

Contenu :
- Carte principale : `Commencer ma journée`.
- Sous-texte : "On prépare un plan réaliste pour bouger cette semaine."
- Éléments :
  - Résumé du **contrat sport** (basé sur `goals.per_week_sessions`).
  - Résumé du **planning de la semaine** (basé sur `user_weekly_slots`).
  - Bouton : `Choisir mes moments` → ouvre `PlanWeekDialog`.

Esprit :
- Réalisme, pas de défi extrême.
- Tu choisis quelques moments "jouables" pour bouger.

### 2. Milieu de journée – "Ma pause du milieu de journée"

Objectif : casser le tunnel de travail avec une micro-pause utile.

Contenu :
- Carte principale : `Ma pause du milieu de journée`.
- Sous-texte : "Quelques minutes pour souffler et bouger un peu."
- Éléments :
  - Utilisation de `WellbeingCard` (bien-être du jour).
  - Bouton : `Lancer la pause` → déclenche `startWellbeingExercise` → `WellbeingPlayerDialog`.

Esprit :
- Durées courtes (2 à 10 minutes).
- Ça doit être faisable au milieu d’une journée de boulot normale.

### 3. Fin de journée – "Terminer ma journée"

Objectif : faire un point en douceur sur le stress et le mouvement.

Contenu :
- Carte `Check-in du jour` (basée sur `wellbeing_checkins` + `useCheckins`).
  - Question simple : niveau de stress 1–5.
  - Bouton : `Enregistrer mon check-in`.
  - Résumé : "Aujourd’hui, tu t’es notée à X/5." ou "Tu n’as pas encore fait ton check-in aujourd’hui."
- Carte séances / objectif (TodayDashboard + useTodayStats) :
  - "Séances aujourd’hui" / "Séances cette semaine".
  - Barre de progression vers l’objectif hebdo.
  - Boutons existants : ajouter/supprimer une séance.

Esprit :
- Aucune culpabilité si la séance n’a pas été faite.
- L’app montre où tu en es pour t’aider à décider de la suite, pas pour te juger.

### 4. Espace SOS – "Pic de stress maintenant"

Objectif : offrir un filet de sécurité quand un gros stress arrive **en dehors** des moments prévus.

Concept :
- Bouton toujours accessible sur Today : `J’ai besoin d’une pause maintenant`.
- Ouvre un mode "SOS" (dialog dédié) :
  1. L’utilisateur indique rapidement son niveau de stress (1–5).
  2. L’app propose un **kit d’urgence** :
     - 2–3 minutes de respiration guidée *ou* un exercice bien-être très court.
  3. Message de validation : "Tu viens de prendre quelques minutes pour toi en plein stress, c’est important."

Évolutions possibles :
- Enregistrer ces événements SOS dans une table dédiée (ex : `stress_events`).
- Adapter les suggestions à la fréquence des SOS + séances manquées.

---

## Ton & principes de communication

Rôle de l’app : **coach / meilleure amie**, pas contrôleur de performance.

Principes :
- Toujours parler à l’utilisateur en "tu".
- Bannir les injonctions culpabilisantes ("tu dois", "il faut absolument").
- Préférer :
  - "On peut…", "On va essayer…", "Tu peux…".
  - "Aujourd’hui" plutôt que des horizons trop lointains.
- Mettre en avant les micro-victoires :
  - "Tu as pris quelques minutes pour toi aujourd’hui.",
  - "Tu as tenu ton contrat cette semaine.",
  - "Même si la journée était difficile, tu as réussi à faire une mini-pause."

Exemples de wording :
- Motivation du jour :
  - "Tu n’as pas besoin d’être parfaite. Juste présente pour toi quelques minutes aujourd’hui."
  - "Une petite action aujourd’hui vaut mieux que le plan parfait jamais commencé."
- Check-in :
  - "Comment tu te sens en ce moment, sur une échelle de 1 à 5 ?"
- SOS :
  - "On va prendre 2 minutes ensemble. Tu n’as rien à réussir, juste à respirer."

---

## Différenciation par rapport aux autres apps

- Focus sur la **journée de travail**, pas uniquement sur le sport.
- Mélange cohérent :
  - habitudes sport (séances, objectif, planning),
  - gestion du stress (check-ins, exercices bien-être),
  - rituels quotidiens (matin / milieu / fin de journée),
  - mode SOS pour les pics de stress.
- Positionnement émotionnel :
  - anti-culpabilisation,
  - app de soutien pour éviter le burn-out,
  - sport vu comme un allié du mental, pas comme une fin en soi.

---

## Pistes d’évolution futures

- Type de sport principal dans le profil (`profiles.sport_type`) et adaptation des textes.
- Score simplifié de "charge intérieure" (vert / orange / rouge) basé sur :
  - stress moyen,
  - nombre de séances,
  - fréquence des SOS.
- Notifications intelligentes (liées au planning et aux check-ins, pas génériques).
- Meilleur support offline (cache du plan de la journée, derniers check-ins, exercices bien-être).
