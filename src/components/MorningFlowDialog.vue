<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TodaySlot, DailyIntention } from '../composables/useDailyPlan'

const props = defineProps<{
  displayName: string
  perWeekGoal: number | null
  weeklySessions: number | null
  initialSlot: TodaySlot | null
  initialIntention: DailyIntention | null
  isLoading: boolean
  isSaving: boolean
  initialMorningMoodTags?: { tag: string; count: number }[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: {
    slot: TodaySlot
    intention: DailyIntention
    moodLevel: number | null
    energyLevel: number | null
    priorities: string[]
    sleepBedTime: string | null
    sleepWakeTime: string | null
    moodTags: string[]
  }): void
}>()

const slotOptions: { value: TodaySlot; label: string }[] = [
  { value: 'morning', label: 'Matin' },
  { value: 'noon', label: 'Midi' },
  { value: 'afternoon', label: 'Apres-midi' },
  { value: 'evening', label: 'Soir' },
  { value: 'unknown', label: 'Je ne sais pas encore' },
]

const intentionOptions: { value: DailyIntention; label: string }[] = [
  { value: 'calme', label: 'Plus calme' },
  { value: 'detente', label: 'Moins tendue' },
  { value: 'mobilite', label: 'Un peu plus mobile' },
  { value: 'presence', label: 'Plus presente a toi-meme' },
  { value: 'none', label: "Sans intention aujourd'hui" },
]

const selectedSlot = ref<TodaySlot>(props.initialSlot ?? 'unknown')
const selectedIntention = ref<DailyIntention>(props.initialIntention ?? 'none')
const sleepBedTime = ref<string | null>(null)
const sleepWakeTime = ref<string | null>(null)

const SLEEP_MINUTES_IN_DAY = 24 * 60

function timeToMinutes(value: string | null): number | null {
  if (!value || value.length < 4) {
    return null
  }
  const [hourStr, minuteStr] = value.slice(0, 5).split(':')
  const hour = Number(hourStr)
  const minute = Number(minuteStr)
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null
  }
  return hour * 60 + minute
}

function minutesToTime(totalMinutes: number): string {
  const normalized =
    ((totalMinutes % SLEEP_MINUTES_IN_DAY) + SLEEP_MINUTES_IN_DAY) % SLEEP_MINUTES_IN_DAY
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  const h = String(hours).padStart(2, '0')
  const m = String(minutes).padStart(2, '0')
  return `${h}:${m}`
}

function buildSleepOptions(
  currentValue: string | null,
  fallbackMinutes: number,
): { label: string; isCurrent: boolean }[] {
  const baseMinutes = timeToMinutes(currentValue) ?? fallbackMinutes
  const offsets = [-30, -15, 0, 15, 30]
  return offsets.map((offset) => {
    const minutes = baseMinutes + offset
    return {
      label: minutesToTime(minutes),
      isCurrent: offset === 0,
    }
  })
}

const bedTimeOptions = computed(() => buildSleepOptions(sleepBedTime.value, 23 * 60))
const wakeTimeOptions = computed(() => buildSleepOptions(sleepWakeTime.value, 7 * 60))

const friendlyName = computed(() => {
  const raw = props.displayName?.trim()
  if (!raw) return ''
  const first = raw.split(' ')[0] ?? ''
  return first
})

const previousSlotLabel = computed(() => {
  const value = props.initialSlot
  if (!value || value === 'unknown') {
    return ''
  }
  const mapping: Record<TodaySlot, string> = {
    morning: 'Matin',
    noon: 'Midi',
    afternoon: 'Apres-midi',
    evening: 'Soir',
    unknown: 'Je ne sais pas encore',
  }
  return mapping[value] ?? ''
})

const contractMainLine = computed(() => {
  const goal = props.perWeekGoal
  if (goal == null) {
    return "Tu peux choisir ton objectif dans 'Ma semaine'. Pas d'urgence."
  }
  if (goal === 1) {
    return 'Cette semaine, tu veux prendre 1 moment rien que pour toi.'
  }
  return `Cette semaine, tu veux prendre ${goal} moments rien que pour toi.`
})

