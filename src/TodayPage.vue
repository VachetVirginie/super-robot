<script setup lang="ts">
import { computed } from 'vue'
import type { WellbeingExercise, TodaySection } from './types'
import type { WeeklySlot, TimeOfDay } from './composables/useWeeklySlots'
import TodayDashboard from './components/TodayDashboard.vue'
import WellbeingCard from './components/WellbeingCard.vue'

const props = defineProps<{
  isAuthenticated: boolean
  isLoginMode: boolean
  email: string
  password: string
  authMessage: string | null
  authError: string | null
  isAuthLoading: boolean
  submitLabel: string
  submitLoadingLabel: string
  switchLabel: string
  todaysMotivation: { title: string; body: string } | null
  todaySections: TodaySection[]
  perWeekGoal: number | null
  weeklySessions: number | null
  weeklyProgressPercent: number
  weeklyStatusLabel: string
  weeklySlots: WeeklySlot[]
  isWeeklySlotsLoading: boolean
  weeklySlotsError: string | null
  isPushSupported: boolean
  isLoadingNotifications: boolean
  notificationsStatus: 'idle' | 'requesting' | 'enabled' | 'error'
  notificationsError: string | null
  todaysExercise: WellbeingExercise | null
  onUpdateEmail: (value: string) => void
  onUpdatePassword: (value: string) => void
  submitAuth: () => void | Promise<void>
  toggleAuthMode: () => void
  onTodayRowClick: (key: string) => void
  onEnableNotifications: () => void | Promise<void>
  startWellbeingExercise: () => void
  onOpenWeekPlan: () => void
}>()

function onEmailInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  props.onUpdateEmail(target?.value ?? '')
}

function onPasswordInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  props.onUpdatePassword(target?.value ?? '')
}

function onRowClick(key: string) {
  props.onTodayRowClick(key)
}

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const timeLabels: Record<TimeOfDay, string> = {
  morning: 'matin',
  afternoon: 'ap.midi',
  evening: 'soir',
}

const planSummary = computed(() => {
  if (props.isWeeklySlotsLoading) {
    return 'Chargement de ton planning...'
  }
  if (props.weeklySlotsError) {
    return props.weeklySlotsError
  }
  const count = props.weeklySlots.length
  if (count === 0) {
    return "Aucun moment planifie pour l'instant."
  }

  const short = props.weeklySlots
    .slice(0, 3)
    .map((slot) => `${days[slot.dayIndex]} ${timeLabels[slot.timeOfDay]}`)

  if (count === 1) {
    return `1 moment planifie : ${short[0]}`
  }
  if (count <= 3) {
    return `${count} moments : ${short.join(', ')}`
  }

  const remaining = count - short.length
  return `${count} moments : ${short.join(', ')} + ${remaining} autre(s)`
})
</script>

<template>
  <section v-if="isAuthenticated && todaysMotivation" class="card hero">
    <h2>{{ todaysMotivation.title }}</h2>
    <p class="hero-text">
      {{ todaysMotivation.body }}
    </p>
    <div class="hero-image"></div>
  </section>

  <section v-if="isAuthenticated" class="card planweek-section">
    <div class="planweek-header">
      <div>
        <h2 class="planweek-title">Planifier ma semaine</h2>
        <p class="planweek-subtitle">Choisis quelques moments realistes pour bouger.</p>
        <p class="planweek-summary">
          {{ planSummary }}
        </p>
      </div>
      <button type="button" class="secondary planweek-cta" @click="props.onOpenWeekPlan()">
        Definir
      </button>
    </div>
  </section>

  <section v-if="!isAuthenticated" class="card">
    <h2>{{ isLoginMode ? 'Connexion' : 'Creer un compte' }}</h2>
    <p>Connecte-toi pour sauvegarder tes objectifs, tes seances et tes routines.</p>
    <form class="auth-form" @submit.prevent="submitAuth">
      <input
        :value="email"
        type="email"
        required
        class="input"
        placeholder="ton.email@example.com"
        @input="onEmailInput"
      />
      <input
        :value="password"
        type="password"
        required
        class="input"
        placeholder="Mot de passe"
        @input="onPasswordInput"
      />
      <button type="submit" :disabled="isAuthLoading" class="primary">
        <span v-if="isAuthLoading">{{ submitLoadingLabel }}</span>
        <span v-else>{{ submitLabel }}</span>
      </button>
    </form>
    <button type="button" class="link" @click="toggleAuthMode">
      {{ switchLabel }}
    </button>
    <p v-if="authMessage" class="info">
      {{ authMessage }}
    </p>
    <p v-if="authError" class="error">
      {{ authError }}
    </p>
  </section>

  <TodayDashboard
    v-else
    :sections="todaySections"
    :per-week-goal="perWeekGoal"
    @row-click="onRowClick"
  />
  <WellbeingCard
    v-if="isAuthenticated && todaysExercise"
    :exercise="todaysExercise"
    @start="startWellbeingExercise"
  />
</template>

<style scoped>
.card {
  max-width: 100%;
  width: 100%;
  padding: 1.5rem 1.5rem 1.25rem;
  border-radius: 1rem;
  margin: 0 auto;
  background: #111111;
  border: 1px solid #27272a;
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.75);
}
.hero {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.hero-text {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.9;
}
.hero-image {
  margin-top: 0.85rem;
  border-radius: 0.9rem;
  height: 130px;
  background:
    linear-gradient(135deg, #101010 0%, #222222 35%, #000000 100%);
}
.auth-form {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.input {
  padding: 0.6rem 0.8rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 1rem;
}
.primary {
  width: 100%;
}
.info {
  margin-top: 1rem;
  font-size: 0.9rem;
}
.error {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #ff6b6b;
}

.planweek-section {
  margin-top: 0.75rem;
}

.planweek-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.planweek-title {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.planweek-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

.planweek-cta {
  min-width: 0;
  padding-inline: 0.9rem;
}

.planweek-summary {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  opacity: 0.9;
}
</style>
