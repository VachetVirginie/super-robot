<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { enablePushNotifications, isPushSupported } from './pushNotifications'
import { useAuth } from './composables/useAuth'
import { useTodayStats, type RecordSessionOptions } from './composables/useTodayStats'
import { useWeeklySlots } from './composables/useWeeklySlots'
import { useProfile } from './composables/useProfile'
import { useCheckins } from './composables/useCheckins'
import type { CalendarCell } from './types'
import { useStressReasons } from './composables/useStressReasons'
import { useRituals } from './composables/useRituals'
import { useDailyPlan, type TodaySlot, type DailyIntention } from './composables/useDailyPlan'
import { useMorningState } from './composables/useMorningState'
import { pickWorkoutTemplate, type WorkoutKind, WORKOUT_TEMPLATES } from './workoutCatalog'
import WeekStrip from './components/WeekStrip.vue'
import AddSessionDialog from './components/AddSessionDialog.vue'
import WeeklySessionsDialog from './components/WeeklySessionsDialog.vue'
import MonthCalendarDialog from './components/MonthCalendarDialog.vue'
import WellbeingDialog from './components/WellbeingDialog.vue'
import WellbeingPlayerDialog from './components/WellbeingPlayerDialog.vue'
import AdjustGoalDialog from './components/AdjustGoalDialog.vue'
import PlanWeekDialog from './components/PlanWeekDialog.vue'
import WorkoutPlayerDialog from './components/WorkoutPlayerDialog.vue'
import MorningDialog from './components/MorningFlowDialog.vue'
import EveningDialog from './components/EveningFlowDialog.vue'

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
  requestPasswordReset,
  signOut,
} = useAuth()

const {
  weeklySessions,
  perWeekGoal,
  isSavingSession,
  weeklyProgressPercent,
  weeklyStatusLabel,
  latestSessionsDisplay,
  latestSessionsDetail,
  recordSession,
  changeGoal,
  removeLastSession,
  weekSessionDates,
  weeklyMinutes,
  weeklyActiveDays,
  weeklyByKind,
  getMonthSessionDates,
  recordSessionForDate,
  removeSessionForDate,
} = useTodayStats(session)

const selectedDuration = ref<5 | 10 | 15 | 20 | 30>(10)
const selectedKind = ref<WorkoutKind | 'auto'>('mixed')
const isWorkoutPlayerOpen = ref(false)
const activeWorkoutTemplateKey = ref<string | null>(null)

const {
  slots: weeklySlots,
  isWeeklySlotsLoading,
  weeklySlotsError,
  saveWeeklySlots,
} = useWeeklySlots(session)

const {
  displayName,
  isProfileLoading,
  isProfileSaving,
  profileError,
  saveDisplayName,
  profileInitial,
} = useProfile(session)

const {
  todayCheckin,
  isCheckinSaving,
  checkinError,
  recordCheckin,
  weeklyAverageStress,
  weeklyCheckinsCount,
  weeklyStressByDay,
  getMonthStressByDay,
} = useCheckins(session)

const {
  reasons: stressReasons,
  isLoadingReasons: isLoadingStressReasons,
  isSavingReason: isSavingStressReason,
  reasonsError: stressReasonsError,
  saveStressReason,
  updateStressReason,
  deleteStressReason,
} = useStressReasons(session)

const {
  ritualsByMoment,
  isLoadingRituals,
  isSavingRitual,
  ritualsError,
  upsertRitual,
} = useRituals(session)

const {
  todaySlot,
  todayIntention,
  isDailyPlanLoading,
  isDailyPlanSaving,
  dailyPlanError,
  saveDailyPlan,
} = useDailyPlan(session)

const {
  todayMorningState,
  saveMorningState,
  weeklyAverageMorningMood,
  weeklyAverageMorningEnergy,
  weeklyMorningPriorities,
} = useMorningState(session)

const todayCheckinSummary = computed(() => {
  const c = todayCheckin.value
  if (!c) {
    return 
  }
  const level = typeof c.stress_level === 'number' ? c.stress_level : null
  if (level === null) {
    return 'Check-in enregistre pour aujourdhui.'
  }
  return `Niveau de stress: ${level}/5 aujourdhui.`
})

const hasTodayCheckin = computed(() => !!todayCheckin.value)

