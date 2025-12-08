<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  isAuthenticated: boolean
  weeklySessions: number | null
  perWeekGoal: number | null
  weeklyProgressPercent: number
  weeklyStatusLabel: string
  weeklyMinutes: number | null
  weeklyActiveDays: number | null
  weeklyByKind: Record<string, { sessions: number; minutes: number }>
  weeklyAverageStress: number | null
  weeklyCheckinsCount: number
  weekSessionDates: string[]
  stressReasons: { id: string; created_at: string; reason: string | null; category: string | null }[]
  weeklyStressByDay: Record<string, { avg: number; count: number }>
  weeklyMorningMood: number | null
  weeklyMorningEnergy: number | null
  weeklyMorningPriorities: { key: string; count: number }[]
  weeklyAverageStressMidday: number | null
  weeklyAverageStressEvening: number | null
  weeklySleepBedTime: string | null
  weeklySleepWakeTime: string | null
  bilanMonthSessionDates: string[]
  bilanMonthStressByDay: Record<string, { avg: number; count: number }>
  recentMorningStates: {
    id: string
    day_date: string
    created_at: string
    mood_level: number | null
    energy_level: number | null
    priorities: string[] | null
    sleep_bed_time: string | null
    sleep_wake_time: string | null
  }[]
  onOpenWeeklySessions: () => void
}>()

const router = useRouter()

const activeTab = ref<'sessions' | 'stress'>('sessions')

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

const stressCoachLevel = computed(() => {
  const avg = props.weeklyAverageStress
  if (avg == null) return 'none' as const
  if (avg <= 2) return 'low' as const
  if (avg <= 3.5) return 'medium' as const
  return 'high' as const
})

const stressCoachMessage = computed(() => {
  const level = stressCoachLevel.value
  if (level === 'low') {
    return "Ton stress reste plutot bas. Continue a garder quelques moments de pause et de recuperation, meme quand ca va bien."
  }
  if (level === 'medium') {
    return "Ton stress est present mais reste gerable. Repere les situations qui reviennent et demande-toi ou tu peux inserer une petite pause ou un moment zen."
  }
  if (level === 'high') {
    return "Ton corps t'envoie le signal que la semaine est intense. L'idee n'est pas de tout changer, mais de proteger un peu plus ton energie la ou c'est possible."
  }
  return "Plus tu prends quelques secondes pour nommer ton stress, plus il devient facile de reperer ce qui te pese le plus."
})

const stressCoachSuggestion = computed(() => {
  const level = stressCoachLevel.value
  if (level === 'low') {
    return "Choisis un moment de la semaine ou tu te sens deja calme et garde-le comme rendez-vous regulier avec toi-meme."
  }
  if (level === 'medium') {
    return "Identifie une situation qui te tend un peu et decide a l'avance d'une petite strategie (pause respiration, marche rapide, message a quelqu'un) pour la prochaine fois."
  }
  if (level === 'high') {
    return "Planifie un moment pour utiliser l'espace zen cette semaine et pense a une situation ou tu pourrais dire non ou demander un peu d'aide."
  }
  return "Cette semaine, demande-toi simplement : quel serait le plus petit geste pour te traiter avec un peu plus de douceur ?"
})

const hasMorningData = computed(() => {
  const hasMood = typeof props.weeklyMorningMood === 'number'
  const hasEnergy = typeof props.weeklyMorningEnergy === 'number'
  const hasPriorities = Array.isArray(props.weeklyMorningPriorities) && props.weeklyMorningPriorities.length > 0
  const hasSleep = !!(props.weeklySleepBedTime || props.weeklySleepWakeTime)

  return hasMood || hasEnergy || hasPriorities || hasSleep
})

const morningMoodLabel = computed(() => {
  const mood = props.weeklyMorningMood
  if (typeof mood !== 'number') {
    return null as string | null
  }
  return `${mood}/5`
})

const morningEnergyLabel = computed(() => {
  const energy = props.weeklyMorningEnergy
  if (typeof energy !== 'number') {
    return null as string | null
  }
  return `${energy}/5`
})

