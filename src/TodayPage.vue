<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { WellbeingExercise, TodaySection } from './types'
import type { WeeklySlot } from './composables/useWeeklySlots'
import TodayDashboard from './components/TodayDashboard.vue'

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
  todayCheckinSummary: string
  todayCheckinLevel: number | null
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
  isCheckinSaving: boolean
  checkinError: string | null
  onUpdateEmail: (value: string) => void
  onUpdatePassword: (value: string) => void
  submitAuth: () => void | Promise<void>
  toggleAuthMode: () => void
  onTodayRowClick: (key: string) => void
  onEnableNotifications: () => void | Promise<void>
  startWellbeingExercise: () => void
  onOpenWeekPlan: () => void
  submitCheckin: (stressLevel: number) => void | Promise<void>
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

const planSummary = computed(() => {
  if (props.isWeeklySlotsLoading) {
    return 'On charge ton planning...'
  }
  if (props.weeklySlotsError) {
    return props.weeklySlotsError
  }
  const count = props.weeklySlots.length
  if (count === 0) {
    return "Tu n'as encore rien prevu. On choisit 1 ou 2 moments faciles ?"
  }
  if (count === 1) {
    return 'Tu as prevu 1 petit moment pour toi cette semaine.'
  }

  return `Tu as prevu ${count} moments pour toi cette semaine. C'est deja tres bien.`
})

const selectedStress = ref<number | null>(null)

watch(
  () => props.todayCheckinLevel,
  (level) => {
    selectedStress.value = level ?? null
  },
  { immediate: true },
)

function onSelectStress(level: number) {
  selectedStress.value = level
}

async function onSubmitCheckin() {
  if (!selectedStress.value || props.isCheckinSaving) {
    return
  }
  await props.submitCheckin(selectedStress.value)
}
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
        <h2 class="planweek-title">Mon plan pour bouger</h2>
        <p class="planweek-subtitle">On choisit quelques moments simples pour toi cette semaine.</p>
        <p class="planweek-summary">
          {{ planSummary }}
        </p>
      </div>
      <button type="button" class="secondary planweek-cta" @click="props.onOpenWeekPlan()">
        Mes moments
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

  <template v-else>
    <section class="card checkin-card">
      <h2 class="checkin-title">Aujourd'hui : stress et mouvement</h2>
      <p class="checkin-subtitle">
        Dis-moi comment tu te sens, et on choisit une petite action pour t'aider
        (bouger un peu ou faire une pause bien-etre).
      </p>
      <div class="checkin-scale">
        <button
          v-for="level in 5"
          :key="level"
          type="button"
          class="checkin-dot"
          :class="{ 'is-active': selectedStress === level }"
          :disabled="isCheckinSaving"
          @click="onSelectStress(level)"
        >
          {{ level }}
        </button>
      </div>
      <button
        type="button"
        class="primary checkin-submit"
        :disabled="!selectedStress || isCheckinSaving"
        @click="onSubmitCheckin"
      >
        <span v-if="isCheckinSaving">Enregistrement...</span>
        <span v-else>Enregistrer mon check-in</span>
      </button>
      <p class="checkin-summary">
        {{ todayCheckinSummary }}
      </p>
      <div class="checkin-actions">
        <button
          type="button"
          class="secondary checkin-action"
          @click="onRowClick('today-quick-5')"
        >
          Seance rapide 5 min
        </button>
        <button
          type="button"
          class="secondary checkin-action"
          @click="onRowClick('today-sessions')"
        >
          Ajouter une petite seance
        </button>
        <button
          v-if="todaysExercise"
          type="button"
          class="secondary checkin-action"
          @click="startWellbeingExercise"
        >
          Lancer la pause bien-etre du jour
        </button>
      </div>
      <p v-if="todaysExercise" class="checkin-hint">
        Pause du jour : {{ todaysExercise.title }}
      </p>
      <p v-if="checkinError" class="error">
        {{ checkinError }}
      </p>
    </section>
    <TodayDashboard
      :sections="todaySections"
      :per-week-goal="perWeekGoal"
      @row-click="onRowClick"
    />
  </template>
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

.checkin-card {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkin-title {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.checkin-subtitle {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.85;
}

.checkin-scale {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.checkin-dot {
  flex: 1;
  border-radius: 999px;
  border: 1px solid rgba(75, 85, 99, 0.9);
  background: #020617;
  color: #e5e7eb;
  padding: 0.35rem 0;
  font-size: 0.85rem;
}

.checkin-dot.is-active {
  border-color: #22c55e;
  background: #22c55e;
  color: #020617;
}

.checkin-submit {
  margin-top: 0.75rem;
}

.checkin-summary {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  opacity: 0.9;
}

.checkin-actions {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkin-action {
  width: 100%;
}

.checkin-hint {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  opacity: 0.9;
}
</style>