const todayMorningSummary = computed(() => {
  const row = todayMorningState.value
  if (!row) {
    return null as string | null
  }

  const mood = typeof row.mood_level === 'number' ? row.mood_level : null
  const energy = typeof row.energy_level === 'number' ? row.energy_level : null
  const priorities = row.priorities ?? []

  const priorityLabels: Record<string, string> = {
    work: 'Travail',
    relax: 'Se detendre',
    family: 'Famille',
    friends: 'Amis',
    selfcare: 'Prendre soin de toi',
    health: 'Condition physique',
  }

  const firstPriorityKey = priorities[0]
  const firstPriorityLabel =
    typeof firstPriorityKey === 'string'
      ? priorityLabels[firstPriorityKey] ?? firstPriorityKey
      : null

  const parts: string[] = []
  if (mood !== null) {
    parts.push(`humeur ${mood}/5`)
  }
  if (energy !== null) {
    parts.push(`energie ${energy}/5`)
  }
  if (firstPriorityLabel) {
    parts.push(`priorite : ${firstPriorityLabel}`)
  }

  if (!parts.length) {
    return 'Tu as deja pris un moment pour poser ton matin aujourdhui.'
  }

  return `Ce matin, tu as indique ${parts.join(', ')}.`
})

function updateSelectedDuration(value: 5 | 10 | 15 | 20 | 30) {
  selectedDuration.value = value
}

type DialogWorkoutKindForHandler =
  | WorkoutKind
  | 'auto'

function updateSelectedKind(value: DialogWorkoutKindForHandler) {
  selectedKind.value = value
}

const calendarMonthStressSummary = computed(() => {
  const entries = Object.values(calendarStressByDay.value)
  if (!entries.length) {
    return { avg: null as number | null, count: 0 }
  }

  let totalCount = 0
  let weightedSum = 0
  for (const info of entries) {
    totalCount += info.count
    weightedSum += info.avg * info.count
  }

  if (!totalCount) {
    return { avg: null, count: 0 }
  }

  const avg = Math.round(((weightedSum / totalCount) || 0) * 10) / 10
  return { avg, count: totalCount }
})

const todayCheckinLevel = computed(() => {
  const c = todayCheckin.value
  return typeof c?.stress_level === 'number' ? c.stress_level : null
})

const thermoLast3Days = computed(() => {
  const today = new Date()
  const sessionDays = new Set(weekSessionDates.value ?? [])
  const stressByDay = weeklyStressByDay.value ?? {}

  const days: {
    iso: string
    weekday: string
    stress: number | null
    hasSession: boolean
  }[] = []

  for (let offset = 2; offset >= 0; offset -= 1) {
    const d = new Date(today)
    d.setDate(today.getDate() - offset)

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const dayNum = String(d.getDate()).padStart(2, '0')
    const iso = `${year}-${month}-${dayNum}`

    const weekday = d
      .toLocaleDateString('fr-FR', { weekday: 'short' })
      .replace('.', '')

    const info = (stressByDay as Record<string, { avg: number; count: number }>)[iso]
    const stress = typeof info?.avg === 'number' ? info.avg : null
    const hasSession = sessionDays.has(iso)

    days.push({ iso, weekday, stress, hasSession })
  }

  return days
})

const thermoStats = computed(() => {
  const days = thermoLast3Days.value

  const stressValues = days
    .map((d) => d.stress)
    .filter((v): v is number => typeof v === 'number')

  const avgStress =
    stressValues.length === 0
      ? null
      : Math.round(
          (stressValues.reduce((acc, v) => acc + v, 0) / stressValues.length) * 10,
        ) / 10

  const sessionsCount = days.filter((d) => d.hasSession).length
  const sosCount = 0

  return { avgStress, sessionsCount, sosCount }
})

const thermoScore = computed(() => {
  const { avgStress, sessionsCount, sosCount } = thermoStats.value
  if (avgStress == null) {
    return null
  }

  const movementBonus = sessionsCount * 0.5
  const sosPenalty = sosCount * 0.5

  const raw = avgStress + sosPenalty - movementBonus
  return Math.round(raw * 10) / 10
})

const thermoState = computed<'green' | 'orange' | 'red'>(() => {
  const score = thermoScore.value
  if (score == null) {
    return 'green'
  }
  if (score < 2.8) {
    return 'green'
  }
  if (score < 3.5) {
    return 'orange'
  }
  return 'red'
})

const thermoTitle = computed(() => {
  const state = thermoState.value
  if (state === 'green') {
    return 'Tu sembles plutot bien ces derniers jours 🌿'
  }
  if (state === 'orange') {
    return 'Un peu de charge en ce moment'
  }
  return 'On traverse une periode tendue ❤️‍🩹'
})

const thermoSuggestion = computed(() => {
  const state = thermoState.value
  if (state === 'green') {
    return 'Tu peux choisir un petit moment qui te fait du bien aujourdhui.'
  }
  if (state === 'orange') {
    return "Aujourdhui, un geste simple suffit : une mini pause ou un peu de mouvement."
  }
  return 'Priorite au calme. On te propose une respiration de 2 minutes.'
})

const thermoCtaLabel = computed(() => {
  const state = thermoState.value
  if (state === 'green') {
    return 'Faire une mini-seance'
  }
  if (state === 'orange') {
    return 'Faire une pause douce'
  }
  return 'Lancer une respiration 2 min'
})