const morningSleepLabel = computed(() => {
  const bed = props.weeklySleepBedTime
  const wake = props.weeklySleepWakeTime

  if (!bed && !wake) {
    return null as string | null
  }

  if (bed && wake) {
    return `${bed}-${wake}`
  }

  return (bed || wake) ?? null
})

const morningPriorityLabels = computed(() => {
  const labels: Record<string, string> = {
    work: 'Travail',
    relax: 'Se detendre',
    family: 'Famille',
    friends: 'Amis',
    selfcare: 'Prendre soin de toi',
    health: 'Condition physique',
  }

  return (props.weeklyMorningPriorities ?? []).map((item) => ({
    key: item.key,
    label: labels[item.key] ?? item.key,
    count: item.count,
  }))
})

const middayMoodLabel = computed(() => {
  const avgStress = props.weeklyAverageStressMidday
  if (typeof avgStress !== 'number') {
    return null as string | null
  }
  const mood = 6 - avgStress
  const rounded = Math.round(mood * 10) / 10
  return `${rounded}/5`
})

const eveningMoodLabel = computed(() => {
  const avgStress = props.weeklyAverageStressEvening
  if (typeof avgStress !== 'number') {
    return null as string | null
  }
  const mood = 6 - avgStress
  const rounded = Math.round(mood * 10) / 10
  return `${rounded}/5`
})

const threeMomentsAverage = computed(() => {
  const hasMorning = typeof props.weeklyMorningMood === 'number'
  const hasMidday = typeof props.weeklyAverageStressMidday === 'number'
  const hasEvening = typeof props.weeklyAverageStressEvening === 'number'

  // On ne calcule la moyenne des 3 moments que si les 3 notes existent.
  if (!hasMorning || !hasMidday || !hasEvening) {
    return null as number | null
  }

  const morning = props.weeklyMorningMood as number
  const midday = 6 - (props.weeklyAverageStressMidday as number)
  const evening = 6 - (props.weeklyAverageStressEvening as number)

  const avg = (morning + midday + evening) / 3
  return Math.round(avg * 10) / 10
})

const stressWeekSummary = computed(() => {
  const avg = props.weeklyAverageStress
  if (avg == null) {
    return "Stress non renseigne cette semaine."
  }
  if (avg <= 2) {
    return 'Semaine plutot calme.'
  }
  if (avg <= 3.5) {
    return 'Semaine chargee mais sous controle.'
  }
  return 'Semaine plutot tendue.'
})

const summarySessionsLabel = computed(() => {
  const done = props.weeklySessions ?? 0
  const goal = props.perWeekGoal

  if (goal != null && goal > 0) {
    return `${done} seance(s) / ${goal}`
  }

  if (done === 0) return '0 seance cette semaine'
  if (done === 1) return '1 seance cette semaine'
  return `${done} seances cette semaine`
})

const summaryPercentLabel = computed(() => {
  if (!Number.isFinite(safePercent.value) || safePercent.value <= 0) {
    return null as string | null
  }
  return `${safePercent.value}% de ton objectif`
})

const minutesLabel = computed(() => {
  const minutes = props.weeklyMinutes ?? 0
  if (!minutes) {
    return "Temps de sport maison non renseigne pour cette semaine. Tu pourras plus tard noter la duree de tes seances."
  }
  return `Soit ${minutes} minute(s) de sport maison cette semaine.`
})

const activeDaysLabel = computed(() => {
  const days = props.weeklyActiveDays ?? 0
  if (!days) {
    return "Pour l'instant, aucun jour actif. On va viser le principe \"jamais zero\" : au moins un jour avec un peu de mouvement, meme tres court."
  }
  if (days === 1) {
    return "Tu as deja 1 jour actif cette semaine. L'idee est surtout de garder au moins un jour \"jamais zero\" meme quand la semaine est chargee."
  }
  return `Tu as bouge ${days} jour(s) cette semaine. Tu construis ton "jamais zero" en douceur.`
})

