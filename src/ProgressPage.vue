<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { WeeklySlot, TimeOfDay } from './composables/useWeeklySlots'

const props = defineProps<{
  isAuthenticated: boolean
  weeklySessions: number | null
  perWeekGoal: number | null
  weeklyProgressPercent: number
  weeklyStatusLabel: string
  weeklyAverageStress: number | null
  weeklyCheckinsCount: number
  weeklySlots: WeeklySlot[]
  isWeeklySlotsLoading: boolean
  weeklySlotsError: string | null
  stressReasons: { id: string; created_at: string; reason: string | null; category: string | null }[]
}>()

const router = useRouter()

const safePercent = computed(() => {
  if (!Number.isFinite(props.weeklyProgressPercent)) return 0
  return Math.max(0, Math.min(100, Math.round(props.weeklyProgressPercent)))
})

const stressCategoriesSummary = computed(() => {
  const counts: Record<string, number> = {
    work: 0,
    family: 0,
    health: 0,
    other: 0,
    uncategorized: 0,
  }

for (const item of props.stressReasons) {
  const key =
    item.category && ['work', 'family', 'health', 'other'].includes(item.category)
      ? item.category
      : 'uncategorized'

  counts[key] ??= 0       // Initialise si undefined
  counts[key] += 1        // Incrémente
}


  const labels: Record<string, string> = {
    work: 'Travail',
    family: 'Famille',
    health: 'Sante',
    other: 'Autre',
    uncategorized: 'Autre / non precise',
  }

  const entries = Object.entries(counts)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return entries.map(([key, value]) => {
    const label = labels[key] ?? 'Autre / non precise'
    return {
      key,
      label,
      count: value,
    }
  })
})

const hasStressData = computed(() => {
  return props.weeklyAverageStress !== null && props.weeklyCheckinsCount > 0
})

const stressLevelPercent = computed(() => {
  if (!Number.isFinite(props.weeklyAverageStress ?? null)) return 0
  const value = props.weeklyAverageStress ?? 0
  return Math.max(0, Math.min(100, Math.round((value / 5) * 100)))
})

const stressCountLabel = computed(() => {
  const count = props.weeklyCheckinsCount
  if (!count) return "Pas encore de check-in cette semaine."
  if (count === 1) return '1 check-in cette semaine.'
  return `${count} check-ins cette semaine.`
})

const stressMoodLabel = computed(() => {
  const avg = props.weeklyAverageStress
  const count = props.weeklyCheckinsCount

  if (!count || avg == null) {
    return 'Plus tu fais de check-ins, plus on comprend comment tu vis tes semaines.'
  }

  if (avg <= 2) {
    return 'Globalement, ton stress est plutot bas cette semaine.'
  }
  if (avg <= 3.5) {
    return 'Semaine chargee mais plutot sous controle.'
  }
  return 'Semaine un peu intense. Pense a prendre quelques pauses pour toi.'
})

const sessionsLabel = computed(() => {
  const count = props.weeklySessions ?? 0
  if (count === 0) {
    return 'Pas encore de seance cette semaine. On peut toujours en ajouter une petite.'
  }
  if (count === 1) {
    return "1 seance faite cette semaine. C'est deja un bon debut."
  }
  return `Tu as fait ${count} seances cette semaine. Bravo, tu crees de l'espace pour toi.`
})

