<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { enablePushNotifications, isPushSupported } from './pushNotifications'
import { useAuth } from './composables/useAuth'
import { useTodayStats } from './composables/useTodayStats'
import { useProfile } from './composables/useProfile'
import WeekStrip from './components/WeekStrip.vue'
import AddSessionDialog from './components/AddSessionDialog.vue'
import MonthCalendarDialog from './components/MonthCalendarDialog.vue'
import WellbeingDialog from './components/WellbeingDialog.vue'
import WellbeingPlayerDialog from './components/WellbeingPlayerDialog.vue'
import AdjustGoalDialog from './components/AdjustGoalDialog.vue'

const status = ref<'idle' | 'requesting' | 'enabled' | 'error'>('idle')
const errorMessage = ref<string | null>(null)

const route = useRoute()
const router = useRouter()

const isLoadingNotifications = computed(() => status.value === 'requesting')

const {
  session,
  email,
  password,
  authMessage,
  authError,
  isAuthLoading,
  isAuthenticated,
  isLoginMode,
  submitLabel,
  submitLoadingLabel,
  switchLabel,
  submitAuth,
  toggleAuthMode,
  signOut,
} = useAuth()

const {
  weeklySessions,
  perWeekGoal,
  isSavingSession,
  weeklyProgressPercent,
  weeklyStatusLabel,
  recordSession,
  changeGoal,
  removeLastSession,
  weekSessionDates,
  getMonthSessionDates,
} = useTodayStats(session)

const {
  displayName,
  isProfileLoading,
  isProfileSaving,
  profileError,
  saveDisplayName,
  profileInitial,
} = useProfile(session)

const wellbeingExercises = [
  {
    key: 'mindfulness-3min',
    title: 'Pleine conscience',
    description:
      'Reviens dans le moment present en 3 minutes, sans pression.',
    durationMinutes: 3,
    audioUrl: '',
  },
  {
    key: 'meditation-5min',
    title: 'Meditation',
    description:
      'Une pause guidee pour vider la tete et repartir plus calme.',
    durationMinutes: 5,
    audioUrl: '',
  },
  {
    key: 'breathing-2min',
    title: 'Respiration',
    description:
      '2 minutes de respiration pour faire redescendre la pression.',
    durationMinutes: 2,
    audioUrl: '',
  },
]

const todaysExercise = computed(() => {
  if (!wellbeingExercises.length) {
    return null
  }
  const today = new Date()
  const index = today.getDay() % wellbeingExercises.length
  return wellbeingExercises[index]
})

const weekStrip = computed(() => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek

  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() + diff)
  startOfWeek.setHours(0, 0, 0, 0)

  const days: {
    key: string
    date: number
    label: string
    isToday: boolean
    hasSession: boolean
  }[] = []

  const sessionSet = new Set(weekSessionDates.value)
  const todayYear = today.getFullYear()
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0')
  const todayDay = String(today.getDate()).padStart(2, '0')
  const todayIso = `${todayYear}-${todayMonth}-${todayDay}`

  for (let i = 0; i < 7; i += 1) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    const isToday = d.toDateString() === today.toDateString()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const dayNum = String(d.getDate()).padStart(2, '0')
    const isoDate = `${year}-${month}-${dayNum}`
    const label = d
      .toLocaleDateString('fr-FR', { weekday: 'short' })
      .replace('.', '')

    days.push({
      key: isoDate,
      date: d.getDate(),
      label,
      isToday,
      hasSession: sessionSet.has(isoDate) && isoDate <= todayIso,
    })
  }

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const format = (date: Date) =>
    date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

  const rangeLabel = `${format(startOfWeek)} - ${format(endOfWeek)}`

  return { days, rangeLabel }
})
const userGreeting = computed(() => {
  const name = displayName.value?.trim()
  if (name) {
    return `HELLO, ${name.toUpperCase()}!`
  }

  const user = session.value?.user
  const emailLocalPart =
    typeof user?.email === 'string' ? user.email.split('@')[0] ?? '' : ''
  if (emailLocalPart) {
    return `HELLO, ${emailLocalPart.toUpperCase()}!`
  }

  return 'HELLO!'
})