const contractProgressLine = computed(() => {
  const goal = props.perWeekGoal
  const done = props.weeklySessions
  if (goal == null || done == null) {
    return ''
  }
  return `Tu es deja a ${done} sur ${goal}. On continue a ton rythme.`
})

const currentStep = ref(1)
const totalSteps = 8

const stepIndicatorLabel = computed(
  () => `Routine du matin · Etape ${currentStep.value} / ${totalSteps}`,
)

const moodOptions = [
  { value: 1, label: 'Mal', icon: 'very-sad' },
  { value: 2, label: 'Plutot mal', icon: 'sad' },
  { value: 3, label: 'Comme dhabitude', icon: 'neutral' },
  { value: 4, label: 'Plutot bien', icon: 'happy' },
  { value: 5, label: 'Super bien', icon: 'very-happy' },
]

const moodLevel = ref<number | null>(null)

const selectedMood = computed(() => {
  if (moodLevel.value == null) return null
  return moodOptions.find((opt) => opt.value === moodLevel.value) ?? null
})
const energyLevel = ref(2)

const priorityOptions = [
  { value: 'work', label: 'Travail' },
  { value: 'relax', label: 'Se detendre' },
  { value: 'family', label: 'Famille' },
  { value: 'friends', label: 'Amis' },
  { value: 'selfcare', label: 'Prendre soin de toi' },
  { value: 'health', label: 'Condition physique' },
]

const selectedPriorities = ref<string[]>([])

const energyLabel = computed(() => {
  const labels = [
    'epuise(e)',
    'peu repose(e)',
    'legerement repose(e)',
    'assez repose(e)',
    'tres repose(e)',
  ]
  const index = Math.min(Math.max(energyLevel.value, 0), labels.length - 1)
  return labels[index] ?? labels[2]
})

const energyPercent = computed(() => {
  const value = energyLevel.value
  const clamped = Math.min(Math.max(value, 0), 4)
  return (clamped / 4) * 100
})

const baseMorningMoodTagSuggestions = [
  'malade',
  'epuise(e)',
  'tres stresse(e)',
  'fatigue(e)',
  'tendue',
  'anxieuse',
  'apaisee',
  'confiant(e)',
]

const morningMoodTags = ref<string[]>([])
const isAddingMorningMoodTag = ref(false)
const morningMoodTagInput = ref('')

const morningMoodTagSuggestions = computed(() => {
  const base = baseMorningMoodTagSuggestions
  const dynamicSource = props.initialMorningMoodTags ?? []

  const merged: string[] = []
  const seen = new Set<string>()

  for (const tag of base) {
    const raw = tag.trim()
    if (!raw) continue
    const norm = raw.toLowerCase()
    if (seen.has(norm)) continue
    seen.add(norm)
    merged.push(raw)
  }

  for (const item of dynamicSource) {
    const raw = (item?.tag ?? '').trim()
    if (!raw) continue
    const norm = raw.toLowerCase()
    if (seen.has(norm)) continue
    seen.add(norm)
    merged.push(raw)
  }

  return merged
})

const customMorningMoodTags = computed(() => {
  const suggestions = morningMoodTagSuggestions.value.map((tag) => tag.toLowerCase())
  return morningMoodTags.value.filter(
    (tag) => !suggestions.includes(tag.toLowerCase()),
  )
})

function toggleMorningMoodTag(tag: string) {
  const value = tag.trim()
  if (!value) {
    return
  }

  const normalized = value.toLowerCase()
  const current = morningMoodTags.value
  const index = current.findIndex((item) => item.toLowerCase() === normalized)

  if (index !== -1) {
    morningMoodTags.value = [
      ...current.slice(0, index),
      ...current.slice(index + 1),
    ]
    return
  }

  if (current.length >= 3) {
    return
  }

  morningMoodTags.value = [...current, value]
  vibrateLight()
}

function startAddMorningMoodTag() {
  isAddingMorningMoodTag.value = true
  morningMoodTagInput.value = ''
}