const kindTags = computed(() => {
  const entries = Object.entries(props.weeklyByKind || {})
    .filter(([, value]) => (value?.sessions ?? 0) > 0)
    .sort((a, b) => (b[1].minutes ?? 0) - (a[1].minutes ?? 0))
    .slice(0, 3)

  const labels: Record<string, string> = {
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

  return entries.map(([key, value]) => {
    const base = labels[key] ?? 'Autre'
    const minutes = value.minutes
    return {
      key,
      label: `${base} (${minutes} min)`,
    }
  })
})

const progressCoachLevel = computed(() => {
  const value = safePercent.value
  if (value === 0) return 'start' as const
  if (value < 40) return 'low' as const
  if (value < 90) return 'medium' as const
  return 'high' as const
})

const progressCoachMessage = computed(() => {
  const level = progressCoachLevel.value
  if (level === 'start') {
    return "On commence doucement : l'objectif est surtout de planifier 1 premiere seance cette semaine."
  }
  if (level === 'low') {
    return "Tu as deja mis quelques pas en mouvement. On cherche juste a consolider 1 ou 2 moments simples."
  }
  if (level === 'medium') {
    return "Tu es en bon mouvement. L'idee est de garder ce rythme sans te mettre plus de pression."
  }
  return "Tu es tres proche ou deja sur ton objectif. Pense aussi a te feliciter et a garder des jours plus legers quand tu en as besoin."
})

// const progressCoachSuggestion = computed(() => {
//   const level = progressCoachLevel.value
//   if (level === 'start') {
//     return "Choisis un seul moment cette semaine ou tu pourrais faire une courte seance (meme 5 minutes) et note-le dans ton planning."
//   }
//   if (level === 'low') {
//     return "Identifie le jour le plus simple pour ajouter une petite seance en plus, sans toucher au reste de ta semaine."
//   }
//   if (level === 'medium') {
//     return "Repere le jour ou tu es le plus fatigue et autorise-toi une version plus courte de ta seance ce jour-la."
//   }
//   return "Garde 1 ou 2 moments fixes qui te font du bien et accepte que certaines semaines soient plus legeres sans que ce soit un echec."
// })

const movementStressCorrelation = computed(() => {
  const stressByDay = props.weeklyStressByDay ?? {}
  const sessionDays = new Set(props.weekSessionDates ?? [])

  const withMove: number[] = []
  const withoutMove: number[] = []

  for (const [iso, info] of Object.entries(stressByDay)) {
    const avg = info?.avg
    const count = info?.count
    if (typeof avg !== 'number' || !count) continue
    if (sessionDays.has(iso)) {
      withMove.push(avg)
    } else {
      withoutMove.push(avg)
    }
  }

  const computeAvg = (values: number[]) => {
    if (!values.length) return null
    const sum = values.reduce((acc, value) => acc + value, 0)
    return Math.round((sum / values.length) * 10) / 10
  }

  const avgWithMove = computeAvg(withMove)
  const avgWithoutMove = computeAvg(withoutMove)

  return {
    avgWithMove,
    avgWithoutMove,
    hasData: avgWithMove !== null && avgWithoutMove !== null,
  }
})

const movementStressNumbers = computed(() => {
  const { avgWithMove, avgWithoutMove } = movementStressCorrelation.value
  if (avgWithMove == null && avgWithoutMove == null) {
    return null as { withMove: number | null; withoutMove: number | null } | null
  }
  return {
    withMove: avgWithMove,
    withoutMove: avgWithoutMove,
  }
})

const movementStressInsight = computed(() => {
  const { avgWithMove, avgWithoutMove, hasData } = movementStressCorrelation.value

  if (!hasData) {
    if (!Object.keys(props.weeklyStressByDay ?? {}).length) {
      return "Des que tu notes ton stress quelques jours, on pourra te montrer l'effet de tes seances sur ta semaine."
    }
    return "On a encore peu de jours avec seance et check-in cette semaine. On affinera ce lien au fil du temps."
  }

  const diffRaw = avgWithoutMove! - avgWithMove!

  if (diffRaw > 0.3) {
    return 'Les jours ou tu bouges, ton stress est nettement plus bas.'
  }

  if (diffRaw > 0.1) {
    return "Bouger semble taider un peu a reduire ton stress." 
  }

  if (diffRaw >= 0) {
    return 'Tu peux observer ton stress avec ou sans mouvement, sans pression.'
  }

  return "Tu peux continuer a explorer ce qui taide le plus, a ton rythme." 
})

const monthMovementStressNumbers = computed(() => {
  const stressByDay = props.bilanMonthStressByDay ?? {}
  const sessionDays = new Set(props.bilanMonthSessionDates ?? [])

  const withMove: number[] = []
  const withoutMove: number[] = []

  for (const [iso, info] of Object.entries(stressByDay)) {
    const avg = info?.avg
    const count = info?.count
    if (typeof avg !== 'number' || !count) continue
    if (sessionDays.has(iso)) {
      withMove.push(avg)
    } else {
      withoutMove.push(avg)
    }
  }

  const computeAvg = (values: number[]) => {
    if (!values.length) return null
    const sum = values.reduce((acc, value) => acc + value, 0)
    return Math.round((sum / values.length) * 10) / 10
  }

  const avgWithMove = computeAvg(withMove)
  const avgWithoutMove = computeAvg(withoutMove)

  if (avgWithMove == null && avgWithoutMove == null) {
    return null as { withMove: number | null; withoutMove: number | null } | null
  }

  return {
    withMove: avgWithMove,
    withoutMove: avgWithoutMove,
  }
})

const weekdayStressSummary = computed(() => {
  const stressByDay = props.bilanMonthStressByDay ?? {}
  const buckets = new Map<number, { sum: number; count: number }>()

  for (const [iso, info] of Object.entries(stressByDay)) {
    const avg = info?.avg
    const count = info?.count
    if (typeof avg !== 'number' || !count) continue

    const year = Number(iso.slice(0, 4))
    const month = Number(iso.slice(5, 7)) - 1
    const day = Number(iso.slice(8, 10))
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) continue

    const d = new Date(year, month, day)
    const weekday = d.getDay()

    const bucket = buckets.get(weekday) ?? { sum: 0, count: 0 }
    bucket.sum += avg * count
    bucket.count += count
    buckets.set(weekday, bucket)
  }

  const weekdayLabels: Record<number, string> = {
    0: 'Dimanche',
    1: 'Lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi',
  }

  const result: { weekday: number; label: string; avg: number; count: number }[] = []

  for (const [weekday, info] of buckets.entries()) {
    if (!info.count) continue
    const avg = info.sum / info.count
    result.push({
      weekday,
      label: weekdayLabels[weekday] ?? String(weekday),
      avg: Math.round(avg * 10) / 10,
      count: info.count,
    })
  }

  return result.sort((a, b) => b.avg - a.avg)
})