const profileEmail = computed(() => {
  const email = session.value?.user?.email
  return typeof email === 'string' ? email : ''
})

const todaySections = computed(() => {
  const sections: {
    key: string
    title: string
    subtitle: string
    progress: number
  }[] = []

  const weeklyPercent = weeklyProgressPercent.value
  sections.push({
    key: 'weekly-sessions',
    title: 'Seances cette semaine',
    subtitle:
      perWeekGoal.value !== null && weeklySessions.value !== null
        ? `${weeklySessions.value}/${perWeekGoal.value} seances realisees`
        : weeklySessions.value !== null && weeklySessions.value > 0
          ? `${weeklySessions.value} seance(s) realisee(s)`
          : 'Pas encore de seance cette semaine',
    progress: weeklyPercent,
  })

  sections.push({
    key: 'weekly-goal',
    title: 'Objectif de la semaine',
    subtitle:
      perWeekGoal.value !== null
        ? `${perWeekGoal.value} seance(s) prevue(s)`
        : "Aucun objectif defini pour l'instant",
    progress: 0,
  })

  sections.push({
    key: 'notifications',
    title: 'Rappels motivation',
    subtitle:
      status.value === 'enabled'
        ? 'Notifications de motivation actives'
        : 'Aucun rappel actif pour le moment',
    progress: status.value === 'enabled' ? 100 : 0,
  })

  sections.push({
    key: 'wellbeing',
    title: 'Pause bien-etre',
    subtitle: todaysExercise.value?.title ?? 'Exercice bien-etre du jour',
    progress: 0,
  })

  return sections
})

const isAddSessionDialogOpen = ref(false)
const isAdjustGoalDialogOpen = ref(false)
const goalDraft = ref<number | null>(null)

const isWellbeingDialogOpen = ref(false)
const isWellbeingPlayerOpen = ref(false)
const activeExerciseKey = ref<string | null>(null)

const isProfileOpen = computed(() => route.name === 'profile')

const isMonthCalendarOpen = ref(false)
const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth())
const calendarSessionDates = ref<string[]>([])
const calendarTouchStartX = ref<number | null>(null)

const snackbarMessage = ref<string | null>(null)
const snackbarType = ref<'success' | 'error' | null>(null)
let snackbarTimeout: number | null = null

const activeExercise = computed(() => {
  if (!activeExerciseKey.value) {
    return null
  }
  return (
    wellbeingExercises.find((exercise) => exercise.key === activeExerciseKey.value) ?? null
  )
})

function showSnackbar(message: string, type: 'success' | 'error' = 'success') {
  snackbarMessage.value = message
  snackbarType.value = type

  if (snackbarTimeout !== null) {
    window.clearTimeout(snackbarTimeout)
  }

  snackbarTimeout = window.setTimeout(() => {
    if (snackbarMessage.value === message) {
      snackbarMessage.value = null
      snackbarType.value = null
    }
  }, 3000)
}

const calendarMonthLabel = computed(() => {
  const base = new Date(calendarYear.value, calendarMonth.value, 1)
  return base.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
})

