<script setup lang="ts">
import { computed } from 'vue'
import type { WeeklySlot, TimeOfDay } from './composables/useWeeklySlots'

const props = defineProps<{
  isAuthenticated: boolean
  weeklySessions: number | null
  perWeekGoal: number | null
  weeklyProgressPercent: number
  weeklyStatusLabel: string
  weeklySlots: WeeklySlot[]
  isWeeklySlotsLoading: boolean
  weeklySlotsError: string | null
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

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const timeSlots: { key: TimeOfDay; label: string }[] = [
  { key: 'morning', label: 'Matin' },
  { key: 'afternoon', label: 'Ap.midi' },
  { key: 'evening', label: 'Soir' },
]

function hasSlot(dayIndex: number, timeOfDay: TimeOfDay) {
  return props.weeklySlots.some(
    (slot) => slot.dayIndex === dayIndex && slot.timeOfDay === timeOfDay,
  )
}
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

    <section class="planstrip">
      <h3 class="planstrip-title">Planning de la semaine</h3>

      <p v-if="isWeeklySlotsLoading" class="planstrip-text">
        Chargement de ton planning...
      </p>
      <p v-else-if="weeklySlotsError" class="planstrip-text planstrip-text--error">
        {{ weeklySlotsError }}
      </p>
      <p
        v-else-if="!weeklySlots.length"
        class="planstrip-text planstrip-text--muted"
      >
        Tu n'as pas encore planifie ta semaine. Utilise "Planifier ma semaine" sur la
        page Aujourd'hui.
      </p>

      <div v-else class="planstrip-grid">
        <div
          v-for="(day, dayIndex) in days"
          :key="day"
          class="planstrip-day"
        >
          <div class="planstrip-day-label">
            {{ day }}
          </div>
          <div class="planstrip-day-slots">
            <span
              v-for="slot in timeSlots"
              :key="slot.key"
              class="planstrip-dot"
              :class="[
                'planstrip-dot--' + slot.key,
                { 'is-active': hasSlot(dayIndex, slot.key) },
              ]"
            ></span>
          </div>
        </div>
      </div>
    </section>
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

.planstrip {
  margin-top: 1.25rem;
}

.planstrip-title {
  margin: 0 0 0.6rem;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
}

.planstrip-text {
  margin: 0;
  font-size: 0.85rem;
}

.planstrip-text--muted {
  opacity: 0.75;
}

.planstrip-text--error {
  color: #fecaca;
}

.planstrip-grid {
  margin-top: 0.6rem;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.35rem;
}

.planstrip-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.planstrip-day-label {
  font-size: 0.7rem;
  opacity: 0.8;
}

.planstrip-day-slots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.18rem;
}

.planstrip-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 999px;
  opacity: 0.25;
  background: rgba(148, 163, 184, 0.5);
}

.planstrip-dot--morning.is-active {
  opacity: 1;
  background: #22c55e;
}

.planstrip-dot--afternoon.is-active {
  opacity: 1;
  background: #38bdf8;
}

.planstrip-dot--evening.is-active {
  opacity: 1;
  background: #a855f7;
}
</style>