const goalLabel = computed(() => {
  if (props.perWeekGoal == null) {
    return "Tu n'as pas encore d'objectif par semaine. On peut en definir un tres simple (1 ou 2 seances)."
  }
  return `Ton objectif actuel : ${props.perWeekGoal} seance(s) par semaine.`
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
    <h2 class="progress-title">Mon equilibre</h2>
    <p class="progress-text">
      Connecte-toi pour suivre ta progression hebdomadaire et tes objectifs.
    </p>
  </section>

  <section v-else class="progress-card">
    <h2 class="progress-title">Mon equilibre</h2>

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
      <span class="progress-bar-label">Tu es a {{ safePercent }}% de ton objectif de la semaine.</span>
    </div>

    <p class="progress-status">
      {{ weeklyStatusLabel }}
    </p>

    <div class="progress-tags">
      <span class="tag tag--mint">Stress & mouvement</span>
      <span class="tag tag--blue">Semaine en cours</span>
      <span class="tag tag--coral" v-if="safePercent >= 100">Objectif atteint</span>
    </div>

    <section class="planstrip">
      <h3 class="planstrip-title">Tes moments prevus pour bouger</h3>

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
        Tu n'as pas encore prevu de moments pour bouger cette semaine. Tu peux les
        choisir depuis la page Aujourd'hui.
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

    <section class="stress-section">
      <h3 class="stress-title">Ton stress cette semaine</h3>

      <p v-if="!hasStressData" class="stress-text stress-text--muted">
        Pas encore assez de check-ins cette semaine pour voir une tendance.
      </p>

      <div v-else class="stress-grid">
        <div class="stress-card">
          <p class="stress-card-label">Note moyenne</p>
          <p class="stress-card-value">
            {{ weeklyAverageStress }}/5
          </p>
          <div class="stress-bar-track">
            <div class="stress-bar-fill" :style="{ width: stressLevelPercent + '%' }"></div>
          </div>
        </div>

        <div class="stress-card">
          <p class="stress-card-label">Check-ins</p>
          <p class="stress-card-value">
            {{ weeklyCheckinsCount }}
          </p>
          <p class="stress-card-hint">
            {{ stressCountLabel }}
          </p>
        </div>

        <div class="stress-card stress-card--mood">
          <p class="stress-card-label">Tendance</p>
          <p class="stress-card-mood">
            {{ stressMoodLabel }}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="stress-link-button"
        @click="router.push({ name: 'stress-reasons' })"
      >
        Voir les raisons que tu as notees
      </button>
    </section>

    <section v-if="stressCategoriesSummary.length" class="stress-categories-section">
      <h3 class="stress-categories-title">Ce qui revient souvent</h3>
      <p class="stress-categories-text">
        Sur tes dernieres raisons de stress, voici ce qui apparait le plus souvent.
      </p>
      <div class="stress-categories-chips">
        <span
          v-for="item in stressCategoriesSummary"
          :key="item.key"
          class="stress-category-chip"
        >
          {{ item.label }}
          <span class="stress-category-count">({{ item.count }})</span>
        </span>
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

.progress-status--muted {
  opacity: 0.85;
  font-size: 0.85rem;
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

.stress-section {
  margin-top: 1.25rem;
}

.stress-title {
  margin: 0 0 0.6rem;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
}

.stress-text {
  margin: 0;
  font-size: 0.85rem;
}

.stress-text--muted {
  opacity: 0.75;
}

.stress-grid {
  margin-top: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.stress-card {
  padding: 0.7rem 0.8rem;
  border-radius: 0.75rem;
  background: #020617;
  border: 1px solid rgba(148, 163, 184, 0.45);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stress-card-label {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.8;
}

.stress-card-value {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.stress-bar-track {
  margin-top: 0.35rem;
  width: 100%;
  height: 0.45rem;
  border-radius: 999px;
  background: #020617;
  overflow: hidden;
}

.stress-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #22c55e, #f97316);
}

.stress-card-hint {
  margin: 0.1rem 0 0;
  font-size: 0.8rem;
  opacity: 0.8;
}

.stress-card--mood {
  background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), #020617);
}

.stress-card-mood {
  margin: 0.1rem 0 0;
  font-size: 0.85rem;
}

.stress-link-button {
  margin-top: 0.75rem;
  width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: transparent;
  color: #e5e7eb;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
}

.stress-categories-section {
  margin-top: 1.25rem;
}

.stress-categories-title {
  margin: 0 0 0.4rem;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
}

.stress-categories-text {
  margin: 0 0 0.45rem;
  font-size: 0.85rem;
  opacity: 0.85;
}

.stress-categories-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.stress-category-chip {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  font-size: 0.78rem;
}

.stress-category-count {
  opacity: 0.85;
}
</style>
