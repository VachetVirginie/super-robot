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

const moodLevel = ref<number | null>(null)
const energyLevel = ref(2)

const priorityOptions = [
  { value: 'work', label: 'Travail' },
  { value: 'relax', label: 'Se detendre' },
  { value: 'family', label: 'Famille' },
  { value: 'friends', label: 'Amites' },
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

const primaryCtaLabel = computed(() => (isLastStep.value ? "C'est parti pour aujourd'hui" : 'Continuer'))

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
      <div class="dialog-header">
        <h3 class="dialog-title">
          Bonjour<span v-if="friendlyName">, {{ friendlyName }}</span>
        </h3>
        <button
          type="button"
          class="dialog-close"
          @click="emit('close')"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>

      <div class="morning-body">
        <section v-if="currentStep === 1">
          <p class="morning-text">
            On prepare un mini plan realiste pour t'aider a passer une bonne journee.
          </p>
          <h4 class="morning-section-title">Comment tu te sens ce matin ?</h4>
          <div class="morning-options-row morning-mood-row">
            <button
              v-for="level in 5"
              :key="level"
              type="button"
              class="morning-option"
              :class="{ 'is-selected': moodLevel === level }"
              @click="moodLevel = level"
            >
              {{ level }}
            </button>
          </div>
        </section>

        <section v-else-if="currentStep === 2">
          <h4 class="morning-section-title">Ton niveau d'energie</h4>
          <p class="morning-text">
            Aujourdhui, tu te sens {{ energyLabel }}.
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
        </section>

        <section v-else-if="currentStep === 3">
          <h4 class="morning-section-title">Ta priorite pour aujourdhui</h4>
          <p class="morning-text">
            Tu peux en choisir jusqua 3, ou passer cette etape.
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
        </section>

        <section v-else-if="currentStep === 4">
          <p v-if="previousSlotLabel" class="morning-previous-slot">
            Tu avais choisi : {{ previousSlotLabel }}. Tu veux changer ?
          </p>
          <h4 class="morning-section-title">Choisir ton moment pour bouger</h4>
          <p class="morning-text">Tu preferes bouger quand aujourdhui ?</p>

          <div class="morning-options-row">
            <button
              v-for="option in slotOptions"
              :key="option.value"
              type="button"
              class="morning-option"
              :class="{ 'is-selected': selectedSlot === option.value }"
              @click="selectedSlot = option.value"
            >
              {{ option.label }}
            </button>
          </div>

          <p class="morning-microcopy">
            Ce n'est pas un engagement strict : juste une direction.
          </p>
        </section>

        <section v-else-if="currentStep === 5">
          <h4 class="morning-section-title">Ton intention du jour</h4>
          <p class="morning-text">
            Et aujourdhui, tu voudrais plutot te sentir...
          </p>

          <div class="morning-options-row">
            <button
              v-for="option in intentionOptions"
              :key="option.value"
              type="button"
              class="morning-intention-option"
              :class="{ 'is-selected': selectedIntention === option.value }"
              @click="selectedIntention = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </section>

        <section v-else>
          <p class="morning-text">
            Pour aujourdhui, tu as choisi de bouger
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
        </section>

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
  </div>
</template>

<style scoped>
.morning-card {
  max-width: 420px;
}

.morning-body {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.morning-text {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.morning-section-title {
  margin: 0;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
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
}

.morning-option.is-selected,
.morning-intention-option.is-selected {
  border-color: #22c55e;
  background: #22c55e;
  color: #022c22;
}

.morning-microcopy {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  opacity: 0.85;
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
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: transparent;
  color: #e5e7eb;
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
}

.morning-priorities-grid {
  flex-wrap: wrap;
}
</style>
