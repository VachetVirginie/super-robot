<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { WeeklySlot, TimeOfDay } from './composables/useWeeklySlots'

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
  weeklySlots: WeeklySlot[]
  isWeeklySlotsLoading: boolean
  weeklySlotsError: string | null
  stressReasons: { id: string; created_at: string; reason: string | null; category: string | null }[]
  weeklyStressByDay: Record<string, { avg: number; count: number }>
  weeklyMorningMood: number | null
  weeklyMorningEnergy: number | null
  weeklyMorningPriorities: { key: string; count: number }[]
  onOpenWeekPlan: () => void
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

  return hasMood || hasEnergy || hasPriorities
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
    return null
  }
  return `Soit ${minutes} minute(s) de sport maison cette semaine.`
})

const activeDaysLabel = computed(() => {
  const days = props.weeklyActiveDays ?? 0
  if (!days) {
    return null
  }
  if (days === 1) {
    return "1 jour actif cette semaine : c'est ton premier \"jamais zero\"." 
  }
  return `${days} jours actifs cette semaine : tu construis ton \"jamais zero\".`
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

const progressCoachSuggestion = computed(() => {
  const level = progressCoachLevel.value
  if (level === 'start') {
    return "Choisis un seul moment cette semaine ou tu pourrais faire une courte seance (meme 5 minutes) et note-le dans ton planning."
  }
  if (level === 'low') {
    return "Identifie le jour le plus simple pour ajouter une petite seance en plus, sans toucher au reste de ta semaine."
  }
  if (level === 'medium') {
    return "Repere le jour ou tu es le plus fatigue et autorise-toi une version plus courte de ta seance ce jour-la."
  }
  return "Garde 1 ou 2 moments fixes qui te font du bien et accepte que certaines semaines soient plus legeres sans que ce soit un echec."
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
</script>

<template>
  <section v-if="!isAuthenticated" class="card progress-card">
    <h2 class="progress-title">Mon equilibre</h2>
    <p class="progress-text">
      Connecte-toi pour suivre ta progression hebdomadaire et tes objectifs.
    </p>
  </section>

  <template v-else>
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
          <section class="card progress-card">
            <h2 class="progress-title">Bouger cette semaine</h2>
            <p class="progress-subtitle">
              Ton bilan hebdo sans culte de la perf.
            </p>

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
              class="stress-link-button"
              @click="router.push({ name: 'seances' })"
            >
              Voir toutes tes seances
            </button>

            <button
              type="button"
              class="secondary"
              @click="props.onOpenWeeklySessions()"
            >
              Modifier mes seances
            </button>

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
            <h2 class="progress-title">Tes moments pour bouger cette semaine</h2>
            <p class="progress-subtitle">
              Un coup d'oeil rapide sur les moments que tu as bloques pour toi.
            </p>
            <p class="progress-text progress-text--muted">
              {{ progressCoachSuggestion }}
            </p>

            <section class="planstrip">
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
          </section>

          <section class="card progress-card">
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

            <button
              type="button"
              class="stress-link-button"
              @click="props.onOpenWeekPlan()"
            >
              Planifier ma semaine
            </button>
          </section>
        </div>

        <div class="progress-tab-panel">
          <section class="card progress-card">
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
              <p v-if="morningMoodLabel" class="progress-text progress-text--muted">
                Humeur moyenne au reveil : <strong>{{ morningMoodLabel }}</strong>
              </p>
              <p v-if="morningEnergyLabel" class="progress-text progress-text--muted">
                Energie moyenne le matin : <strong>{{ morningEnergyLabel }}</strong>
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
                class="stress-link-button stress-link-button--highlight"
                @click="router.push({ name: 'stress' })"
              >
                Explorer ce qui declenche ton stress
              </button>
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
          </section>

          <section class="card progress-card">
            <h2 class="progress-title">Lien mouvement et stress</h2>
            <p class="progress-subtitle">
              Une vue simple du lien entre mouvement et stress cette semaine.
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

            <button
              type="button"
              class="stress-link-button"
              @click="props.onOpenWeekPlan()"
            >
              Planifier ma semaine
            </button>
          </section>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.progress-title {
  margin: 0 0 0.9rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e5e7eb;
  font-weight: 600;
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
  margin-top: 0.75rem;
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
  border: 1px solid #27272a;
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
  background: #22c55e;
  color: #022c22;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.stress-link-button--highlight {
  border-color: #22c55e;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  color: #022c22;
  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.55);
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
</style>