const thermoSeries = computed(() =>
  thermoLast3Days.value.map((d) => ({
    label: d.weekday,
    value: d.stress,
  })),
)

const isMentalThermoOpen = ref(false)

function openMentalThermo() {
  if (!isAuthenticated) return
  isMentalThermoOpen.value = true
}

function closeMentalThermo() {
  isMentalThermoOpen.value = false
}

function onThermoCtaClick() {
  const state = thermoState.value

  if (state === 'green') {
    selectedDuration.value = 5
    selectedKind.value = 'auto'
    if (!isAuthenticated) return
    isAddSessionDialogOpen.value = true
    isMentalThermoOpen.value = false
    return
  }

  if (state === 'orange') {
    router.push({ name: 'pause' })
    isMentalThermoOpen.value = false
    return
  }

  router.push({ name: 'pause', query: { auto: '1' } })
  isMentalThermoOpen.value = false
}

function onThermoZenClick() {
  if (!isAuthenticated) return
  startWellbeingExercise()
  isMentalThermoOpen.value = false
}

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
    plannedCount: number
    doneCount: number
  }[] = []

  const sessionCountsByDate = new Map<string, number>()
  for (const iso of weekSessionDates.value) {
    const prev = sessionCountsByDate.get(iso) ?? 0
    sessionCountsByDate.set(iso, prev + 1)
  }
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

    const actualCount = sessionCountsByDate.get(isoDate) ?? 0
    const plannedForDay = weeklySlots.value.filter((slot) => slot.dayIndex === i).length

    let plannedCount = plannedForDay
    let doneCount = 0

    if (plannedForDay > 0) {
      doneCount = Math.min(plannedForDay, actualCount)
    } else if (actualCount > 0) {
      // Pas de planning formel pour ce jour, mais des seances :
      plannedCount = 1
      doneCount = 1
    }

    const hasSession = actualCount > 0 && isoDate <= todayIso

    days.push({
      key: isoDate,
      date: d.getDate(),
      label,
      isToday,
      hasSession,
      plannedCount,
      doneCount,
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

  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0')
  const todayDay = String(today.getDate()).padStart(2, '0')
  const todayIso = `${todayYear}-${todayMonth}-${todayDay}`

  const sessionsTodayCount = weekSessionDates.value.filter((iso) => iso === todayIso).length

  const dayOfWeek = today.getDay()
  const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const plannedToday = weeklySlots.value.filter((slot) => slot.dayIndex === todayIndex).length

  let todayProgress = 0
  if (plannedToday > 0) {
    const ratio = Math.max(0, Math.min(1, sessionsTodayCount / plannedToday))
    todayProgress = Math.round(ratio * 100)
  } else if (sessionsTodayCount > 0) {
    todayProgress = 100
  }

  let todaySubtitle: string
  if (plannedToday > 0) {
    if (sessionsTodayCount === 0) {
      todaySubtitle = `Tu as prevu ${plannedToday} seance(s) pour aujourd'hui. On peut en faire une petite quand tu veux.`
    } else {
      const done = Math.min(sessionsTodayCount, plannedToday)
      todaySubtitle = `${done}/${plannedToday} seance(s) prevue(s) deja faites aujourd'hui.`
    }
  } else {
    todaySubtitle =
      sessionsTodayCount > 0
        ? `${sessionsTodayCount} seance(s) deja faites aujourd'hui, bravo.`
        : "Pas encore de seance aujourd'hui. On peut toujours commencer par quelque chose de tres court."
  }

  sections.push({
    key: 'today-sessions',
    title: "Bouger aujourd'hui",
    subtitle: todaySubtitle,
    progress: todayProgress,
  })

  const weeklyPercent = weeklyProgressPercent.value
  sections.push({
    key: 'weekly-sessions',
    title: 'Bouger cette semaine',
    subtitle:
      perWeekGoal.value !== null && weeklySessions.value !== null
        ? `Tu as fait ${weeklySessions.value} seance(s) sur ${perWeekGoal.value} prevues cette semaine.`
        : weeklySessions.value !== null && weeklySessions.value > 0
          ? `Tu as deja fait ${weeklySessions.value} seance(s) cette semaine.`
          : 'Pas encore de seance cette semaine. On peut en ajouter une petite.',
    progress: weeklyPercent,
  })

  return sections
})

const isAddSessionDialogOpen = ref(false)
const isWeeklySessionsDialogOpen = ref(false)
const isAdjustGoalDialogOpen = ref(false)
const goalDraft = ref<number | null>(null)

const isMorningDialogOpen = ref(false)
const isEveningDialogOpen = ref(false)
const isWellbeingDialogOpen = ref(false)
const isWellbeingPlayerOpen = ref(false)
const activeExerciseKey = ref<string | null>(null)