const sleepStressCorrelation = computed(() => {
  const morningRows = props.recentMorningStates ?? []
  const stressByDay = props.weeklyStressByDay ?? {}

  const short: number[] = []
  const long: number[] = []
  const thresholdMinutes = 7 * 60

  const toMinutes = (value: string | null) => {
    if (typeof value !== 'string' || value.length < 4) return null
    const [hourStr, minuteStr] = value.slice(0, 5).split(':')
    const hour = Number(hourStr)
    const minute = Number(minuteStr)
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return null as number | null
    }
    return hour * 60 + minute
  }

  for (const row of morningRows) {
    const iso =
      typeof row.day_date === 'string' && row.day_date.length >= 10
        ? row.day_date.slice(0, 10)
        : row.created_at.slice(0, 10)

    const info = (stressByDay as Record<string, { avg: number; count: number }>)[iso]
    const stress = typeof info?.avg === 'number' ? info.avg : null
    if (stress == null) continue

    const bed = toMinutes(row.sleep_bed_time)
    const wake = toMinutes(row.sleep_wake_time)
    if (bed == null || wake == null) continue

    let duration = wake - bed
    if (duration <= 0) {
      duration = 24 * 60 - bed + wake
    }

    if (duration < thresholdMinutes) {
      short.push(stress)
    } else {
      long.push(stress)
    }
  }

  const computeAvg = (values: number[]) => {
    if (!values.length) return null
    const sum = values.reduce((acc, value) => acc + value, 0)
    return Math.round((sum / values.length) * 10) / 10
  }

  const shortAvg = computeAvg(short)
  const longAvg = computeAvg(long)

  return {
    shortAvg,
    longAvg,
    hasData: shortAvg !== null || longAvg !== null,
  }
})