function confirmAddMorningMoodTag() {
  const value = morningMoodTagInput.value.trim()
  if (!value) {
    isAddingMorningMoodTag.value = false
    return
  }

  toggleMorningMoodTag(value)
  isAddingMorningMoodTag.value = false
  morningMoodTagInput.value = ''
}

function selectEnergy(value: number) {
  energyLevel.value = value
  vibrateLight()
}

const slotLabel = computed(() => {
  const option = slotOptions.find((opt) => opt.value === selectedSlot.value)
  return option?.label ?? ''
})

const intentionLabel = computed(() => {
  const option = intentionOptions.find((opt) => opt.value === selectedIntention.value)
  return option?.label ?? ''
})

const isLastStep = computed(() => currentStep.value === 8)

const primaryCtaLabel = computed(() => (isLastStep.value ? 'Enregistrer' : 'Continuer'))

function moodIconUrl(key: string) {
  return `/icons/mood/${key}.svg`
}

function vibrateLight() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

function selectMood(value: number) {
  moodLevel.value = value
  vibrateLight()
}

function onSelectSlot(value: TodaySlot) {
  selectedSlot.value = value
  vibrateLight()
}

function onSelectIntention(value: DailyIntention) {
  selectedIntention.value = value
  vibrateLight()
}

function togglePriority(value: string) {
  const list = selectedPriorities.value
  const index = list.indexOf(value)
  if (index !== -1) {
    selectedPriorities.value = [...list.slice(0, index), ...list.slice(index + 1)]
    return
  }
  if (list.length >= 3) {
    return
  }
  selectedPriorities.value = [...list, value]
  vibrateLight()
}

function adjustBedTime(deltaMinutes: number) {
  const base = timeToMinutes(sleepBedTime.value) ?? 23 * 60
  sleepBedTime.value = minutesToTime(base + deltaMinutes)
}

function adjustWakeTime(deltaMinutes: number) {
  const base = timeToMinutes(sleepWakeTime.value) ?? 7 * 60
  sleepWakeTime.value = minutesToTime(base + deltaMinutes)
}

function goToPreviousStep() {
  if (currentStep.value > 1) {
    currentStep.value -= 1
  }
}

function skipStep() {
  if (!isLastStep.value) {
    currentStep.value += 1
  }
}

function goToNextStep() {
  if (
    currentStep.value === 3 &&
    (isAddingMorningMoodTag.value || morningMoodTagInput.value.trim())
  ) {
    confirmAddMorningMoodTag()
  }

  if (!isLastStep.value) {
    currentStep.value += 1
    return
  }
  onConfirm()
}