const calendarCells = computed(() => {
  const year = calendarYear.value
  const monthIndex = calendarMonth.value

  const first = new Date(year, monthIndex, 1)
  const firstWeekday = (first.getDay() + 6) % 7 // 0 = lundi
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0')
  const todayDay = String(today.getDate()).padStart(2, '0')
  const todayIso = `${todayYear}-${todayMonth}-${todayDay}`
  const sessionSet = new Set(calendarSessionDates.value)

  const cells: {
    key: string
    date: number | null
    iso: string | null
    isToday: boolean
    hasSession: boolean
  }[] = []

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({
      key: `blank-${i}`,
      date: null,
      iso: null,
      isToday: false,
      hasSession: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(year, monthIndex, day)
    const dYear = d.getFullYear()
    const dMonth = String(d.getMonth() + 1).padStart(2, '0')
    const dDay = String(d.getDate()).padStart(2, '0')
    const iso = `${dYear}-${dMonth}-${dDay}`
    const isToday = iso === todayIso
    const hasSession = sessionSet.has(iso)

    cells.push({
      key: iso,
      date: day,
      iso,
      isToday,
      hasSession,
    })
  }

  while (cells.length % 7 !== 0) {
    const idx = cells.length
    cells.push({
      key: `blank-tail-${idx}`,
      date: null,
      iso: null,
      isToday: false,
      hasSession: false,
    })
  }

  return cells
})

const motivationMessages = [
  {
    key: 'focus',
    title: 'Motivation du jour',
    body: 'Ton corps est capable de beaucoup plus que tu ne le penses. C\'est ton esprit qu\'il faut convaincre.',
  },
  {
    key: 'consistency',
    title: 'Motivation du jour',
    body: 'Une seance aujourd\'hui vaut mieux qu\'un objectif parfait demain. Avance d\'un petit pas.',
  },
  {
    key: 'identity',
    title: 'Motivation du jour',
    body: 'Tu n\'as pas besoin d\'etre parfait. Tu as juste besoin d\'etre quelqu\'un qui se presente pour lui-meme.',
  },
]

const todaysMotivation = computed(() => {
  if (!motivationMessages.length) {
    return null
  }
  const today = new Date()
  const index = today.getDate() % motivationMessages.length
  return motivationMessages[index]
})

async function onEnableNotifications() {
  if (!isPushSupported) {
    status.value = 'error'
    errorMessage.value = 'Notifications non supportees sur ce navigateur.'
    return
  }
  status.value = 'requesting'
  errorMessage.value = null
  try {
    const enabled = await enablePushNotifications()
    status.value = enabled ? 'enabled' : 'idle'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = "Impossible d'activer les notifications."
  }
}

function startWellbeingExercise() {
  if (!todaysExercise.value) {
    return
  }
}

function onTodayRowClick(key: string) {
  if (key === 'weekly-sessions') {
    isAddSessionDialogOpen.value = true
    return
  }

  if (key === 'weekly-goal') {
    const base =
      perWeekGoal.value && perWeekGoal.value > 0 ? perWeekGoal.value : 3
    goalDraft.value = base
    isAdjustGoalDialogOpen.value = true
    return
  }

  if (key === 'wellbeing') {
    isWellbeingDialogOpen.value = true
  }
}

async function confirmAddSessionFromDialog() {
  await recordSession()
  isAddSessionDialogOpen.value = false
}

async function confirmRemoveSessionFromDialog() {
  await removeLastSession()
  isAddSessionDialogOpen.value = false
}

function changeGoalDraft(delta: number) {
  const current = goalDraft.value ?? perWeekGoal.value ?? 3
  const next = Math.min(14, Math.max(1, current + delta))
  goalDraft.value = next
}

async function confirmAdjustGoalFromDialog() {
  const target = goalDraft.value ?? perWeekGoal.value ?? 1
  const current = perWeekGoal.value ?? 0
  const delta = target - current

  if (delta !== 0) {
    await changeGoal(delta)
  }

  isAdjustGoalDialogOpen.value = false
}

function openExercisePlayer(key: string) {
  activeExerciseKey.value = key
  isWellbeingDialogOpen.value = false
  isWellbeingPlayerOpen.value = true
}

async function openMonthCalendar() {
  const now = new Date()
  calendarYear.value = now.getFullYear()
  calendarMonth.value = now.getMonth()
  isMonthCalendarOpen.value = true
  try {
    calendarSessionDates.value = await getMonthSessionDates(
      calendarYear.value,
      calendarMonth.value,
    )
  } catch (error) {
    const msg = (error as { message?: string }).message ?? ''
    if (!msg.includes('NetworkError when attempting to fetch resource')) {
      // eslint-disable-next-line no-console
      console.error('Error loading month sessions in openMonthCalendar', error)
    }
    calendarSessionDates.value = []
  }
}

async function changeCalendarMonth(delta: number) {
  let year = calendarYear.value
  let monthIndex = calendarMonth.value + delta

  if (monthIndex < 0) {
    monthIndex = 11
    year -= 1
  } else if (monthIndex > 11) {
    monthIndex = 0
    year += 1
  }

  calendarYear.value = year
  calendarMonth.value = monthIndex
  calendarSessionDates.value = await getMonthSessionDates(year, monthIndex)
}

function onCalendarTouchStart(event: TouchEvent) {
  if (!event.touches.length) return
  const touch = event.touches.item(0)
  if (!touch) return
  calendarTouchStartX.value = touch.clientX
}

function onCalendarTouchEnd(event: TouchEvent) {
  if (calendarTouchStartX.value === null || !event.changedTouches.length) {
    return
  }
  const touch = event.changedTouches.item(0)
  if (!touch) return
  const deltaX = touch.clientX - calendarTouchStartX.value
  const threshold = 40
  if (deltaX > threshold) {
    void changeCalendarMonth(-1)
  } else if (deltaX < -threshold) {
    void changeCalendarMonth(1)
  }
  calendarTouchStartX.value = null
}

async function onSaveDisplayNameFromProfile() {
  const previousError = profileError.value
  await saveDisplayName()

  if (!profileError.value) {
    showSnackbar('Pseudo mis a jour', 'success')
  } else if (profileError.value !== previousError || profileError.value) {
    showSnackbar(
      profileError.value ?? "Erreur lors de la mise a jour du pseudo.",
      'error',
    )
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (
      isAddSessionDialogOpen.value ||
      isAdjustGoalDialogOpen.value ||
      isWellbeingDialogOpen.value ||
      isWellbeingPlayerOpen.value ||
      isMonthCalendarOpen.value ||
      isProfileOpen.value
    ) {
      isAddSessionDialogOpen.value = false
      isAdjustGoalDialogOpen.value = false
      isWellbeingDialogOpen.value = false
      isWellbeingPlayerOpen.value = false
      isMonthCalendarOpen.value = false
      if (isProfileOpen.value) {
        router.push({ name: 'today' })
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

</script>

<template>
  <main class="app">
    <header class="topbar">
      <h1 class="brand">Motivly</h1>
      <div v-if="isAuthenticated" class="topbar-right">
        <button
          type="button"
          class="avatar-button"
          @click="router.push({ name: 'profile' })"
        >
          <span class="avatar-circle">
            {{ profileInitial }}
          </span>
        </button>
      </div>
    </header>

    <WeekStrip
      v-if="isAuthenticated"
      :greeting="userGreeting"
      :range-label="weekStrip.rangeLabel"
      :days="weekStrip.days"
      @open-month-calendar="openMonthCalendar"
    />

    <RouterView v-slot="{ Component, route }">
      <component
        v-if="route.name === 'profile'"
        :is="Component"
        :display-name="displayName"
        :profile-email="profileEmail"
        :profile-initial="profileInitial"
        :is-profile-loading="isProfileLoading"
        :is-profile-saving="isProfileSaving"
        :profile-error="profileError"
        :is-push-supported="isPushSupported"
        :is-loading-notifications="isLoadingNotifications"
        :notifications-status="status"
        :notifications-error="errorMessage"
        :on-update-display-name="(value: string) => { displayName = value }"
        :on-save-display-name="onSaveDisplayNameFromProfile"
        :on-enable-notifications="onEnableNotifications"
        :on-sign-out="signOut"
        :on-close="() => router.push({ name: 'today' })"
      />
      <component
        v-else
        :is="Component"
        :is-authenticated="isAuthenticated"
        :is-login-mode="isLoginMode"
        :email="email"
        :password="password"
        :auth-message="authMessage"
        :auth-error="authError"
        :is-auth-loading="isAuthLoading"
        :submit-label="submitLabel"
        :submit-loading-label="submitLoadingLabel"
        :switch-label="switchLabel"
        :todays-motivation="todaysMotivation"
        :today-sections="todaySections"
        :per-week-goal="perWeekGoal"
        :weekly-sessions="weeklySessions"
        :weekly-progress-percent="weeklyProgressPercent"
        :weekly-status-label="weeklyStatusLabel"
        :is-push-supported="isPushSupported"
        :is-loading-notifications="isLoadingNotifications"
        :notifications-status="status"
        :notifications-error="errorMessage"
        :todays-exercise="todaysExercise"
        :on-update-email="(value: string) => { email = value }"
        :on-update-password="(value: string) => { password = value }"
        :submit-auth="submitAuth"
        :toggle-auth-mode="toggleAuthMode"
        :on-today-row-click="onTodayRowClick"
        :on-enable-notifications="onEnableNotifications"
        :start-wellbeing-exercise="startWellbeingExercise"
      />
    </RouterView>

    <AddSessionDialog
      v-if="isAddSessionDialogOpen"
      :is-saving-session="isSavingSession"
      :weekly-sessions="weeklySessions"
      @close="isAddSessionDialogOpen = false"
      @confirm-add="confirmAddSessionFromDialog"
      @confirm-remove="confirmRemoveSessionFromDialog"
    />

    <MonthCalendarDialog
      v-if="isMonthCalendarOpen"
      :month-label="calendarMonthLabel"
      :cells="calendarCells"
      @close="isMonthCalendarOpen = false"
      @prev-month="changeCalendarMonth(-1)"
      @next-month="changeCalendarMonth(1)"
      @touch-start="onCalendarTouchStart"
      @touch-end="onCalendarTouchEnd"
    />

    <WellbeingDialog
      v-if="isWellbeingDialogOpen"
      :exercises="wellbeingExercises"
      @close="isWellbeingDialogOpen = false"
      @select="openExercisePlayer"
    />

    <WellbeingPlayerDialog
      v-if="isWellbeingPlayerOpen"
      :exercise="activeExercise"
      @close="isWellbeingPlayerOpen = false"
    />

    <AdjustGoalDialog
      v-if="isAdjustGoalDialogOpen"
      :goal-draft="goalDraft"
      :per-week-goal="perWeekGoal"
      :is-saving="isSavingSession"
      @close="isAdjustGoalDialogOpen = false"
      @change-draft="changeGoalDraft"
      @confirm="confirmAdjustGoalFromDialog"
    />

    <nav v-if="isAuthenticated" class="bottom-nav">
      <button
        type="button"
        :class="['nav-item', { 'is-active': route.name === 'today' }]"
        @click="router.push({ name: 'today' })"
      >
        <i class="pi pi-home nav-icon" aria-hidden="true"></i>
        <span class="nav-label">Accueil</span>
      </button>
      <button
        type="button"
        :class="['nav-item', { 'is-active': route.name === 'progress' }]"
        @click="router.push({ name: 'progress' })"
      >
        <i class="pi pi-chart-line nav-icon" aria-hidden="true"></i>
        <span class="nav-label">Progression</span>
      </button>
      <button type="button" class="nav-item">
        <i class="pi pi-bell nav-icon" aria-hidden="true"></i>
        <span class="nav-label">Notif</span>
      </button>
      <button type="button" class="nav-item">
        <i class="pi pi-dumbbell nav-icon" aria-hidden="true"></i>
        <span class="nav-label">Seances</span>
      </button>
      <button
        type="button"
        :class="['nav-item', { 'is-active': route.name === 'profile' }]"
        @click="router.push({ name: 'profile' })"
      >
        <i class="pi pi-user nav-icon" aria-hidden="true"></i>
        <span class="nav-label">Profil</span>
      </button>
    </nav>
    <div
      v-if="snackbarMessage"
      :class="['snackbar', snackbarType === 'error' ? 'snackbar-error' : 'snackbar-success']"
    >
      {{ snackbarMessage }}
    </div>
  </main>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: stretch;
  justify-content: flex-start;
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.25rem 0.25rem 0;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.brand {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.avatar-button {
  border-radius: 999px;
  border: none;
  padding: 0;
  background: transparent;
}
.avatar-circle {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  background: radial-gradient(circle at top left, #16a34a, #22c55e);
  color: #020617;
  box-shadow: 0 10px 24px rgba(22, 163, 74, 0.65);
}
.link {
  background: transparent;
  border: none;
  padding: 0;
  color: #e5e7eb;
}
.link-small {
  font-size: 0.75rem;
  opacity: 0.85;
}
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
.week-strip {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.2rem 1.1rem;
  border-radius: 1.75rem;
  background: radial-gradient(circle at top left, #16a34a1a, transparent 55%), #050816;
  border: none;
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.9);
}
.week-strip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.week-strip-greeting {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.week-strip-icons {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(229, 231, 235, 0.8);
}
.icon-button {
  border-radius: 999px;
  border: none;
  background: transparent;
  padding: 0.1rem 0.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}
.week-strip-range {
  margin: 0;
  font-size: 0.78rem;
  opacity: 0.75;
}
.week-strip-days {
  margin-top: 0.85rem;
  padding: 0.55rem 0.7rem;
  border-radius: 999px;
  background: #111827;
  display: flex;
  justify-content: space-between;
  gap: 0.4rem;
}
.week-day {
  flex: 1;
  min-width: 0;
  border-radius: 999px;
  border: none;
  background: #1f2937;
  padding: 0.25rem 0.25rem 0.3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #e5e7eb;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
}
.week-day-date {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid #4b5563;
  background: #020617;
  font-size: 0.8rem;
  font-weight: 600;
}
.week-day-label {
  font-size: 0.65rem;
  margin-bottom: 0.1rem;
  color: #d1d5db;
}
.week-day.is-today {
  background: #30e097;
  color: #022c22 !important;
}
.week-day.is-today .week-day-date {
  background: #f9fafb;
  border-color: #f9fafb;
  color: #27272a;
}
.week-day.is-today .week-day-label {
  color: #022c22 !important;
}
.week-day-check {
  margin-top: 0.15rem;
  font-size: 0.65rem;
}
.calendar-card {
  max-width: 380px;
}
.calendar-nav {
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.calendar-nav-btn {
  border-radius: 999px;
  border: 1px solid #27272a;
  background: transparent;
  padding: 0.2rem 0.45rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e5e7eb;
}
.calendar-nav-hint {
  flex: 1;
  text-align: center;
  font-size: 0.75rem;
  opacity: 0.7;
}
.calendar-grid {
  margin-top: 0.75rem;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.25rem;
}
.calendar-weekday {
  font-size: 0.7rem;
  text-align: center;
  opacity: 0.7;
}
.calendar-cell {
  min-height: 32px;
  border-radius: 999px;
  border: 1px solid #27272a;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.05rem;
  color: #e5e7eb;
}
.calendar-cell.is-blank {
  border-color: transparent;
  background: transparent;
}
.calendar-cell.has-session:not(.is-today) {
  background: #e5e7eb;
  color: #050505;
}
.calendar-cell.is-today {
  background: #30e097;
  color: #050505;
}
.calendar-date {
  font-size: 0.85rem;
}
.calendar-check {
  font-size: 0.6rem;
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
.bottom-nav {
  max-width: 420px;
  margin: 0.25rem auto 0;
  padding: 0.45rem 0.75rem 0.5rem;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.96);
  border: 1px solid #262626;
  display: flex;
  justify-content: space-between;
  gap: 0.4rem;
  position: sticky;
  bottom: 0.75rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(16px);
}
.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: none;
  background: transparent;
  padding: 0.14rem 0.7rem;
  color: rgba(209, 213, 219, 0.9);
  font-size: 0.75rem;
  box-shadow: none;
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    transform 0.08s ease;
}
.nav-item:hover {
  background: rgba(31, 41, 55, 0.9);
}
.nav-item:active {
  transform: translateY(1px);
}
.nav-item.is-active {
  background: #f9fafb;
  color: #0b0f19;
}
.nav-icon {
  font-size: 1.05rem;
}
.nav-label {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.7rem;
  line-height: 1;
  text-align: center;
}

.snackbar {
  position: fixed;
  left: 50%;
  bottom: 1.5rem;
  transform: translateX(-50%);
  padding: 0.55rem 1rem;
  border-radius: 999px;
  font-size: 0.8rem;
  background: #111827;
  border: 1px solid rgba(148, 163, 184, 0.7);
  color: #e5e7eb;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.9);
  z-index: 50;
}
.snackbar-success {
  border-color: #22c55e;
}
.snackbar-error {
  border-color: #f97373;
  color: #fee2e2;
}

@media (max-width: 640px) {
  .app {
    gap: 1.25rem;
  }

  .card {
    padding: 1.25rem 1.1rem 1.1rem;
  }

  .brand {
    font-size: 1.5rem;
  }
}
</style>
