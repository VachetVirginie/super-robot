<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isAuthenticated: boolean
  weeklySessions: number | null
  perWeekGoal: number | null
  weeklyProgressPercent: number
  weeklyStatusLabel: string
}>()

const safePercent = computed(() => {
  if (!Number.isFinite(props.weeklyProgressPercent)) return 0
  return Math.max(0, Math.min(100, Math.round(props.weeklyProgressPercent)))
})

const sessionsLabel = computed(() => {
  const count = props.weeklySessions ?? 0
  if (count === 0) return "Aucune seance enregistree cette semaine."
  if (count === 1) return "1 seance enregistree cette semaine."
  return `${count} seances enregistrees cette semaine.`
})

const goalLabel = computed(() => {
  if (props.perWeekGoal == null) return "Aucun objectif hebdomadaire defini pour l'instant."
  return `Objectif actuel : ${props.perWeekGoal} seance(s) par semaine.`
})
</script>

<template>
  <section v-if="!isAuthenticated" class="progress-card">
    <h2 class="progress-title">Progression</h2>
    <p class="progress-text">
      Connecte-toi pour suivre ta progression hebdomadaire et tes objectifs.
    </p>
  </section>

  <section v-else class="progress-card">
    <h2 class="progress-title">Progression</h2>

    <div class="progress-summary">
      <p class="progress-text">
        {{ sessionsLabel }}
      </p>
      <p class="progress-text progress-text--muted">
        {{ goalLabel }}
      </p>
    </div>

    <div class="progress-bar-wrapper">
      <div class="progress-bar-track">
        <div class="progress-bar-fill" :style="{ width: safePercent + '%' }"></div>
      </div>
      <span class="progress-bar-label">{{ safePercent }}% de ton objectif</span>
    </div>

    <p class="progress-status">
      {{ weeklyStatusLabel }}
    </p>

    <div class="progress-tags">
      <span class="tag tag--mint">Habitude</span>
      <span class="tag tag--blue">Semaine en cours</span>
      <span class="tag tag--coral" v-if="safePercent >= 100">Objectif atteint</span>
    </div>
  </section>
</template>

<style scoped>
.progress-card {
  max-width: 100%;
  width: 100%;
  padding: 1.5rem 1.5rem 1.25rem;
  border-radius: 1rem;
  margin: 0 auto;
  background: #020617;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85);
}

.progress-title {
  margin: 0 0 0.9rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e5e7eb;
}

.progress-summary {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.progress-text {
  margin: 0;
  font-size: 0.95rem;
}

.progress-text--muted {
  opacity: 0.8;
  font-size: 0.85rem;
}

.progress-bar-wrapper {
  margin-top: 0.5rem;
  margin-bottom: 0.85rem;
}

.progress-bar-track {
  width: 100%;
  height: 0.6rem;
  border-radius: 999px;
  background: radial-gradient(circle at left, rgba(56, 189, 248, 0.2), #020617 55%);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #22c55e, #38bdf8);
  transition: width 0.25s ease-out;
}

.progress-bar-label {
  display: inline-block;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: rgba(209, 213, 219, 0.9);
}

.progress-status {
  margin: 0.75rem 0 0.5rem;
  font-size: 0.9rem;
  color: #e5e7eb;
}

.progress-tags {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  border: 1px solid transparent;
}

.tag--mint {
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.6);
  color: #bbf7d0;
}

.tag--blue {
  background: rgba(56, 189, 248, 0.08);
  border-color: rgba(56, 189, 248, 0.6);
  color: #bae6fd;
}

.tag--coral {
  background: rgba(248, 113, 113, 0.08);
  border-color: rgba(248, 113, 113, 0.8);
  color: #fecaca;
}
</style>