function onConfirm() {
  const slotToSave = selectedSlot.value ?? 'unknown'
  const intentionToSave = selectedIntention.value ?? 'none'
  emit('confirm', {
    slot: slotToSave,
    intention: intentionToSave,
    moodLevel: moodLevel.value,
    energyLevel: energyLevel.value,
    priorities: selectedPriorities.value,
    sleepBedTime: sleepBedTime.value,
    sleepWakeTime: sleepWakeTime.value,
    moodTags: morningMoodTags.value,
  })
}
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <div class="dialog-card morning-card">
      <div class="dialog-header morning-header">
        <h3 class="dialog-title">
          Bonjour<span v-if="friendlyName">, {{ friendlyName }}</span>
        </h3>
        <p class="dialog-step-indicator">{{ stepIndicatorLabel }}</p>
        <button
          type="button"
          class="dialog-close"
          @click="emit('close')"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>

      <div class="morning-body">
        <section
          v-if="currentStep === 1"
          class="morning-step-sleep"
        >
          <p class="morning-text morning-intro">
            On commence par ton sommeil. Tu peux passer si tu preferes.
          </p>

          <div class="morning-step-main morning-section-card">
            <h4 class="morning-section-title">Heure du coucher</h4>
            <p class="morning-text">
              A quelle heure tu t'es couche(e) hier soir ?
            </p>

            <div class="sleep-picker">
              <div class="sleep-picker-track">
                <div
                  v-for="option in bedTimeOptions"
                  :key="option.label"
                  class="sleep-picker-row"
                  :class="{ 'is-current': option.isCurrent }"
                  @click="sleepBedTime = option.label"
                >
                  <span class="sleep-picker-time">
                    {{ option.label }}
                  </span>
                </div>
              </div>
              <div class="sleep-picker-center-line"></div>
            </div>

            <div class="sleep-picker-actions">
              <button
                type="button"
                class="sleep-picker-chip"
                @click="adjustBedTime(-15)"
              >
                -15 min
              </button>
              <button
                type="button"
                class="sleep-picker-chip"
                @click="adjustBedTime(15)"
              >
                +15 min
              </button>
            </div>
          </div>
        </section>

        <section
          v-else-if="currentStep === 2"
          class="morning-step-sleep"
        >
          <p class="morning-text morning-intro">
            Et a quelle heure tu t'es leve(e) ce matin ?
          </p>

          <div class="morning-step-main morning-section-card">
            <h4 class="morning-section-title">Heure du reveil</h4>
            <p class="morning-text">
              La aussi, une heure approximative suffit.
            </p>

            <div class="sleep-picker">
              <div class="sleep-picker-track">
                <div
                  v-for="option in wakeTimeOptions"
                  :key="option.label"
                  class="sleep-picker-row"
                  :class="{ 'is-current': option.isCurrent }"
                  @click="sleepWakeTime = option.label"
                >
                  <span class="sleep-picker-time">
                    {{ option.label }}
                  </span>
                </div>
              </div>
              <div class="sleep-picker-center-line"></div>
            </div>

            <div class="sleep-picker-actions">
              <button
                type="button"
                class="sleep-picker-chip"
                @click="adjustWakeTime(-15)"
              >
                -15 min
              </button>
              <button
                type="button"
                class="sleep-picker-chip"
                @click="adjustWakeTime(15)"
              >
                +15 min
              </button>
            </div>

            <p class="morning-microcopy">
              Tu peux passer cette question si tu preferes.
            </p>
          </div>
        </section>

        <section
          v-else-if="currentStep === 3"
          class="morning-step-mood"
        >
          <p class="morning-text morning-intro">
            On prend 1 minute pour poser ton matin, sans pression.
          </p>

          <div class="morning-step-main morning-mood-main morning-section-card">
            <h4 class="morning-section-title">Comment tu te sens ce matin ?</h4>
            <div class="morning-options-row morning-mood-row">
              <button
                v-for="option in moodOptions"
                :key="option.value"
                type="button"
                class="morning-mood-button"
                :class="{ 'is-selected': moodLevel === option.value }"
                @click="selectMood(option.value)"
              >
                <img
                  class="morning-mood-icon"
                  :src="moodIconUrl(option.icon)"
                  :alt="option.label"
                />
              </button>
            </div>
            <div class="morning-mood-labels">
              <span class="morning-mood-label-left">{{ moodOptions[0]?.label }}</span>
              <span class="morning-mood-label-right">
                {{ moodOptions[moodOptions.length - 1]?.label }}
              </span>
            </div>
            <p
              v-if="selectedMood && moodLevel"
              class="morning-mood-rating"
            >
              {{ moodLevel }} / 5 - {{ selectedMood.label }}
            </p>
            <div class="morning-mood-tags-block">
              <p class="morning-mood-tags-title">
                Tu peux preciser avec quelques mots (max 3) :
              </p>
              <div class="morning-mood-tags-row">
                <button
                  v-for="tag in morningMoodTagSuggestions"
                  :key="tag"
                  type="button"
                  class="morning-mood-tag-chip"
                  :class="{ 'is-selected': morningMoodTags.includes(tag) }"
                  @click="toggleMorningMoodTag(tag)"
                >
                  {{ tag }}
                </button>
                <button
                  v-if="!isAddingMorningMoodTag && morningMoodTags.length < 3"
                  type="button"
                  class="morning-mood-tag-chip morning-mood-tag-chip--add"
                  @click="startAddMorningMoodTag"
                >
                  + Ajouter
                </button>
              </div>
              <div
                v-if="customMorningMoodTags.length"
                class="morning-mood-tags-row morning-mood-tags-row--custom"
              >
                <button
                  v-for="tag in customMorningMoodTags"
                  :key="tag"
                  type="button"
                  class="morning-mood-tag-chip is-selected"
                  @click="toggleMorningMoodTag(tag)"
                >
                  {{ tag }}
                </button>
              </div>
              <div
                v-if="isAddingMorningMoodTag"
                class="morning-mood-tags-input-row"
              >
                <input
                  v-model="morningMoodTagInput"
                  type="text"
                  class="morning-mood-tag-input"
                  maxlength="24"
                  placeholder="Un mot qui decrit ton matin"
                  @keyup.enter.prevent="confirmAddMorningMoodTag"
                />
                <button
                  type="button"
                  class="morning-mood-tag-confirm"
                  @click="confirmAddMorningMoodTag"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="currentStep === 4">
          <div class="morning-step-main morning-section-card">
            <h4 class="morning-section-title">Ton niveau d'energie</h4>
            <p class="morning-text">
              Aujourdhui, ton energie est plutot {{ energyLabel }}.
            </p>
            <div class="morning-energy-row">
              <span class="morning-energy-label">Pas du tout</span>
              <div class="energy-gauge">
                <div class="energy-gauge-track">
                  <div
                    class="energy-gauge-fill"
                    :style="{ width: energyPercent + '%' }"
                  ></div>
                  <button
                    v-for="level in 5"
                    :key="level"
                    type="button"
                    class="energy-gauge-step"
                    :class="{ 'is-active': energyLevel >= level - 1 }"
                    @click="selectEnergy(level - 1)"
                  ></button>
                </div>
              </div>
              <span class="morning-energy-label">Au max</span>
            </div>
          </div>
        </section>

        <section v-else-if="currentStep === 5">
          <div class="morning-step-main morning-section-card">
            <h4 class="morning-section-title">Ta priorite pour aujourdhui</h4>
            <p class="morning-text">
              Tu peux choisir jusqua 3 priorites, ou passer si tu preferes.
            </p>
            <div class="morning-options-row morning-priorities-grid">
              <button
                v-for="option in priorityOptions"
                :key="option.value"
                type="button"
                class="morning-intention-option"
                :class="{ 'is-selected': selectedPriorities.includes(option.value) }"
                @click="togglePriority(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </section>

        <section v-else-if="currentStep === 6">
          <div class="morning-step-main morning-section-card">
            <p v-if="previousSlotLabel" class="morning-previous-slot">
              Tu avais choisi : {{ previousSlotLabel }}. Tu veux changer ?
            </p>
            <h4 class="morning-section-title">Choisir ton moment pour bouger</h4>
            <p class="morning-text">On place un petit moment pour bouger : tu preferes quand aujourdhui ?</p>

            <div class="morning-options-row">
              <button
                v-for="option in slotOptions"
                :key="option.value"
                type="button"
                class="morning-option"
                :class="{ 'is-selected': selectedSlot === option.value }"
                @click="onSelectSlot(option.value)"
              >
                {{ option.label }}
              </button>
            </div>

            <p class="morning-microcopy">
              Ce n'est pas un engagement strict : juste une direction.
            </p>
          </div>
        </section>

        <section v-else-if="currentStep === 7">
          <div class="morning-step-main morning-section-card">
            <h4 class="morning-section-title">Ton intention du jour</h4>
            <p class="morning-text">
              Pour aujourdhui, tu voudrais surtout te sentir...
            </p>

            <div class="morning-options-row">
              <button
                v-for="option in intentionOptions"
                :key="option.value"
                type="button"
                class="morning-intention-option"
                :class="{ 'is-selected': selectedIntention === option.value }"
                @click="onSelectIntention(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </section>

        <section v-else>
          <div class="morning-step-main morning-section-card">
            <p class="morning-text">
              Ce matin, tu as prevu de bouger
              <span v-if="slotLabel">{{ slotLabel.toLowerCase() }}</span>
              <span v-else>au moment qui te conviendra le mieux</span>
              et de viser
              <span v-if="intentionLabel">"{{ intentionLabel.toLowerCase() }}"</span>
              <span v-else>ce qui te semble possible</span>
              .
            </p>
            <p class="morning-contract">
              {{ contractMainLine }}
            </p>
            <p v-if="contractProgressLine" class="morning-contract">
              {{ contractProgressLine }}
            </p>
          </div>
        </section>
      </div>

      <div class="morning-footer">
        <button
          v-if="currentStep > 1"
          type="button"
          class="morning-back"
          @click="goToPreviousStep"
        >
          Retour
        </button>
        <button
          v-if="currentStep < 8"
          type="button"
          class="morning-skip"
          @click="skipStep"
        >
          Sauter
        </button>
        <button
          type="button"
          class="primary morning-cta"
          :disabled="isSaving || isLoading"
          @click="goToNextStep"
        >
          <span v-if="isSaving && currentStep === 8">Enregistrement...</span>
          <span v-else>{{ primaryCtaLabel }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
  background: #050505;
  z-index: 40;
}

