<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { WeeklySlot, TimeOfDay } from './composables/useWeeklySlots'

const props = defineProps<{
  isAuthenticated: boolean
  perWeekGoal: number | null
  weeklySlots: WeeklySlot[]
  isWeeklySlotsLoading: boolean
  weeklySlotsError: string | null
  weeklySessions: number | null
  onOpenWeekPlan: () => void
  onOpenWeeklySessions: () => void
}>()

const router = useRouter()

const isSoftOnboarding = computed(() => {
  const sessions = props.weeklySessions ?? 0
  return sessions <= 2
})

const introText = computed(() => {
  if (isSoftOnboarding.value) {
    return "On choisit ensemble 1 ou 2 petits moments simples pour bouger cette semaine."
  }
  return "On choisit ensemble quelques moments pour bouger cette semaine. Pas besoin d'un plan parfait : juste quelques moments jouables."
})

const slotsSummary = computed(() => {
  if (props.isWeeklySlotsLoading) {
    return 'On charge ton planning...'
  }
  if (props.weeklySlotsError) {
    return props.weeklySlotsError
  }
  const count = props.weeklySlots.length
  if (count === 0) {
    return "Aucun moment prevu pour l'instant, on peut en ajouter ensemble."
  }
  if (count === 1) {
    return 'Tu as prevu 1 moment pour toi cette semaine.'
  }

  return `Tu as prevu ${count} moments pour toi cette semaine.`
})

const goalSummary = computed(() => {
  const goal = props.perWeekGoal
  if (goal == null || goal <= 0) {
    return "Tu n'as pas defini d'objectif cette semaine, et c'est tres bien aussi."
  }
  if (goal === 1) {
    return 'Ton objectif : 1 mini-seance cette semaine.'
  }
  return `Ton objectif : ${goal} mini-seances cette semaine.`
})

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const timeSlots: { key: TimeOfDay; label: string }[] = [
  { key: 'morning', label: 'Matin' },
  { key: 'afternoon', label: 'Ap.midi' },
  { key: 'evening', label: 'Soir' },
]

function hasSlot(dayIndex: number, slotKey: TimeOfDay) {
  return props.weeklySlots.some(
    (slot) => slot.dayIndex === dayIndex && slot.timeOfDay === slotKey,
  )
}
</script>

<template>
  <section v-if="!isAuthenticated" class="card config-card">
    <h2 class="config-title">Configurer ma semaine</h2>
    <p class="config-text">
      Connecte-toi pour enregistrer tes moments pour toi et ton objectif hebdomadaire.
    </p>
  </section>

  <section v-else class="card config-card">
    <h2 class="config-title">Ma semaine</h2>
    <p class="config-text">
      {{ introText }}
    </p>
    <section class="config-section">
      <h3 class="config-section-title">Resume de tes moments</h3>
      <p class="config-summary">
        {{ slotsSummary }}
      </p>

      <div class="config-week-mini">
        <div
          v-for="(day, dayIndex) in days"
          :key="day"
          class="config-week-row"
        >
          <span class="config-week-day">{{ day }}</span>
          <div class="config-week-dots">
            <span
              v-for="slot in timeSlots"
              :key="slot.key"
              class="config-week-dot"
              :class="{ 'is-active': hasSlot(dayIndex, slot.key) }"
            ></span>
          </div>
        </div>
            <button type="button" class="primary config-button" @click="onOpenWeekPlan">
      Configurer mes moments
    </button>
      </div>
    </section>

    <section class="config-section">
      <div class="config-goal-card">
        <h3 class="config-section-title">Objectif de la semaine</h3>
        <p class="config-summary">
          {{ goalSummary }}
        </p>
      </div>
    </section>

    <section class="config-section">
      <div class="config-goal-card">
        <h3 class="config-section-title">Mes seances de la semaine</h3>
        <p class="config-summary">
          Tu peux revoir ou corriger les seances deja enregistrees.
        </p>
        <div class="config-week-actions">
          <button
            type="button"
            class="secondary see"
            @click="router.push({ name: 'seances' })"
          >
            Voir toutes tes seances
          </button>
          <button
            type="button"
            class="secondary put"
            @click="props.onOpenWeeklySessions()"
          >
            Modifier mes seances
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.config-card {
  margin-top: 0.75rem;
}

.config-title {
  margin: 0 0 0.9rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.config-text {
  margin: 0 0 0.6rem;
  font-size: 0.9rem;
}

.config-summary {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.config-section {
  margin-top: 0.75rem;
}

.config-section-title {
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
}

.config-hint {
  margin: 0.75rem 0 0.5rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.config-error {
  margin: 0.75rem 0 0.5rem;
  font-size: 0.8rem;
  color: #fecaca;
}

.config-goal-card {
  padding: 1.5rem 1.5rem 1.25rem;
  border-radius: 1rem;
  background: #111111;
  border: 1px solid #27272a;
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.75);
}

.config-week-mini {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.config-week-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.config-week-day {
  font-size: 0.8rem;
  opacity: 0.85;
}

.config-week-dots {
  display: flex;
  align-items: center;
  gap: 0.18rem;
}

.config-week-dot {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.3);
}

.config-week-dot.is-active {
  background: #22c55e;
}

.config-week-actions {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-button {
  margin-top: 0.75rem;
  width: 100%;
}

.see {
  background-color: #22c55e;
  color: #020617;
}
</style>
