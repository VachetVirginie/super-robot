<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from './supabaseClient'

const props = defineProps<{
  isAuthenticated: boolean
}>()

const route = useRoute()
const router = useRouter()

const isLoading = ref(false)
const loadError = ref<string | null>(null)

interface SessionRow {
  id: number
  performed_at: string
  duration_minutes: number | null
  kind: string | null
  template_key: string | null
}

interface CheckinRow {
  id: string
  created_at: string
  stress_level: number | null
  note: string | null
  question: string | null
  moment: 'midday' | 'evening'
}

interface MorningStateRow {
  id: string
  created_at: string
  mood_level: number | null
  energy_level: number | null
  priorities: string[] | null
}

interface StressReasonRow {
  id: string
  created_at: string
  reason: string | null
  category: string | null
}

const daySessions = ref<SessionRow[]>([])
const dayCheckins = ref<CheckinRow[]>([])
const dayMorningState = ref<MorningStateRow | null>(null)
const dayStressReasons = ref<StressReasonRow[]>([])

const isoParam = computed(() => String(route.params.iso ?? ''))

const dayLabel = computed(() => {
  const iso = isoParam.value
  if (!iso) return ''
  const [yearStr, monthStr, dayStr] = iso.split('-')
  const year = Number(yearStr)
  const monthIndex = Number(monthStr) - 1
  const day = Number(dayStr)
  if (Number.isNaN(year) || Number.isNaN(monthIndex) || Number.isNaN(day)) {
    return iso
  }
  const d = new Date(year, monthIndex, day)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
})

function getDayRangeIso(iso: string) {
  const [yearStr, monthStr, dayStr] = iso.split('-')
  const year = Number(yearStr)
  const monthIndex = Number(monthStr) - 1
  const day = Number(dayStr)
  if (Number.isNaN(year) || Number.isNaN(monthIndex) || Number.isNaN(day)) {
    return null as { start: string; end: string } | null
  }
  const start = new Date(year, monthIndex, day, 0, 0, 0, 0)
  const end = new Date(year, monthIndex, day, 23, 59, 59, 999)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const middayCheckin = computed(() =>
  dayCheckins.value.find((item) => item.moment === 'midday') ?? null,
)

const eveningCheckin = computed(() =>
  dayCheckins.value.find((item) => item.moment === 'evening') ?? null,
)

const hasAnyData = computed(() => {
  return (
    daySessions.value.length > 0 ||
    dayCheckins.value.length > 0 ||
    dayMorningState.value !== null ||
    dayStressReasons.value.length > 0
  )
})

const sessionDetails = computed(() => {
  const kindLabels: Record<string, string> = {
    cardio: 'Cardio leger',
    strength: 'Renfo',
    mobility: 'Mobilite',
    mixed: 'Mixte',
    jump: 'Corde a sauter',
    stretch: 'Flexibilite',
    yoga: 'Yoga',
    rowing: 'Rameur',
    other: 'Autre',
  }

  return daySessions.value.map((sessionItem) => {
    const date = new Date(sessionItem.performed_at)
    const dateLabel = date
      .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    const minutes =
      typeof sessionItem.duration_minutes === 'number' &&
      sessionItem.duration_minutes > 0
        ? sessionItem.duration_minutes
        : null
    const durationLabel = minutes !== null ? `${minutes} min` : null

    const kindKey = sessionItem.kind ?? 'other'
    const kindLabel = kindLabels[kindKey] ?? null

    const parts: string[] = [dateLabel]

    if (kindLabel) {
      parts.push(kindLabel)
    }

    if (durationLabel) {
      parts.push(durationLabel)
    }

    return {
      id: sessionItem.id,
      fullLabel: parts.join(' · '),
    }
  })
})

const morningSummary = computed(() => {
  const row = dayMorningState.value
  if (!row) return null as string | null

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
    return 'Etat du matin enregistre pour cette journee.'
  }

  return parts.join(', ')
})

const stressReasonsByTime = computed(() =>
  dayStressReasons.value.map((item) => ({
    id: item.id,
    timeLabel: formatTime(item.created_at),
    reason: item.reason ?? '',
    category: item.category,
  })),
)