const moodHistorySeries = computed(() => {
  const stressByDay = props.weeklyStressByDay ?? {}

  const today = new Date()
  const result: { iso: string; label: string; value: number | null }[] = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(today)
    d.setDate(today.getDate() - offset)

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const dayNum = String(d.getDate()).padStart(2, '0')
    const iso = `${year}-${month}-${dayNum}`

    const weekday = d
      .toLocaleDateString('fr-FR', { weekday: 'short', timeZone: 'Europe/Paris' })
      .replace('.', '')

    const info = (stressByDay as Record<string, { avg: number; count: number }>)[iso]
    const value = typeof info?.avg === 'number' ? info.avg : null

    result.push({ iso, label: weekday, value })
  }

  return result
})
</script>

<template>
  <section v-if="!isAuthenticated" class="card progress-card">
    <p class="progress-kicker">Bilan</p>
    <h2 class="progress-title">Mon equilibre</h2>
    <p class="progress-text">
      Connecte-toi pour suivre ta progression hebdomadaire et tes objectifs.
    </p>
  </section>

  <template v-else>
    <section class="card progress-card">
      <p class="progress-kicker">Bilan</p>
      <h2 class="progress-title">Ton equilibre en un coup d'oeil</h2>
      <p class="progress-subtitle">
        Une vue rapide de ta semaine entre mouvement, stress et sommeil.
      </p>

      <div class="progress-summary">
        <p class="progress-text progress-text--muted">
          Mouvement :
          <strong>{{ summarySessionsLabel }}</strong>
          <span v-if="summaryPercentLabel"> ({{ summaryPercentLabel }})</span>
        </p>

        <p class="progress-text progress-text--muted">
          Stress :
          <strong>
            {{ weeklyAverageStress !== null ? `${weeklyAverageStress}/5` : '–/5' }}
          </strong>
          {{ stressWeekSummary }}
        </p>

        <p v-if="morningSleepLabel" class="progress-text progress-text--muted">
          Sommeil moyen (coucher-lever) :
          <strong>{{ morningSleepLabel }}</strong>
        </p>

        <p v-if="movementStressNumbers" class="progress-text progress-text--muted">
          Les jours avec seance :
          <strong>{{ movementStressNumbers.withMove ?? '–' }}/5</strong>
          de stress en moyenne, contre
          <strong>{{ movementStressNumbers.withoutMove ?? '–' }}/5</strong>
          les jours sans seance.
        </p>
      </div>
    </section>

    <div class="progress-tabs">
      <button
        type="button"
        class="progress-tab"
        :class="{ 'is-active': activeTab === 'sessions' }"
        @click="activeTab = 'sessions'"
      >
        Bouger
      </button>
      <button
        type="button"
        class="progress-tab"
        :class="{ 'is-active': activeTab === 'stress' }"
        @click="activeTab = 'stress'"
      >
        Stress et declencheurs
      </button>
    </div>

    <div class="progress-tabs-panels">
      <div
        class="progress-tabs-inner"
        :class="activeTab === 'sessions' ? 'is-sessions' : 'is-stress'"
      >
        <div class="progress-tab-panel">
          <section class="card progress-card progress-card--highlight">
            <div class="progress-header">
              <p class="progress-kicker">Mouvement</p>
              <h2 class="progress-title">Bouger cette semaine</h2>
              <p class="progress-subtitle">
                Ton bilan hebdo sans culte de la perf.
              </p>
            </div>

            <div class="progress-summary-key">
              <p class="progress-summary-main">
                <strong>{{ summarySessionsLabel }}</strong>
              </p>
              <p
                v-if="summaryPercentLabel"
                class="progress-summary-secondary"
              >
                {{ summaryPercentLabel }}
              </p>
            </div>

            <div class="progress-summary">
              <p v-if="minutesLabel" class="progress-text progress-text--muted">
                {{ minutesLabel }}
              </p>
              <p v-if="activeDaysLabel" class="progress-text progress-text--muted">
                {{ activeDaysLabel }}
              </p>
            </div>

            <div class="progress-bar-wrapper">
              <div class="progress-bar-track">
                <div class="progress-bar-fill" :style="{ width: safePercent + '%' }"></div>
              </div>
              <span class="progress-bar-label">
                Tu es a {{ safePercent }}% de ton objectif de la semaine.
              </span>
            </div>

            <p class="progress-status">
              {{ weeklyStatusLabel }}
            </p>
            <p class="progress-status progress-status--muted">
              {{ progressCoachMessage }}
            </p>

            <button
              type="button"
              class="secondary stress-link-button"
              @click="router.push({ name: 'seances' })"
            >
              Voir toutes tes seances
            </button>

            <!-- <button
              type="button"
              class="secondary"
              @click="props.onOpenWeeklySessions()"
            >
              Modifier mes seances
            </button> -->

            <div v-if="kindTags.length" class="progress-tags">
              <span
                v-for="tag in kindTags"
                :key="tag.key"
                class="tag tag--mint"
              >
                {{ tag.label }}
              </span>
            </div>
          </section>

          <section class="card progress-card">
            <p class="progress-kicker">Mouvement x stress</p>
            <h2 class="progress-title">Lien mouvement et stress</h2>
            <p class="progress-subtitle">
              Ce que montre ta semaine entre seances et stress.
            </p>

            <p class="progress-text">
              {{ movementStressInsight }}
            </p>

            <div
              v-if="movementStressNumbers"
              class="progress-summary progress-summary--linked"
            >
              <p class="progress-text progress-text--muted">
                Jours avec seance :
                <strong>{{ movementStressNumbers.withMove ?? '\u2014' }}/5</strong>
                de stress en moyenne.
              </p>
              <p class="progress-text progress-text--muted">
                Jours sans seance :
                <strong>{{ movementStressNumbers.withoutMove ?? '\u2014' }}/5</strong>
                de stress en moyenne.
              </p>
            </div>

            <p
              v-if="monthMovementStressNumbers"
              class="progress-text progress-text--muted"
            >
              Sur le mois en cours, les jours avec seance ont un stress moyen de
              <strong>{{ monthMovementStressNumbers.withMove ?? '\u2014' }}/5</strong>
              contre
              <strong>{{ monthMovementStressNumbers.withoutMove ?? '\u2014' }}/5</strong>
              les jours sans seance.
            </p>

            <!-- <button
              type="button"
              class="primary stress-link-button"
              @click="props.onOpenWeekPlan()"
            >
              Planifier ma semaine
            </button> -->
          </section>
        </div>

        <div class="progress-tab-panel">
          <section class="card progress-card">
            <p class="progress-kicker">Routines du jour</p>
            <h2 class="progress-title">Tes matins cette semaine</h2>
            <p class="progress-subtitle">
              Comment tu demarres tes journees (sur les 7 derniers jours).
            </p>

            <p
              v-if="!hasMorningData"
              class="progress-text progress-text--muted"
            >
              Des que tu repondras a quelques questions du matin, on pourra te montrer comment tu
              demarres tes journees (humeur, energie, priorites).
            </p>

            <div v-else class="progress-summary">
              <p
                v-if="morningSleepLabel"
                class="progress-text progress-text--muted"
              >
                Sommeil moyen (coucher-lever) :
                <strong>{{ morningSleepLabel }}</strong>
              </p>
              <p v-if="morningMoodLabel" class="progress-text progress-text--muted">
                Humeur moyenne au reveil : <strong>{{ morningMoodLabel }}</strong>
              </p>
              <p v-if="morningEnergyLabel" class="progress-text progress-text--muted">
                Energie moyenne le matin : <strong>{{ morningEnergyLabel }}</strong>
              </p>

              <p v-if="middayMoodLabel" class="progress-text progress-text--muted">
                Humeur moyenne en milieu de journee : <strong>{{ middayMoodLabel }}</strong>
              </p>
              <p v-if="eveningMoodLabel" class="progress-text progress-text--muted">
                Humeur moyenne en fin de journee : <strong>{{ eveningMoodLabel }}</strong>
              </p>

              <p
                v-if="threeMomentsAverage !== null"
                class="progress-text progress-text--muted"
              >
                Humeur moyenne des 3 moments : <strong>{{ threeMomentsAverage }}/5</strong>
              </p>

              <div v-if="morningPriorityLabels.length" class="progress-tags">
                <span
                  v-for="item in morningPriorityLabels"
                  :key="item.key"
                  class="tag tag--blue"
                >
                  {{ item.label }} ({{ item.count }})
                </span>
              </div>
            </div>
          </section>

          <section class="card progress-card">
            <p class="progress-kicker">Stress</p>
            <h2 class="progress-title">Stress et declencheurs</h2>
            <p class="progress-subtitle">
              Comment tu as vecu la semaine du point de vue du stress.
            </p>

            <p class="stress-text">
              <strong>{{ stressWeekSummary }}</strong>
            </p>

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

              <p class="stress-text stress-text--muted">
                {{ stressCoachMessage }}
              </p>

              <button
                type="button"
                class="primary stress-link-button stress-link-button--highlight"
                @click="router.push({ name: 'stress' })"
              >
                Explorer ce qui declenche ton stress
              </button>
            </section>

            <section
              v-if="moodHistorySeries.length"
              class="mood-history-section"
            >
              <h3 class="mood-history-title">Historique de ton humeur</h3>
              <p class="mood-history-text">
                Un coup d'oeil sur tes derniers check-ins (midi / soir) sur 7 jours.
              </p>

              <div class="mood-history-grid">
                <div
                  v-for="day in moodHistorySeries"
                  :key="day.iso"
                  class="mood-history-item"
                >
                  <span class="mood-history-label">{{ day.label }}</span>
                  <div
                    class="mood-history-dot"
                    :class="{
                      'is-low': day.value !== null && day.value <= 2,
                      'is-medium': day.value !== null && day.value > 2 && day.value < 3.5,
                      'is-high': day.value !== null && day.value >= 3.5,
                    }"
                  ></div>
                  <span class="mood-history-value">
                    {{ day.value !== null ? day.value.toFixed(1) + '/5' : '—' }}
                  </span>
                </div>
              </div>
            </section>

            <section
              v-if="sleepStressCorrelation.hasData"
              class="stress-categories-section"
            >
              <h3 class="stress-categories-title">Sommeil et charge mentale</h3>
              <p class="stress-categories-text">
                On regarde comment la longueur de tes nuits se reflète dans ton stress du jour.
              </p>
              <p
                v-if="sleepStressCorrelation.longAvg !== null"
                class="stress-text stress-text--muted"
              >
                Apres des nuits de 7h ou plus, ton stress moyen est autour de
                <strong>{{ sleepStressCorrelation.longAvg }}/5</strong>.
              </p>
              <p
                v-if="sleepStressCorrelation.shortAvg !== null"
                class="stress-text stress-text--muted"
              >
                Apres des nuits plus courtes, il monte plutot vers
                <strong>{{ sleepStressCorrelation.shortAvg }}/5</strong>.
              </p>
            </section>

            <section v-if="stressCategoriesSummary.length" class="stress-categories-section">
              <h3 class="stress-categories-title">Ce qui revient souvent</h3>
              <p class="stress-categories-text">
                Sur tes dernieres raisons de stress, voici ce qui apparait le plus souvent.
              </p>
              <p class="stress-text stress-text--muted">
                {{ stressCoachSuggestion }}
              </p>
              <div class="stress-categories-list">
                <div
                  v-for="item in stressCategoriesSummary"
                  :key="item.key"
                  class="stress-category-row"
                >
                  <div class="stress-category-main">
                    <span class="stress-category-label">{{ item.label }}</span>
                    <span class="stress-category-count">{{ item.count }} raison(s)</span>
                  </div>
                </div>
              </div>
            </section>

            <section
              v-if="weekdayStressSummary.length"
              class="stress-categories-section"
            >
              <h3 class="stress-categories-title">Jours qui reviennent</h3>
              <p class="stress-categories-text">
                Sur le mois en cours, certains jours de la semaine reviennent plus charges.
              </p>
              <div class="stress-categories-list">
                <div
                  v-for="item in weekdayStressSummary.slice(0, 3)"
                  :key="item.weekday"
                  class="stress-category-row"
                >
                  <div class="stress-category-main">
                    <span class="stress-category-label">{{ item.label }}</span>
                    <span class="stress-category-count">
                      {{ item.avg.toFixed(1) }}/5 de stress moyen ({{ item.count }} check-in(s))
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.progress-title {
  margin: 0 0 0.9rem;
  font-size: 1.05rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #e5e7eb;
  font-weight: 600;
}