const isProfileOpen = computed(() => route.name === 'profile')

const isMonthCalendarOpen = ref(false)
const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth())
const calendarSessionDates = ref<string[]>([])
const calendarStressByDay = ref<Record<string, { avg: number; count: number }>>({})
const calendarTouchStartX = ref<number | null>(null)

const snackbarMessage = ref<string | null>(null)
const snackbarType = ref<'success' | 'error' | null>(null)
let snackbarTimeout: number | null = null

const isPlanWeekDialogOpen = ref(false)

function openPlanWeekDialog() {
  if (!isAuthenticated) return
  isPlanWeekDialogOpen.value = true
}

function openWeeklySessionsDialog() {
  if (!isAuthenticated) return
  isWeeklySessionsDialogOpen.value = true
}

async function savePlanWeekDialog(slots: { dayIndex: number; timeOfDay: 'morning' | 'afternoon' | 'evening' }[]) {
  await saveWeeklySlots(slots)

  const target = slots.length
  const current = perWeekGoal.value ?? 0
  const delta = target - current

  if (delta > 0) {
    await changeGoal(delta)
  } else if (delta < 0 && current > 0) {
    showSnackbar(
      "Tu as reduit tes moments cette semaine. Ton objectif reste le meme, tu pourras l'ajuster depuis le Bilan si tu veux.",
      'success',
    )
  }

  isPlanWeekDialogOpen.value = false
}