async function loadDayDetails() {
  if (!props.isAuthenticated) {
    daySessions.value = []
    dayCheckins.value = []
    dayMorningState.value = null
    dayStressReasons.value = []
    return
  }

  const iso = isoParam.value
  const range = getDayRangeIso(iso)
  if (!iso || !range) {
    loadError.value = 'Date invalide.'
    return
  }

  isLoading.value = true
  loadError.value = null

  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    if (!user) {
      daySessions.value = []
      dayCheckins.value = []
      dayMorningState.value = null
      dayStressReasons.value = []
      return
    }

    const { start, end } = range

    const sessionsPromise = supabase
      .from('sessions')
      .select('id, performed_at, duration_minutes, kind, template_key')
      .eq('user_id', user.id)
      .gte('performed_at', start)
      .lte('performed_at', end)
      .order('performed_at', { ascending: true })

    const checkinsPromise = supabase
      .from('wellbeing_checkins')
      .select('id, created_at, stress_level, note, question, moment')
      .eq('user_id', user.id)
      .eq('day', iso)
      .order('created_at', { ascending: true })

    const morningPromise = supabase
      .from('morning_states')
      .select('id, created_at, mood_level, energy_level, priorities')
      .eq('user_id', user.id)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })
      .limit(1)

    const stressReasonsPromise = supabase
      .from('stress_reasons')
      .select('id, created_at, reason, category')
      .eq('user_id', user.id)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })

    const [sessionsResult, checkinsResult, morningResult, stressReasonsResult] =
      await Promise.all([sessionsPromise, checkinsPromise, morningPromise, stressReasonsPromise])

    if (sessionsResult.error) {
      const msg = (sessionsResult.error as { message?: string }).message ?? ''
      if (!msg.includes('NetworkError when attempting to fetch resource')) {
        // eslint-disable-next-line no-console
        console.error('Error loading sessions for day', sessionsResult.error)
      }
    }

    if (checkinsResult.error) {
      const msg = (checkinsResult.error as { message?: string }).message ?? ''
      if (!msg.includes('NetworkError when attempting to fetch resource')) {
        // eslint-disable-next-line no-console
        console.error('Error loading checkins for day', checkinsResult.error)
      }
    }

    if (morningResult.error) {
      const msg = (morningResult.error as { message?: string }).message ?? ''
      if (!msg.includes('NetworkError when attempting to fetch resource')) {
        // eslint-disable-next-line no-console
        console.error('Error loading morning state for day', morningResult.error)
      }
    }

    if (stressReasonsResult.error) {
      const msg = (stressReasonsResult.error as { message?: string }).message ?? ''
      if (!msg.includes('NetworkError when attempting to fetch resource')) {
        // eslint-disable-next-line no-console
        console.error('Error loading stress reasons for day', stressReasonsResult.error)
      }
    }

    daySessions.value = (sessionsResult.data ?? []) as SessionRow[]
    dayCheckins.value = (checkinsResult.data ?? []) as CheckinRow[]

    const morningRow = (morningResult.data?.[0] as MorningStateRow | undefined) ?? null
    dayMorningState.value = morningRow

    dayStressReasons.value = (stressReasonsResult.data ?? []) as StressReasonRow[]
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error loading day details', error)
    loadError.value = "Impossible de charger les donnees pour cette journee."
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (props.isAuthenticated) {
    void loadDayDetails()
  }
})

watch(
  () => isoParam.value,
  () => {
    if (props.isAuthenticated) {
      void loadDayDetails()
    }
  },
)

watch(
  () => props.isAuthenticated,
  (value) => {
    if (value) {
      void loadDayDetails()
    }
  },
)
</script>