.progress-card--highlight {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(20, 244, 209, 0.18), transparent 60%),
    radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.18), transparent 60%),
    #111111;
  border-color: rgba(255, 255, 255, 0.08);
}

.progress-header {
  margin-bottom: 0.75rem;
  position: relative;
}

.progress-header::before {
  content: '';
  position: absolute;
  inset: -1rem -0.75rem auto -0.75rem;
  border-radius: 999px;
  background:
    radial-gradient(circle at 0% 0%, rgba(20, 244, 209, 0.18), transparent 55%);
  opacity: 0.9;
  pointer-events: none;
  z-index: -1;
}

.progress-kicker {
  margin: 0 0 0.35rem;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent-soft);
  opacity: 0.9;
}

.progress-tabs {
  margin-bottom: 0.75rem;
  display: flex;
  gap: 0.35rem;
  padding: 0.15rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid #1f2937;
}

.progress-tab {
  flex: 1;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #9ca3af;
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
}

.progress-tab.is-active {
  background: #22c55e;
  color: #020617;
  font-weight: 500;
}

.progress-tabs-panels {
  overflow: hidden;
}

.progress-tabs-inner {
  display: flex;
  width: 200%;
  transition: transform 0.25s ease-out;
}

.progress-tabs-inner.is-sessions {
  transform: translateX(0%);
}

