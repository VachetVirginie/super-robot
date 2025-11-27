<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isAuthenticated: boolean
  weeklySessions: number | null
  perWeekGoal: number | null
  weeklyProgressPercent: number
  weeklyStatusLabel: string
  latestSessionsDisplay: string[]
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
      <p v-if="!latestSessionsDisplay.length" class="sessions-text sessions-text--muted">
        Tu n'as pas encore de seances enregistrees. Quand tu en fais une, utilise le bouton sur la page Aujourd'hui pour la noter.
      </p>
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
</style>
