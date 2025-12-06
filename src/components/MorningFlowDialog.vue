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
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: {
    slot: TodaySlot
    intention: DailyIntention
    moodLevel: number | null
    energyLevel: number | null
    priorities: string[]
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
const totalSteps = 6

const stepIndicatorLabel = computed(() => `Etape ${currentStep.value} / ${totalSteps}`)

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

const slotLabel = computed(() => {
  const option = slotOptions.find((opt) => opt.value === selectedSlot.value)
  return option?.label ?? ''
})

const intentionLabel = computed(() => {
  const option = intentionOptions.find((opt) => opt.value === selectedIntention.value)
  return option?.label ?? ''
})

const isLastStep = computed(() => currentStep.value === 6)

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
          </div>
        </section>

        <section v-else-if="currentStep === 2">
          <div class="morning-step-main morning-section-card">
            <h4 class="morning-section-title">Ton niveau d'energie</h4>
            <p class="morning-text">
              Aujourdhui, ton energie est plutot {{ energyLabel }}.
            </p>
            <div class="morning-energy-row">
              <span class="morning-energy-label">Pas du tout</span>
              <input
                v-model="energyLevel"
                type="range"
                min="0"
                max="4"
                step="1"
                class="morning-energy-slider"
              />
              <span class="morning-energy-label">Au max</span>
            </div>
          </div>
        </section>

        <section v-else-if="currentStep === 3">
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

        <section v-else-if="currentStep === 4">
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

        <section v-else-if="currentStep === 5">
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
          v-if="currentStep < 6"
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
          <span v-if="isSaving && currentStep === 6">Enregistrement...</span>
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

.morning-text {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
  line-height: 1.5;
}

.morning-section-title {
  margin-bottom: 2rem;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
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
  border: 1px solid #27272a;
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.75);
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

.morning-priorities-grid {
  flex-wrap: wrap;
}
</style>