.progress-tabs-inner.is-stress {
  transform: translateX(-50%);
}

.progress-tab-panel {
  width: 100%;
}

.progress-card + .progress-card {
  margin-top: 1rem;
}

.progress-subtitle {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  opacity: 0.85;
}

.progress-summary {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.progress-summary-key {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin-bottom: 0.75rem;
}

.progress-summary-main {
  margin: 0;
  font-size: 0.95rem;
}

.progress-summary-secondary {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.8;
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
  font-weight: 600;
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
  font-weight: 600;
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
  background: #0b0b0b;
  border: 1px solid rgba(255, 255, 255, 0.06);
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
  margin-bottom: 12px;
  width: 100%;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
}

.card .secondary,
.secondary.stress-link-button {
  transition:
    border-color 0.15s ease-out,
    box-shadow 0.15s ease-out,
    transform 0.12s ease-out;
}

.card .secondary:hover,
.secondary.stress-link-button:hover {
  border-color: rgba(20, 244, 209, 0.7);
  box-shadow:
    0 0 0 1px rgba(20, 244, 209, 0.45),
    0 14px 32px rgba(20, 244, 209, 0.22);
  transform: translateY(-1px);
}

.stress-link-button--highlight {
  box-shadow:
    0 -1px 0 rgba(255, 255, 255, 0.16),
    0 0 26px rgba(16, 255, 127, 0.35);
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
  font-weight: 600;
}

.stress-categories-text {
  margin: 0 0 0.45rem;
  font-size: 0.85rem;
  opacity: 0.85;
}

.stress-categories-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stress-category-row {
  padding: 0.7rem 0.8rem;
  border-radius: 0.75rem;
  background: #0b0b0b;
  border: 1px solid #27272a;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stress-category-label {
  font-size: 0.85rem;
}

.stress-category-count {
  font-size: 0.8rem;
  opacity: 0.85;
}

.mood-history-section {
  margin-top: 1.25rem;
}

.mood-history-title {
  margin: 0 0 0.4rem;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
  font-weight: 600;
}

.mood-history-text {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.8;
}

.mood-history-grid {
  margin-top: 0.6rem;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.35rem;
}

.mood-history-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.mood-history-label {
  font-size: 0.7rem;
  opacity: 0.8;
}

.mood-history-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.35);
}

.mood-history-dot.is-low {
  background: #22c55e;
}

.mood-history-dot.is-medium {
  background: #facc15;
}

.mood-history-dot.is-high {
  background: #f97316;
}

.mood-history-value {
  font-size: 0.75rem;
  opacity: 0.85;
}
</style>
