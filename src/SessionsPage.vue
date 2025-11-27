<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  isAuthenticated: boolean
  weeklySessions: number | null
  perWeekGoal: number | null
  weeklyProgressPercent: number
  weeklyStatusLabel: string
  weeklyMinutes: number | null
  weeklyActiveDays: number | null
  weeklyByKind: Record<string, { sessions: number; minutes: number }>
  latestSessionsDetail: Array<{
    id: number
    dateLabel: string
    kindLabel: string | null
    durationLabel: string | null
    templateKey: string | null
    templateName: string | null
    fullLabel: string
  }>
  latestSessionsDisplay: string[]
}>()

const emit = defineEmits<{
  (e: 'replay-template', key: string): void
}>()

const safePercent = computed(() => {
  if (!Number.isFinite(props.weeklyProgressPercent)) return 0
  return Math.max(0, Math.min(100, Math.round(props.weeklyProgressPercent)))
})

const sessionsLabel = computed(() => {
  const count = props.weeklySessions ?? 0
  if (count === 0) {
    return "Pas encore de seance cette semaine. Tu peux en ajouter une petite depuis la page Aujourd'hui."
  }
  if (count === 1) {
    return "1 seance faite cette semaine. C'est deja un bon debut."
  }
  return `Tu as fait ${count} seances cette semaine. Bravo, tu crees de l'espace pour toi.`
})

const goalLabel = computed(() => {
  if (props.perWeekGoal == null) {
    return "Tu n'as pas encore defini d'objectif hebdomadaire. Tu peux en choisir un tres simple (1 ou 2 seances)."
  }
  return `Ton objectif actuel : ${props.perWeekGoal} seance(s) par semaine.`
})

const minutesLabel = computed(() => {
  const minutes = props.weeklyMinutes ?? 0
  if (!minutes) {
    return "Temps de sport maison non renseigne pour cette semaine. Tu pourras plus tard noter la duree de tes seances."
  }
  return `Soit ${minutes} minute(s) de sport maison cette semaine.`
})

const activeDaysLabel = computed(() => {
  const days = props.weeklyActiveDays ?? 0
  if (!days) {
    return "Pour l'instant, aucun jour actif. On va viser le principe \"jamais zero\" : au moins un jour avec un peu de mouvement, meme tres court."
  }
  if (days === 1) {
    return "Tu as deja 1 jour actif cette semaine. L'idee est surtout de garder au moins un jour \"jamais zero\" meme quand la semaine est chargee."
  }
  return `Tu as bouge ${days} jour(s) cette semaine. Tu construis ton \"jamais zero\" en douceur.`
})

const kindSummary = computed(() => {
  const entries = Object.entries(props.weeklyByKind || {})
    .filter(([, value]) => (value?.sessions ?? 0) > 0)
    .sort((a, b) => (b[1].minutes ?? 0) - (a[1].minutes ?? 0))
    .slice(0, 3)

  const labels: Record<string, string> = {
    cardio: 'Cardio leger',
    strength: 'Renfo',
    mobility: 'Mobilite',
    mixed: 'Mixte',
    jump: 'Corde à sauter',
    stretch: 'Flexibilite',
    yoga : 'Yoga',
    rowing: 'Rameur',
    other: 'Autre',
  }

  return entries.map(([key, value]) => {
    const base = labels[key] ?? 'Autre'
    const sessions = value.sessions
    const minutes = value.minutes
    return {
      key,
      label: `${base} · ${sessions} seance(s) · ${minutes} min`,
    }
  })
})

const hasDetailedSessions = computed(
  () => (props.latestSessionsDetail?.length ?? 0) > 0,
)
</script>

<template>
  <section v-if="!isAuthenticated" class="card sessions-card">
    <h2 class="sessions-title">Mes seances</h2>
    <p class="sessions-text">
      Connecte-toi pour enregistrer et suivre tes seances au fil des semaines.
    </p>
  </section>

  <template v-else>
    <section class="card sessions-card">
      <h2 class="sessions-title">Mes seances</h2>
      <p class="sessions-subtitle">
        Un coup d'oeil sur tes seances de la semaine.
      </p>

      <div class="sessions-summary">
        <p class="sessions-text">
          {{ sessionsLabel }}
        </p>
        <p class="sessions-text sessions-text--muted">
          {{ goalLabel }}
        </p>
        <p class="sessions-text sessions-text--muted">
          {{ minutesLabel }}
        </p>
        <p class="sessions-text sessions-text--muted">
          {{ activeDaysLabel }}
        </p>
      </div>

      <div class="sessions-progress">
        <div class="sessions-bar-track">
          <div class="sessions-bar-fill" :style="{ width: safePercent + '%' }"></div>
        </div>
        <span class="sessions-bar-label">
          Tu es a {{ safePercent }}% de ton objectif de la semaine.
        </span>
      </div>
    </section>

    <section class="card sessions-card sessions-card--secondary">
      <h3 class="sessions-section-title">Dernieres seances</h3>
      <p v-if="kindSummary.length" class="sessions-text sessions-text--muted">
        {{ kindSummary.map((item) => item.label).join(' · ') }}
      </p>
      <p
        v-if="!hasDetailedSessions && !latestSessionsDisplay.length"
        class="sessions-text sessions-text--muted"
      >
        Tu n'as pas encore de seances enregistrees. Quand tu en fais une, utilise le bouton sur
        la page Aujourd'hui pour la noter.
      </p>
      <ul v-else-if="hasDetailedSessions" class="sessions-list">
        <li
          v-for="item in latestSessionsDetail"
          :key="item.id"
          class="sessions-list-item sessions-list-item--with-actions"
        >
          <div class="sessions-list-main">
            {{ item.fullLabel }}
          </div>
          <button
            v-if="item.templateKey"
            type="button"
            class="secondary sessions-replay-button"
            @click="emit('replay-template', item.templateKey)"
          >
            Rejouer
          </button>
        </li>
      </ul>
      <ul v-else class="sessions-list">
        <li
          v-for="(label, index) in latestSessionsDisplay"
          :key="index"
          class="sessions-list-item"
        >
          {{ label }}
        </li>
      </ul>
    </section>
  </template>
</template>

<style scoped>
.sessions-card + .sessions-card {
  margin-top: 0.75rem;
}

.sessions-title {
  margin: 0 0 0.9rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}

.sessions-subtitle {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  opacity: 0.85;
}

.sessions-summary {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.sessions-text {
  margin: 0;
  font-size: 0.95rem;
}

.sessions-text--muted {
  opacity: 0.8;
  font-size: 0.85rem;
}

.sessions-progress {
  margin-top: 0.5rem;
}

.sessions-bar-track {
  width: 100%;
  height: 0.6rem;
  border-radius: 999px;
  background: radial-gradient(circle at left, rgba(56, 189, 248, 0.2), #020617 55%);
  overflow: hidden;
}

.sessions-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #22c55e, #38bdf8);
  transition: width 0.25s ease-out;
}

.sessions-bar-label {
  display: inline-block;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: rgba(209, 213, 219, 0.9);
}

.sessions-card--secondary {
  margin-top: 0.75rem;
}

.sessions-section-title {
  margin: 0 0 0.6rem;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
  font-weight: 600;
}

.sessions-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sessions-list-item {
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  background: #0b0b0b;
  border: 1px solid #27272a;
  font-size: 0.9rem;
}

.sessions-list-item--with-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.sessions-list-main {
  flex: 1;
  min-width: 0;
}

.sessions-replay-button {
  min-width: 0;
  padding-inline: 0.7rem;
  font-size: 0.8rem;
}
</style>