<template>
  <div class="day-root">
    <button
      type="button"
      class="icon-button day-back-button"
      @click="router.back()"
    >
      <i class="pi pi-chevron-left" aria-hidden="true"></i>
    </button>

    <section class="card day-card">
      <h2 class="day-title">Ta journee du {{ dayLabel }}</h2>
      <p class="day-text">
        Un coup d'oeil sur ce que tu as note ou fait ce jour-la.
      </p>

      <p v-if="!props.isAuthenticated" class="day-text day-text--muted">
        Connecte-toi pour voir le detail de tes journees.
      </p>
      <p v-else-if="isLoading" class="day-text day-text--muted">
        Chargement des donnees pour cette journee...
      </p>
      <p v-else-if="loadError" class="day-text day-text--error">
        {{ loadError }}
      </p>
      <p v-else-if="!hasAnyData" class="day-text day-text--muted">
        Pas de donnees enregistrees pour cette journee.
      </p>
    </section>

    <section
      v-if="props.isAuthenticated && !isLoading && morningSummary"
      class="card day-card"
    >
      <h3 class="day-section-title">Matin</h3>
      <p class="day-text day-text--muted">
        {{ morningSummary }}
      </p>
    </section>

    <section
      v-if="props.isAuthenticated && !isLoading && (middayCheckin || eveningCheckin)"
      class="card day-card"
    >
      <h3 class="day-section-title">Stress et check-ins</h3>

      <div class="day-block" v-if="middayCheckin">
        <h4 class="day-block-title">Milieu de journee</h4>
        <p class="day-text day-text--muted">
          Niveau de stress : {{ middayCheckin.stress_level ?? '—' }}/5
          <span v-if="middayCheckin.note">· {{ middayCheckin.note }}</span>
        </p>
        <p v-if="middayCheckin.question" class="day-text day-text--muted">
          Question : {{ middayCheckin.question }}
        </p>
      </div>

      <div class="day-block" v-if="eveningCheckin">
        <h4 class="day-block-title">Soir</h4>
        <p class="day-text day-text--muted">
          Niveau de stress : {{ eveningCheckin.stress_level ?? '' }}/5
          <span v-if="eveningCheckin.note">· {{ eveningCheckin.note }}</span>
        </p>
        <p v-if="eveningCheckin.question" class="day-text day-text--muted">
          Question : {{ eveningCheckin.question }}
        </p>
      </div>
    </section>

    <section
      v-if="props.isAuthenticated && !isLoading && sessionDetails.length"
      class="card day-card"
    >
      <h3 class="day-section-title">Seances</h3>
      <ul class="day-list">
        <li
          v-for="item in sessionDetails"
          :key="item.id"
          class="day-list-item"
        >
          {{ item.fullLabel }}
        </li>
      </ul>
    </section>

    <section
      v-if="props.isAuthenticated && !isLoading && stressReasonsByTime.length"
      class="card day-card"
    >
      <h3 class="day-section-title">Raisons de stress notees</h3>
      <ul class="day-list">
        <li
          v-for="item in stressReasonsByTime"
          :key="item.id"
          class="day-list-item"
        >
          <span class="day-list-main">
            {{ item.reason }}
          </span>
          <span class="day-list-meta">
            {{ item.timeLabel }}
            <span v-if="item.category">
              · {{ item.category }}
            </span>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.day-root {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  padding: 0.75rem 0.25rem 0.5rem;
}

.day-back-button {
  margin: 0 0 0.75rem;
}

.day-card {
  margin-top: 0.75rem;
}

.day-title {
  margin: 0 0 0.6rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.day-text {
  margin: 0;
  font-size: 0.9rem;
}

.day-text--muted {
  opacity: 0.8;
  font-size: 0.85rem;
}

.day-text--error {
  color: #fecaca;
}

.day-section-title {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.day-block {
  margin-top: 0.4rem;
}

.day-block-title {
  margin: 0 0 0.25rem;
  font-size: 0.85rem;
}

.day-list {
  list-style: none;
  padding: 0;
  margin: 0.25rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.day-list-item {
  padding: 0.45rem 0.6rem;
  border-radius: 0.75rem;
  background: #0b0b0b;
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.85rem;
}

.day-list-main {
  display: block;
}

.day-list-meta {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.75rem;
  opacity: 0.8;
}
</style>
