<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { enablePushNotifications, isPushSupported } from './pushNotifications'
import { useAuth } from './composables/useAuth'
import { useTodayStats } from './composables/useTodayStats'

const status = ref<'idle' | 'requesting' | 'enabled' | 'error'>('idle')
const errorMessage = ref<string | null>(null)

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
  recordSession,
  changeGoal,
  removeLastSession,
  weekSessionDates,
  getMonthSessionDates,
} = useTodayStats(session)

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

const isMonthCalendarOpen = ref(false)
const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth())
const calendarSessionDates = ref<string[]>([])
const calendarTouchStartX = ref<number | null>(null)

const activeExercise = computed(() => {
  if (!activeExerciseKey.value) {
    return null
  }
  return (
    wellbeingExercises.find((exercise) => exercise.key === activeExerciseKey.value) ?? null
  )
})

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

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (
      isAddSessionDialogOpen.value ||
      isAdjustGoalDialogOpen.value ||
      isWellbeingDialogOpen.value ||
      isWellbeingPlayerOpen.value ||
      isMonthCalendarOpen.value
    ) {
      isAddSessionDialogOpen.value = false
      isAdjustGoalDialogOpen.value = false
      isWellbeingDialogOpen.value = false
      isWellbeingPlayerOpen.value = false
      isMonthCalendarOpen.value = false
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
      <h1 class="brand">SportMotiv</h1>
      <button
        v-if="isAuthenticated"
        type="button"
        class="link link-small"
        @click="signOut"
      >
        Se deconnecter
      </button>
    </header>

    <section v-if="isAuthenticated" class="card week-strip">
      <div class="week-strip-header">
        <h2 class="week-strip-greeting">HELLO, ATHLETE!</h2>
        <div class="week-strip-icons">
          <button type="button" class="icon-button">
            <i class="pi pi-bookmark" aria-hidden="true"></i>
          </button>
          <button type="button" class="icon-button">
            <i class="pi pi-bell" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            class="icon-button"
            @click="openMonthCalendar"
          >
            <i class="pi pi-calendar" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <p class="week-strip-range">{{ weekStrip.rangeLabel }}</p>
      <div class="week-strip-days">
        <button
          v-for="day in weekStrip.days"
          :key="day.key"
          type="button"
          class="week-day"
          :class="{ 'is-today': day.isToday }"
        >
          <span class="week-day-date">{{ day.date }}</span>
          <span class="week-day-label">{{ day.label }}</span>
          <span v-if="day.hasSession" class="week-day-check">✓</span>
        </button>
      </div>
    </section>

    <section v-if="isAuthenticated && todaysMotivation" class="card hero">
      <h2>{{ todaysMotivation.title }}</h2>
      <p class="hero-text">
        {{ todaysMotivation.body }}
      </p>
      <div class="hero-image"></div>
    </section>

    <section v-if="!isAuthenticated" class="card">
      <h2>{{ isLoginMode ? 'Connexion' : 'Creer un compte' }}</h2>
      <p>Connecte-toi pour sauvegarder tes objectifs, tes seances et tes routines.</p>
      <form class="auth-form" @submit.prevent="submitAuth">
        <input
          v-model="email"
          type="email"
          required
          class="input"
          placeholder="ton.email@example.com"
        />
        <input
          v-model="password"
          type="password"
          required
          class="input"
          placeholder="Mot de passe"
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

    <section v-else class="card today">
      <h2>Aujourd'hui</h2>
      <p class="subtitle">Ton tableau de bord pour la semaine.</p>
      <div class="today-list">
        <button
          v-for="section in todaySections"
          :key="section.key"
          type="button"
          class="today-row"
          @click="onTodayRowClick(section.key)"
        >
          <div class="today-row-main">
            <span class="today-row-title">{{ section.title }}</span>
            <span class="today-row-sub">{{ section.subtitle }}</span>
          </div>
          <div class="today-row-progress" :style="{ '--p': section.progress + '%' }">
            <div class="today-row-circle">
              <div class="today-row-circle-inner">
                <span class="today-row-percent">
                  <template v-if="section.key === 'weekly-goal'">
                    {{ perWeekGoal ?? '—' }}
                  </template>
                  <template v-else>
                    {{ section.progress }}%
                  </template>
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </section>

    <section v-if="isAuthenticated" class="card">
      <h2>Notifications de motivation</h2>
      <p>Active les notifications push pour recevoir des rappels reguliers.</p>
      <button
        type="button"
        :disabled="!isPushSupported || isLoadingNotifications || status === 'enabled'"
        @click="onEnableNotifications"
      >
        <span v-if="status === 'enabled'">Notifications activees</span>
        <span v-else-if="isLoadingNotifications">Activation en cours...</span>
        <span v-else>Activer les notifications</span>
      </button>
      <p v-if="!isPushSupported" class="info">
        Les notifications push ne sont pas supportees sur ce navigateur.
      </p>
      <p v-if="errorMessage" class="error">
        {{ errorMessage }}
      </p>
    </section>
    <section v-if="isAuthenticated && todaysExercise" class="card wellbeing">
      <h2>Bien-etre du jour</h2>
      <h3 class="wellbeing-title">{{ todaysExercise.title }}</h3>
      <p class="wellbeing-text">
        {{ todaysExercise.description }}
      </p>
      <p class="wellbeing-meta">Environ {{ todaysExercise.durationMinutes }} minute(s).</p>
      <button type="button" class="primary" @click="startWellbeingExercise">
        Commencer
      </button>
    </section>

    <div
      v-if="isAddSessionDialogOpen"
      class="dialog-backdrop"
      @click.self="isAddSessionDialogOpen = false"
    >
      <div class="dialog-card">
        <div class="dialog-header">
          <h3 class="dialog-title">Ajouter une seance</h3>
          <button
            type="button"
            class="dialog-close"
            @click="isAddSessionDialogOpen = false"
          >
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>
        <p class="dialog-text">
          Confirme que tu as realise une seance. Elle sera ajoutee a ta semaine
          en cours.
        </p>
        <div class="dialog-actions">
          <button
            type="button"
            class="secondary dialog-primary"
            :disabled="isSavingSession || !weeklySessions || weeklySessions === 0"
            @click="confirmRemoveSessionFromDialog"
          >
            Retirer la derniere seance
          </button>
          <button
            type="button"
            class="primary dialog-primary"
            :disabled="isSavingSession"
            @click="confirmAddSessionFromDialog"
          >
            <span v-if="isSavingSession">Enregistrement...</span>
            <span v-else>Confirmer la seance</span>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="isMonthCalendarOpen"
      class="dialog-backdrop"
      @click.self="isMonthCalendarOpen = false"
    >
      <div
        class="dialog-card calendar-card"
        @touchstart.passive="onCalendarTouchStart"
        @touchend.passive="onCalendarTouchEnd"
      >
        <div class="dialog-header">
          <h3 class="dialog-title">{{ calendarMonthLabel }}</h3>
          <button
            type="button"
            class="dialog-close"
            @click="isMonthCalendarOpen = false"
          >
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>
        <div class="calendar-nav">
          <button
            type="button"
            class="calendar-nav-btn"
            @click="changeCalendarMonth(-1)"
          >
            <i class="pi pi-chevron-left" aria-hidden="true"></i>
          </button>
          <span class="calendar-nav-hint">Glisse pour changer de mois</span>
          <button
            type="button"
            class="calendar-nav-btn"
            @click="changeCalendarMonth(1)"
          >
            <i class="pi pi-chevron-right" aria-hidden="true"></i>
          </button>
        </div>
        <div class="calendar-grid">
          <div class="calendar-weekday" v-for="w in ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']" :key="w">
            {{ w }}
          </div>
          <button
            v-for="cell in calendarCells"
            :key="cell.key"
            type="button"
            class="calendar-cell"
            :class="{
              'is-blank': cell.date === null,
              'is-today': cell.isToday,
              'has-session': cell.hasSession,
            }"
            :disabled="cell.date === null"
          >
            <span v-if="cell.date !== null" class="calendar-date">
              {{ cell.date }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="isWellbeingDialogOpen"
      class="dialog-backdrop"
      @click.self="isWellbeingDialogOpen = false"
    >
      <div class="dialog-card">
        <div class="dialog-header">
          <h3 class="dialog-title">Choisir une pause</h3>
          <button
            type="button"
            class="dialog-close"
            @click="isWellbeingDialogOpen = false"
          >
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>
        <p class="dialog-text">
          Selectionne un exercice de bien-etre pour ta pause.
        </p>
        <div class="wellbeing-dialog-grid">
          <button
            v-for="exercise in wellbeingExercises"
            :key="exercise.key"
            type="button"
            class="wellbeing-option-card"
            @click="openExercisePlayer(exercise.key)"
          >
            <h4 class="wellbeing-option-title">{{ exercise.title }}</h4>
            <p class="wellbeing-option-desc">
              {{ exercise.description }}
            </p>
            <p class="wellbeing-option-meta">
              Environ {{ exercise.durationMinutes }} min
            </p>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="isWellbeingPlayerOpen && activeExercise"
      class="dialog-backdrop"
      @click.self="isWellbeingPlayerOpen = false"
    >
      <div class="dialog-card">
        <div class="dialog-header">
          <h3 class="dialog-title">{{ activeExercise.title }}</h3>
          <button
            type="button"
            class="dialog-close"
            @click="isWellbeingPlayerOpen = false"
          >
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>
        <p class="dialog-text">
          Installe-toi confortablement et lance la seance audio.
        </p>
        <div class="audio-dialog-body">
          <audio
            v-if="activeExercise.audioUrl"
            class="audio-player"
            :src="activeExercise.audioUrl"
            controls
            autoplay
          ></audio>
          <p v-else class="info">
            L'audio pour cette seance n'est pas encore configure.
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="isAdjustGoalDialogOpen"
      class="dialog-backdrop"
      @click.self="isAdjustGoalDialogOpen = false"
    >
      <div class="dialog-card">
        <div class="dialog-header">
          <h3 class="dialog-title">Ajuster ton objectif</h3>
          <button
            type="button"
            class="dialog-close"
            @click="isAdjustGoalDialogOpen = false"
          >
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>
        <p class="dialog-text">
          Combien de seances veux-tu viser cette semaine ?
        </p>
        <div class="goal-dialog-row">
          <button
            type="button"
            class="goal-btn"
            @click="changeGoalDraft(-1)"
          >
            -
          </button>
          <div class="goal-dialog-value">
            {{ goalDraft ?? perWeekGoal ?? 1 }} seance(s) / semaine
          </div>
          <button
            type="button"
            class="goal-btn"
            @click="changeGoalDraft(1)"
          >
            +
          </button>
        </div>
        <div class="dialog-actions">
          <button
            type="button"
            class="primary dialog-primary"
            :disabled="isSavingSession"
            @click="confirmAdjustGoalFromDialog"
          >
            Mettre a jour l'objectif
          </button>
        </div>
      </div>
    </div>

    <nav v-if="isAuthenticated" class="bottom-nav">
      <button type="button" class="nav-item is-active">
        <i class="pi pi-home nav-icon" aria-hidden="true"></i>
        <span class="nav-label">Accueil</span>
      </button>
      <button type="button" class="nav-item">
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
      <button type="button" class="nav-item">
        <i class="pi pi-user nav-icon" aria-hidden="true"></i>
        <span class="nav-label">Profil</span>
      </button>
    </nav>
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
  gap: 0.5rem;
}
.brand {
  font-size: 1.4rem;
  margin: 0;
  font-weight: 700;
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
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.85);
}
.week-strip {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.week-strip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.week-strip-greeting {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: 0.12em;
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
  font-size: 0.8rem;
  opacity: 0.8;
}
.week-strip-days {
  margin-top: 0.3rem;
  padding: 0.45rem 0.5rem;
  border-radius: 0.85rem;
  background: #050505;
  display: flex;
  justify-content: space-between;
  gap: 0.3rem;
}
.week-day {
  flex: 1;
  min-width: 0;
  border-radius: 999px;
  border: 1px solid #27272a;
  background: transparent;
  padding: 0.35rem 0.35rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #f9fafb;
}
.week-day-date {
  font-size: 0.9rem;
  font-weight: 600;
}
.week-day-label {
  font-size: 0.65rem;
  opacity: 0.8;
}
.week-day.is-today {
  background: #f9fafb;
  color: #050505;
}
.week-day-check {
  margin-top: 0.05rem;
  font-size: 0.7rem;
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
  align-items: center;
  justify-content: center;
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
  background: #f9fafb;
  color: #050505;
  border-color: #f9fafb;
}
.calendar-date {
  font-size: 0.85rem;
}
.today {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.subtitle {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.9;
}
.card > h2 {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.progress-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
}
.progress-header .current {
  opacity: 0.85;
}
.progress-bar {
  position: relative;
  height: 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: #f9fafb;
  transition: width 0.3s ease;
}
.progress-status {
  margin: 0;
  font-size: 0.9rem;
}
.goal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.goal-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.goal-btn {
  min-width: 2rem;
  padding: 0.2rem 0.5rem;
  font-size: 0.9rem;
}
.recent {
  margin-top: 0.75rem;
}
.recent-title {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
}
.recent-list {
  margin: 0;
  padding-left: 1rem;
  font-size: 0.9rem;
}
.wellbeing {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.wellbeing-title {
  margin: 0;
  font-size: 1.1rem;
}
.wellbeing-text {
  margin: 0;
  font-size: 0.95rem;
}
.wellbeing-meta {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.8;
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
.dialog-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  z-index: 40;
}
.dialog-card {
  width: 100%;
  max-width: 360px;
  border-radius: 1rem;
  padding: 1.5rem 1.5rem 1.25rem;
  background: #111111;
  border: 1px solid #27272a;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.95);
}
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}
.dialog-title {
  margin: 0;
  font-size: 1rem;
}
.dialog-close {
  border-radius: 999px;
  border: 1px solid #27272a;
  background: transparent;
  padding: 0.2rem 0.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e5e7eb;
}
.dialog-text {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  opacity: 0.9;
}
.dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
}
.secondary {
  min-width: 0;
  padding-inline: 1.1rem;
  border-radius: 999px;
  border: 1px solid #27272a;
  background: transparent;
}
.dialog-primary {
  width: 100%;
}
.wellbeing-dialog-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
.wellbeing-option-card {
  width: 100%;
  text-align: left;
  padding: 0.75rem 0.9rem;
  border-radius: 0.85rem;
  border: 1px solid #27272a;
  background: #0b0b0b;
}
.wellbeing-option-title {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  font-weight: 500;
}
.wellbeing-option-desc {
  margin: 0 0 0.25rem;
  font-size: 0.8rem;
  opacity: 0.8;
}
.wellbeing-option-meta {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.7;
}
.audio-dialog-body {
  margin-top: 0.75rem;
}
.audio-player {
  width: 100%;
}
.goal-dialog-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.goal-dialog-value {
  flex: 1;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 500;
}
.today-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.today-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border-radius: 0.85rem;
  border: 1px solid #27272a;
  background: #0b0b0b;
}
.today-row-main {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  text-align: left;
}
.today-row-title {
  font-size: 0.9rem;
  font-weight: 500;
}
.today-row-sub {
  font-size: 0.8rem;
  opacity: 0.8;
}
.today-row-progress {
  display: flex;
  align-items: center;
  justify-content: center;
}
.today-row-circle {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background:
    conic-gradient(#f9fafb var(--p), rgba(55, 65, 81, 0.6) 0);
  display: flex;
  align-items: center;
  justify-content: center;
}
.today-row-circle-inner {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #111111;
  display: flex;
  align-items: center;
  justify-content: center;
}
.today-row-percent {
  font-size: 0.7rem;
}
.today-actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 0.75rem;
}
.goal-actions-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8rem;
}
.goal-label {
  opacity: 0.85;
}
.bottom-nav {
  max-width: 420px;
  margin: 0.25rem auto 0;
  padding: 0.45rem 0.75rem 0.5rem;
  border-radius: 999px;
  background: #111111;
  border: 1px solid #262626;
  display: flex;
  justify-content: space-between;
  gap: 0.4rem;
  position: sticky;
  bottom: 0.75rem;
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
 padding: 0.14rem 0.70rem;
  color: rgba(209, 213, 219, 0.9);
  font-size: 0.75rem;
  box-shadow: none;
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