const weeklySessionDays = computed(() => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek

  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() + diff)
  startOfWeek.setHours(0, 0, 0, 0)

  const counts = new Map<string, number>()
  for (const iso of weekSessionDates.value) {
    const prev = counts.get(iso) ?? 0
    counts.set(iso, prev + 1)
  }

  const days: {
    iso: string
    label: string
    sessionsCount: number
    isToday: boolean
  }[] = []

  for (let i = 0; i < 7; i += 1) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const iso = `${year}-${month}-${day}`

    const label = d
      .toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })
      .replace('.', '')

    const sessionsCount = counts.get(iso) ?? 0
    const isToday = d.toDateString() === today.toDateString()

    days.push({ iso, label, sessionsCount, isToday })
  }

  return days
})

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
  const stressMap = calendarStressByDay.value

  const cells: CalendarCell[] = []

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
    const stressInfo = stressMap[iso]
    const hasCheckin = !!stressInfo
    const stressLevel = hasCheckin ? stressInfo.avg : null

    cells.push({
      key: iso,
      date: day,
      iso,
      isToday,
      hasSession,
      hasCheckin,
      stressLevel,
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
    title: 'Petit mot pour toi',
    body: 'Ton corps est capable de beaucoup plus que tu ne le penses. C\'est ton esprit qu\'il faut convaincre.',
  },
  {
    key: 'consistency',
    title: 'Petit mot pour toi',
    body: 'Une seance aujourd\'hui vaut mieux qu\'un objectif parfait demain. Avance d\'un petit pas.',
  },
  {
    key: 'identity',
    title: 'Petit mot pour toi',
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

async function onEveningConfirm(payload: { level: number; note?: string; question?: string }) {
  await submitCheckin(payload.level, payload.note, payload.question)

  if (!checkinError.value) {
    isEveningDialogOpen.value = false
  }
}

async function signOutAndRedirect() {
  await signOut()
  router.push({ name: 'today' })
}

function startWellbeingExercise() {
  router.push({ name: 'pause', query: { auto: '1' } })
}

function onTodayRowClick(key: string) {
  if (key === 'morning-dialog') {
    if (!isAuthenticated) return
    isMorningDialogOpen.value = true
    return
  }

  if (key === 'evening-dialog') {
    if (!isAuthenticated) return
    isEveningDialogOpen.value = true
    return
  }

  if (key === 'today-quick-5') {
    selectedDuration.value = 5
    selectedKind.value = 'auto'
    isAddSessionDialogOpen.value = true
    return
  }

  if (key === 'today-sessions') {
    isAddSessionDialogOpen.value = true
    return
  }

  if (key === 'weekly-sessions') {
    isWeeklySessionsDialogOpen.value = true
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
  const kindForPicker: WorkoutKind | undefined =
    selectedKind.value === 'auto' ? undefined : selectedKind.value

  const template = pickWorkoutTemplate({
    desiredDurationMinutes: selectedDuration.value,
    preferredKind: kindForPicker,
    maxLevel: 2,
  })

  if (!template) {
    await recordSession()
    isAddSessionDialogOpen.value = false
    return
  }

  activeWorkoutTemplateKey.value = template.key
  isWorkoutPlayerOpen.value = true
  isAddSessionDialogOpen.value = false
}

async function confirmRemoveSessionFromDialog() {
  await removeLastSession()
  isAddSessionDialogOpen.value = false
}

async function addSessionForDateFromWeeklyDialog(iso: string) {
  await recordSessionForDate(iso)
}

async function removeSessionForDateFromWeeklyDialog(iso: string) {
  await removeSessionForDate(iso)
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

async function onWorkoutPlayerFinish() {
  const key = activeWorkoutTemplateKey.value

  if (!key) {
    isWorkoutPlayerOpen.value = false
    activeWorkoutTemplateKey.value = null
    return
  }

  const template = WORKOUT_TEMPLATES.find((tpl) => tpl.key === key) ?? null

  if (template) {
    const options: RecordSessionOptions = {
      durationMinutes: template.targetDurationMinutes,
      kind: template.kind,
      templateKey: template.key,
    }

    await recordSession(options)
  }

  isWorkoutPlayerOpen.value = false
  activeWorkoutTemplateKey.value = null
}

function closeWorkoutPlayer() {
  isWorkoutPlayerOpen.value = false
  activeWorkoutTemplateKey.value = null
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
    calendarStressByDay.value = await getMonthStressByDay(
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
    calendarStressByDay.value = {}
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
  calendarStressByDay.value = await getMonthStressByDay(year, monthIndex)
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

async function submitCheckin(stressLevel: number, note?: string, question?: string) {
  const previousError = checkinError.value
  await recordCheckin(stressLevel, note, question)

  if (!checkinError.value) {
    showSnackbar('Check-in bien-etre enregistre', 'success')
  } else if (checkinError.value !== previousError || checkinError.value) {
    showSnackbar(
      checkinError.value ?? 'Erreur lors de lenregistrement du check-in.',
      'error',
    )
  }
}

async function onMorningConfirm(payload: {
  slot: TodaySlot
  intention: DailyIntention
  moodLevel: number | null
  energyLevel: number | null
  priorities: string[]
}) {
  const previousError = dailyPlanError.value
  await saveDailyPlan({ slot: payload.slot, intention: payload.intention })

  // Enregistrement best-effort de l'etat du matin.
  void saveMorningState({
    moodLevel: payload.moodLevel,
    energyLevel: payload.energyLevel,
    priorities: payload.priorities,
  })

  if (!dailyPlanError.value) {
    showSnackbar('Ton plan du jour est pret.', 'success')
    isMorningDialogOpen.value = false
  } else if (dailyPlanError.value !== previousError || dailyPlanError.value) {
    showSnackbar(
      dailyPlanError.value ?? "Impossible d'enregistrer ton plan du jour.",
      'error',
    )
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (
      isAddSessionDialogOpen.value ||
      isWeeklySessionsDialogOpen.value ||
      isAdjustGoalDialogOpen.value ||
      isWellbeingDialogOpen.value ||
      isWellbeingPlayerOpen.value ||
      isMonthCalendarOpen.value ||
      isMorningDialogOpen.value ||
      isEveningDialogOpen.value ||
      isProfileOpen.value
    ) {
      isAddSessionDialogOpen.value = false
      isWeeklySessionsDialogOpen.value = false
      isAdjustGoalDialogOpen.value = false
      isWellbeingDialogOpen.value = false
      isWellbeingPlayerOpen.value = false
      isMonthCalendarOpen.value = false
      isMorningDialogOpen.value = false
      isEveningDialogOpen.value = false
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
      <h1 class="brand">Mouvea</h1>
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
      v-if="isAuthenticated && route.name === 'today'"
      :greeting="userGreeting"
      :range-label="weekStrip.rangeLabel"
      :days="weekStrip.days"
      :thermo-state="thermoState"
      @open-month-calendar="openMonthCalendar"
      @open-thermo="openMentalThermo"
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
        :on-sign-out="signOutAndRedirect"
        :on-close="() => router.push({ name: 'today' })"
        :on-open-week-plan="openPlanWeekDialog"
      />
      <component
        v-else-if="route.name === 'bilan'"
        :is="Component"
        :is-authenticated="isAuthenticated"
        :weekly-sessions="weeklySessions"
        :per-week-goal="perWeekGoal"
        :weekly-progress-percent="weeklyProgressPercent"
        :weekly-status-label="weeklyStatusLabel"
        :weekly-minutes="weeklyMinutes"
        :weekly-active-days="weeklyActiveDays"
        :weekly-by-kind="weeklyByKind"
        :week-session-dates="weekSessionDates"
        :weekly-slots="weeklySlots"
        :is-weekly-slots-loading="isWeeklySlotsLoading"
        :weekly-slots-error="weeklySlotsError"
        :weekly-average-stress="weeklyAverageStress"
        :weekly-checkins-count="weeklyCheckinsCount"
        :weekly-stress-by-day="weeklyStressByDay"
        :stress-reasons="stressReasons"
        :weekly-morning-mood="weeklyAverageMorningMood"
        :weekly-morning-energy="weeklyAverageMorningEnergy"
        :weekly-morning-priorities="weeklyMorningPriorities"
        :on-open-week-plan="openPlanWeekDialog"
        :on-open-weekly-sessions="openWeeklySessionsDialog"
      />
      <component
        v-else-if="route.name === 'semaine'"
        :is="Component"
        :is-authenticated="isAuthenticated"
        :per-week-goal="perWeekGoal"
        :weekly-slots="weeklySlots"
        :is-weekly-slots-loading="isWeeklySlotsLoading"
        :weekly-slots-error="weeklySlotsError"
        :weekly-sessions="weeklySessions"
        :on-open-week-plan="openPlanWeekDialog"
        :on-open-weekly-sessions="openWeeklySessionsDialog"
      />
      <component
        v-else-if="route.name === 'rituels'"
        :is="Component"
        :is-authenticated="isAuthenticated"
        :rituals-by-moment="ritualsByMoment"
        :is-loading-rituals="isLoadingRituals"
        :is-saving-ritual="isSavingRitual"
        :rituals-error="ritualsError"
        :upsert-ritual="upsertRitual"
      />
      <component
        v-else-if="route.name === 'seances'"
        :is="Component"
        :is-authenticated="isAuthenticated"
        :weekly-sessions="weeklySessions"
        :per-week-goal="perWeekGoal"
        :weekly-progress-percent="weeklyProgressPercent"
        :weekly-status-label="weeklyStatusLabel"
        :weekly-minutes="weeklyMinutes"
        :weekly-active-days="weeklyActiveDays"
        :weekly-by-kind="weeklyByKind"
        :latest-sessions-display="latestSessionsDisplay"
        :latest-sessions-detail="latestSessionsDetail"
        @replay-template="(key: string) => { activeWorkoutTemplateKey = key; isWorkoutPlayerOpen = true }"
      />
      <component
        v-else-if="route.name === 'stress'"
        :is="Component"
        :is-authenticated="isAuthenticated"
        :reasons="stressReasons"
        :is-loading-reasons="isLoadingStressReasons"
        :reasons-error="stressReasonsError"
        :is-saving-reason="isSavingStressReason"
        :delete-stress-reason="deleteStressReason"
        :update-stress-reason="updateStressReason"
      />
      <component
        v-else-if="route.name === 'pause'"
        :is="Component"
        :is-authenticated="isAuthenticated"
        :is-saving-stress-reason="isSavingStressReason"
        :save-stress-reason="saveStressReason"
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
        :today-checkin-summary="todayCheckinSummary"
        :per-week-goal="perWeekGoal"
        :weekly-sessions="weeklySessions"
        :weekly-progress-percent="weeklyProgressPercent"
        :weekly-status-label="weeklyStatusLabel"
        :weekly-slots="weeklySlots"
        :is-weekly-slots-loading="isWeeklySlotsLoading"
        :weekly-slots-error="weeklySlotsError"
        :is-push-supported="isPushSupported"
        :is-loading-notifications="isLoadingNotifications"
        :notifications-status="status"
        :notifications-error="errorMessage"
        :todays-exercise="todaysExercise"
        :is-checkin-saving="isCheckinSaving"
        :checkin-error="checkinError"
        :today-checkin-level="todayCheckinLevel"
        :has-today-checkin="hasTodayCheckin"
        :on-update-email="(value: string) => { email = value }"
        :on-update-password="(value: string) => { password = value }"
        :submit-auth="submitAuth"
        :on-forgot-password="requestPasswordReset"
        :toggle-auth-mode="toggleAuthMode"
        :on-today-row-click="onTodayRowClick"
        :on-enable-notifications="onEnableNotifications"
        :start-wellbeing-exercise="startWellbeingExercise"
        :submit-checkin="submitCheckin"
        :on-open-week-plan="openPlanWeekDialog"
        :today-morning-summary="todayMorningSummary"
      />
    </RouterView>

    <AddSessionDialog
      v-if="isAddSessionDialogOpen"
      :is-saving-session="isSavingSession"
      :weekly-sessions="weeklySessions"
      :selected-duration="selectedDuration"
      :selected-kind="selectedKind"
      @close="isAddSessionDialogOpen = false"
      @update:selected-duration="updateSelectedDuration"
      @update:selected-kind="updateSelectedKind"
      @confirm-add="confirmAddSessionFromDialog"
      @confirm-remove="confirmRemoveSessionFromDialog"
    />

    <WeeklySessionsDialog
      v-if="isWeeklySessionsDialogOpen"
      :is-saving-session="isSavingSession"
      :week-days="weeklySessionDays"
      @close="isWeeklySessionsDialogOpen = false"
      @add-for-date="addSessionForDateFromWeeklyDialog"
      @remove-for-date="removeSessionForDateFromWeeklyDialog"
    />

    <PlanWeekDialog
      v-if="isPlanWeekDialogOpen"
      :initial-slots="weeklySlots"
      @close="isPlanWeekDialogOpen = false"
      @save="savePlanWeekDialog"
    />

    <MorningDialog
      v-if="isMorningDialogOpen"
      :display-name="displayName"
      :per-week-goal="perWeekGoal"
      :weekly-sessions="weeklySessions"
      :initial-slot="todaySlot"
      :initial-intention="todayIntention"
      :is-loading="isDailyPlanLoading"
      :is-saving="isDailyPlanSaving"
      @close="isMorningDialogOpen = false"
      @confirm="onMorningConfirm"
    />

    <EveningDialog
      v-if="isEveningDialogOpen"
      :display-name="displayName"
      :is-saving="isCheckinSaving"
      @close="isEveningDialogOpen = false"
      @confirm="onEveningConfirm"
    />

    <MonthCalendarDialog
      v-if="isMonthCalendarOpen"
      :month-label="calendarMonthLabel"
      :cells="calendarCells"
      :month-avg-stress="calendarMonthStressSummary.avg"
      :month-checkins-count="calendarMonthStressSummary.count"
      @close="isMonthCalendarOpen = false"
      @prev-month="changeCalendarMonth(-1)"
      @next-month="changeCalendarMonth(1)"
      @touch-start="onCalendarTouchStart"
      @touch-end="onCalendarTouchEnd"
    />

    <div
      v-if="isMentalThermoOpen"
      class="thermo-sheet-backdrop"
      @click.self="closeMentalThermo"
    >
      <div class="thermo-sheet">
        <div class="thermo-sheet-handle"></div>

        <div class="thermo-sheet-header">
          <h2 class="thermo-sheet-title">
            {{ thermoTitle }}
          </h2>
          <button
            type="button"
            class="icon-button thermo-sheet-close-button"
            aria-label="Fermer"
            @click="closeMentalThermo"
          >
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>

        <div class="thermo-sheet-stats">
          <div class="thermo-sheet-stat-row">
            <i class="pi pi-megaphone thermo-sheet-icon" aria-hidden="true"></i>
            <span>Stress moyen : {{ thermoStats.avgStress ?? '—' }}/5</span>
          </div>
          <div class="thermo-sheet-stat-row">
            <i class="pi pi-bolt thermo-sheet-icon" aria-hidden="true"></i>
            <span>Seances : {{ thermoStats.sessionsCount }}</span>
          </div>
          <div class="thermo-sheet-stat-row">
            <i class="pi pi-exclamation-circle thermo-sheet-icon" aria-hidden="true"></i>
            <span>Pauses SOS : {{ thermoStats.sosCount }}</span>
          </div>
        </div>

        <div v-if="thermoSeries.length" class="thermo-sheet-sparkline">
          <div
            v-for="point in thermoSeries"
            :key="point.label"
            class="thermo-sheet-spark-bar"
            :style="{
              height: (point.value ? (point.value / 5) * 32 : 4) + 'px',
              opacity: point.value ? 1 : 0.35,
            }"
          >
            <span class="thermo-sheet-spark-label">{{ point.label }}</span>
          </div>
        </div>

        <p class="thermo-sheet-text">
          {{ thermoSuggestion }}
        </p>

        <button
          type="button"
          class="primary thermo-sheet-cta"
          @click="onThermoCtaClick"
        >
          {{ thermoCtaLabel }}
        </button>

        <button
          type="button"
          class="secondary thermo-sheet-cta-secondary"
          @click="onThermoZenClick"
        >
          Faire une session zen
        </button>
      </div>
    </div>

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

    <WorkoutPlayerDialog
      v-if="isWorkoutPlayerOpen"
      :template-key="activeWorkoutTemplateKey"
      @close="closeWorkoutPlayer"
      @finish="onWorkoutPlayerFinish"
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
        <span class="nav-label">Aujourd'hui</span>
      </button>
      <button
        type="button"
        :class="['nav-item', 'nav-item-equilibre', { 'is-active': route.name === 'bilan' }]"
        @click="router.push({ name: 'bilan' })"
      >
        <i class="pi pi-chart-line nav-icon" aria-hidden="true"></i>
        <span class="nav-label">Journal</span>
      </button>
      <button
        type="button"
        :class="['nav-item', 'nav-item-sos', { 'is-active': route.name === 'pause' }]"
        @click="router.push({ name: 'pause' })"
      >
        <span class="nav-sos-circle">
          <i class="pi pi-pause nav-icon" aria-hidden="true"></i>
        </span>
        <span class="nav-label nav-label-sos">Pause</span>
      </button>
            <!-- <button
        type="button"
        :class="['nav-item', { 'is-active': route.name === 'semaine' }]"
        @click="router.push({ name: 'semaine' })"
      >
        <i class="pi pi-calendar-plus nav-icon" aria-hidden="true"></i>
        <span class="nav-label">Planifier</span>
      </button> -->
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
  min-height: 100vh;
  padding-bottom: 4.5rem;
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
.thermo-button {
  border-radius: 999px;
  border: none;
  padding: 0.15rem;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.thermo-dot {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
}
.thermo-dot--green {
  background: #22c55e;
  animation: thermo-breathe 2.5s ease-in-out infinite;
}
.thermo-dot--orange {
  background: #f97316;
  animation: thermo-tilt 2s ease-in-out infinite;
}
.thermo-dot--red {
  background: #ef4444;
  animation: thermo-halo 3s ease-in-out infinite;
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
  color: #020617;
  background: #22c55e;
  border: 1px solid #22c55e;
  box-shadow: 0 14px 35px #22c55e;
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
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.7);
}
.week-strip {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.2rem 1.1rem;
  border-radius: 1.75rem;
  background: #111111;
  border: 1px solid #27272a;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.7);
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

.thermo-sheet-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  z-index: 45;
}
.thermo-sheet {
  width: 100%;
  max-width: 420px;
  border-radius: 1.25rem 1.25rem 0 0;
  padding: 1.25rem 1.3rem 1.4rem;
  background: #111111;
  border-top: 1px solid #27272a;
  box-shadow: 0 -18px 45px rgba(0, 0, 0, 0.9);
}
.thermo-sheet-handle {
  width: 2.5rem;
  height: 0.22rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.65);
  margin: 0 auto 0.9rem;
}
.thermo-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.8rem;
}
.thermo-sheet-title {
  margin: 0;
  font-size: 1rem;
}
.thermo-sheet-close-button {
  color: rgba(148, 163, 184, 0.95);
}
.thermo-sheet-close-button:hover {
  color: #e5e7eb;
}
.thermo-sheet-stats {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}
.thermo-sheet-stat-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
}
.thermo-sheet-icon {
  font-size: 0.85rem;
  opacity: 0.85;
}
.thermo-sheet-sparkline {
  margin: 0.4rem 0 0.9rem;
  display: flex;
  align-items: flex-end;
  gap: 0.3rem;
  height: 32px;
}
.thermo-sheet-spark-bar {
  flex: 1;
  border-radius: 999px;
  background: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #022c22;
  font-weight: 900;
}
.thermo-sheet-spark-label {
  font-size: 0.85rem;
  opacity: 0.9;
}
.thermo-sheet-text {
  margin: 0 0 0.9rem;
  font-size: 0.9rem;
}
.thermo-sheet-cta {
  width: 100%;
  margin-bottom: 0.4rem;
}
.thermo-sheet-cta-secondary {
  width: 100%;
  margin-bottom: 0.4rem;
}

@keyframes thermo-breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.03);
    opacity: 0.92;
  }
}

@keyframes thermo-tilt {
  0%,
  100% {
    transform: rotate(-1deg);
  }
  50% {
    transform: rotate(1deg);
  }
}

@keyframes thermo-halo {
  0% {
    box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.16);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(248, 113, 113, 0.32);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.16);
  }
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
.calendar-cell.stress-low:not(.is-blank) {
  border-color: #22c55e;
}
.calendar-cell.stress-medium:not(.is-blank) {
  border-color: #fbbf24;
}
.calendar-cell.stress-high:not(.is-blank) {
  border-color: #f97316;
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
  width: 100%;
  margin: 0.25rem auto;
  padding: 0.45rem 0.75rem 0.5rem;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.96);
  border: 1px solid #262626;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  gap: 0.4rem;
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
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
.nav-item-sos {
  padding: 0;
  background: transparent;
  box-shadow: none;
}
.nav-sos-circle {
  width: 2.7rem;
  height: 2.7rem;
  margin-top: -1rem;
  border-radius: 999px;
  border: 2px solid #22c55e;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.85),
    0 0 0 1px rgba(34, 197, 94, 0.5);
}
.nav-item-sos .nav-icon {
  font-size: 1.2rem;
  color: #22c55e;
}
.nav-label-sos {
  font-weight: 600;
  font-size: 0.65rem;
  margin-top: 0.15rem;
}
.nav-item:hover {
  background: rgba(31, 41, 55, 0.9);
}
.nav-item:active {
  transform: translateY(1px);
}
.nav-item.is-active {
  background: #05d970;
  color: #0b0f19;
}
.nav-item-sos.is-active,
.nav-item-sos.is-active:hover {
  background: transparent;
  color: #bbf7d0;
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