.morning-card {
  max-width: 420px;
  width: 100%;
  height: 100vh;
  margin: 0 auto;
  border-radius: 0;
  border: none;
  box-shadow: none;
  padding: 1.5rem 1.5rem 2.5rem;
  background: #050505;
  display: flex;
  flex-direction: column;
}

.morning-body {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.morning-body > section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  max-width: 380px;
  margin: 0 auto;
}

.morning-step-mood {
  justify-content: flex-start;
}

.morning-step-sleep {
  justify-content: flex-start;
}

.morning-text {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
  line-height: 1.5;
}

.morning-section-title {
  margin-bottom: 2rem;
  font-size: 1rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
}

.morning-header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 1.1rem;
  margin-bottom: 1rem;
}

.morning-header .dialog-title {
  width: 100%;
  text-align: center;
  font-size: 1.15rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}

.morning-header .dialog-close {
  position: absolute;
  top: 0;
  right: 0;
}

.morning-intro {
  text-align: left;
  margin-bottom: 1.25rem;
}

.morning-step-main,
.morning-mood-main {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 0.75rem;
  margin-bottom: 0;
}

.morning-options-row {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.morning-sleep-row {
  flex-direction: column;
  gap: 0.75rem;
}

.sleep-picker {
  position: relative;
  margin-top: 1rem;
  padding: 0.75rem 0;
}

.sleep-picker-track {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sleep-picker-row {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.25rem 0;
  opacity: 0.6;
  transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}

.sleep-picker-row.is-current {
  opacity: 1;
  transform: scale(1.05);
}

.sleep-picker-time {
  font-size: 1.15rem;
  letter-spacing: 0.18em;
}

.sleep-picker-center-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 0;
  border-top: 1px solid rgba(148, 163, 184, 0.5);
  pointer-events: none;
}

.sleep-picker-actions {
  margin-top: 0.75rem;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.sleep-picker-chip {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: #020617;
  color: #e5e7eb;
  font-size: 0.75rem;
  padding: 0.25rem 0.7rem;
}

.morning-sleep-card {
  gap: 0.75rem;
}

.morning-sleep-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.morning-sleep-icon-circle {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  background: radial-gradient(circle at 20% 0%, rgba(34, 197, 94, 0.2), rgba(15, 23, 42, 0.95));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e5e7eb;
  flex-shrink: 0;
}

.morning-sleep-header-main {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.morning-sleep-field-card {
  width: 100%;
  border-radius: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: radial-gradient(circle at top left, rgba(15, 23, 42, 0.9), #020617);
  padding: 0.75rem 0.9rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.morning-sleep-field-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.morning-sleep-label {
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.8;
}

.morning-sleep-time-display {
  font-size: 0.95rem;
  font-weight: 600;
}

.morning-time-input {
  border-radius: 999px;
  border: 1px solid #4b5563;
  background: #020617;
  color: #e5e7eb;
  padding: 0.3rem 0.7rem;
  font-size: 0.8rem;
}

.morning-sleep-hint {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.75;
}

.morning-option,
.morning-intention-option {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #020617;
  color: #e5e7eb;
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
  transition: background-color 0.12s ease-out, border-color 0.12s ease-out,
    transform 0.12s ease-out, box-shadow 0.12s ease-out;
}

.morning-option.is-selected,
.morning-intention-option.is-selected {
  border-color: #22c55e;
  background: #22c55e;
  color: #022c22;
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 8px 18px rgba(34, 197, 94, 0.4);
}

.morning-microcopy {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

.morning-section-card {
  border-radius: 1rem;
  padding: 1.1rem 1.25rem 1.2rem;
  background: #111111;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    0 -1px 4px rgba(255, 255, 255, 0.03),
    0 6px 20px rgba(0, 0, 0, 0.4);
}

.morning-section-card .morning-section-title {
  margin-top: 0;
  margin-bottom: 1.2rem;
}

.morning-section-card > .morning-text {
  margin-top: 0.25rem;
}

.morning-contract {
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.morning-previous-slot {
  margin: 0 0 0.4rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.morning-footer {
  margin-top: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.morning-back {
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #9ca3af;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
}

.morning-skip {
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #9ca3af;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
}

.morning-cta {
  margin-left: auto;
}

.morning-mood-row {
  justify-content: space-between;
}

.morning-mood-button {
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease-out;
  animation: morning-mood-pop 0.25s ease-out;
}

.morning-mood-button.is-selected {
  transform: scale(1.05);
}

.morning-mood-icon {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  object-fit: contain;
  filter: invert(0.9);
  transition: border-color 0.12s ease-out, box-shadow 0.12s ease-out,
    background-color 0.12s ease-out;
}

.morning-mood-button.is-selected .morning-mood-icon {
  border-color: #22c55e;
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.6), 0 8px 20px rgba(22, 163, 74, 0.45);
  /* background: radial-gradient(circle at top left, rgba(34, 197, 94, 0.22), #020617); */
}

@keyframes morning-mood-pop {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.morning-mood-labels {
  margin-top: 0.6rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  opacity: 0.8;
}

.morning-mood-rating {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  opacity: 0.85;
}

.morning-mood-tags-block {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.morning-mood-tags-title {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

.morning-mood-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.morning-mood-tags-row--custom {
  margin-top: 0.1rem;
}

.morning-mood-tag-chip {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #020617;
  color: #e5e7eb;
  padding: 0.25rem 0.7rem;
  font-size: 0.75rem;
}

.morning-mood-tag-chip.is-selected {
  border-color: #22c55e;
  background: #16a34a;
  color: #022c22;
}

.morning-mood-tag-chip--add {
  border-style: dashed;
  opacity: 0.9;
}

.morning-mood-tags-input-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.morning-mood-tag-input {
  flex: 1;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: #020617;
  color: #e5e7eb;
  padding: 0.3rem 0.7rem;
  font-size: 0.8rem;
}

.morning-mood-tag-confirm {
  border-radius: 999px;
  border: none;
  background: #22c55e;
  color: #022c22;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.morning-energy-row {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.morning-energy-label {
  font-size: 0.8rem;
  opacity: 0.8;
}

.morning-energy-slider {
  flex: 1;
  accent-color: #22c55e;
}

.energy-gauge {
  flex: 1;
  display: flex;
  align-items: center;
}

.energy-gauge-track {
  position: relative;
  width: 100%;
  height: 0.55rem;
  border-radius: 999px;
  background: linear-gradient(90deg, #111827, #020617);
  overflow: hidden;
  display: flex;
  align-items: stretch;
}

.energy-gauge-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #22c55e, #a3e635);
  transition: width 0.18s ease-out;
}

.energy-gauge-step {
  position: relative;
  z-index: 1;
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
}

.energy-gauge-step::after {
  content: '';
  position: absolute;
  top: -0.25rem;
  bottom: -0.25rem;
  left: 50%;
  width: 2px;
  border-radius: 999px;
  background: transparent;
  transition: background-color 0.18s ease-out, transform 0.18s ease-out;
}

.energy-gauge-step.is-active::after {
  background: rgba(248, 250, 252, 0.8);
  transform: scaleY(1.1);
}

.morning-priorities-grid {
  flex-wrap: wrap;
}
</style>
