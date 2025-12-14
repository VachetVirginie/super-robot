<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  displayName: string
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: {
    level: number
    note?: string
    question?: string
    moodTags: string[]
  }): void
}>()

const friendlyName = computed(() => {
  const raw = props.displayName?.trim()
  if (!raw) return ''
  const first = raw.split(' ')[0] ?? ''
  return first
})

const currentStep = ref<1 | 2>(1)
const selectedStress = ref<number | null>(null)
const eveningNote = ref('')

const eveningQuestions = [
  "Qu'est-ce qui t'a aidee a tenir aujourd'hui ?",
  "Qu'est-ce que tu aimerais laisser de cote apres cette journee ?",
  "Quel petit moment de ta journee tu aimerais garder en memoire ?",
  "Qu'est-ce qui etait clairement hors de ton controle aujourd'hui ?",
  "Qu'as-tu fait aujourd'hui qui allait dans le sens de ce qui compte pour toi ?",
  "Quelle petite chose a ete un soutien aujourd'hui ?",
  "Qui t'a fait du bien, meme indirectement ?",
  "Quel geste as-tu fait qui merite d'etre reconnu ?",
  "Quel moment t'a fait sourire, meme brievement ?",
  "Une mini-chose que tu as appreciee aujourd'hui ?",
  "Quel confort as-tu eu la chance d'avoir aujourd'hui ?",
  "Qu'est-ce qui a ete plus simple que prevu ?",
  "De quoi peux-tu te remercier ce soir ?",
]

const currentEveningQuestion = computed(() => {
  if (!eveningQuestions.length) {
    return ''
  }

  const today = new Date()
  const startOfYear = Date.UTC(today.getFullYear(), 0, 1)
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const dayOfYear = Math.floor((todayUtc - startOfYear) / (24 * 60 * 60 * 1000))

  const index = dayOfYear % eveningQuestions.length
  return eveningQuestions[index] ?? eveningQuestions[0]
})

const isLastStep = computed(() => currentStep.value === 2)

const primaryCtaLabel = computed(() => (isLastStep.value ? 'Enregistrer' : 'Continuer'))

const stepIndicatorLabel = computed(
  () => `Bilan du soir · Etape ${currentStep.value} / 2`,
)

const moodOptions = [
  { value: 1, label: 'Tres tendue', icon: 'very-sad' },
  { value: 2, label: 'Plutot tendue', icon: 'sad' },
  { value: 3, label: 'Comme dhabitude', icon: 'neutral' },
  { value: 4, label: 'Plutot apaisee', icon: 'happy' },
  { value: 5, label: 'Tres apaisee', icon: 'very-happy' },
]

const selectedMood = computed(() => {
  if (selectedStress.value == null) return null
  return moodOptions.find((opt) => opt.value === selectedStress.value) ?? null
})

const eveningMoodTagSuggestions = [
  'epuise(e)',
  'tres stresse(e)',
  'fatigue(e)',
  'tendue',
  'anxieuse',
  'apaisee',
  'soulagée',
  'vide',
]

const eveningMoodTags = ref<string[]>([])
const isAddingEveningMoodTag = ref(false)
const eveningMoodTagInput = ref('')

function moodIconUrl(key: string) {
  return `/icons/mood/${key}.svg`
}

function vibrateLight() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

function selectStress(value: number) {
  selectedStress.value = value
  vibrateLight()
}

function toggleEveningMoodTag(tag: string) {
  const value = tag.trim()
  if (!value) {
    return
  }

  const normalized = value.toLowerCase()
  const current = eveningMoodTags.value
  const index = current.findIndex((item) => item.toLowerCase() === normalized)

  if (index !== -1) {
    eveningMoodTags.value = [
      ...current.slice(0, index),
      ...current.slice(index + 1),
    ]
    return
  }

  if (current.length >= 3) {
    return
  }

  eveningMoodTags.value = [...current, value]
  vibrateLight()
}

function startAddEveningMoodTag() {
  isAddingEveningMoodTag.value = true
  eveningMoodTagInput.value = ''
}

function confirmAddEveningMoodTag() {
  const value = eveningMoodTagInput.value.trim()
  if (!value) {
    isAddingEveningMoodTag.value = false
    return
  }

  toggleEveningMoodTag(value)
  isAddingEveningMoodTag.value = false
  eveningMoodTagInput.value = ''
}

function goToPreviousStep() {
  if (currentStep.value === 1) {
    emit('close')
    return
  }
  currentStep.value = 1
}

function goToNextStep() {
  if (!selectedStress.value) {
    return
  }
  if (!isLastStep.value) {
    currentStep.value = 2
    return
  }
  onConfirm()
}

function onConfirm() {
  if (!selectedStress.value) {
    return
  }
  emit('confirm', {
    level: selectedStress.value,
    note: eveningNote.value || undefined,
    question: currentEveningQuestion.value,
    moodTags: eveningMoodTags.value,
  })
}
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <div class="dialog-card evening-card">
      <div class="dialog-header evening-header">
        <h3 class="dialog-title">
          Bonsoir<span v-if="friendlyName">, {{ friendlyName }}</span>
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

      <div class="evening-body">
        <section
          v-if="currentStep === 1"
          class="evening-step"
        >
          <p class="evening-text evening-intro">
            On prend 1 minute pour faire le point avant de fermer la journee.
          </p>

          <div class="evening-step-main evening-section-card">
            <h4 class="evening-section-title">Ton niveau de stress ce soir</h4>
            <p class="evening-text">
              En un coup d'oeil, ou tu te situes ce soir ?
            </p>
            <div class="evening-mood-row">
              <button
                v-for="option in moodOptions"
                :key="option.value"
                type="button"
                class="evening-mood-button"
                :class="{ 'is-selected': selectedStress === option.value }"
                @click="selectStress(option.value)"
              >
                <img
                  class="evening-mood-icon"
                  :src="moodIconUrl(option.icon)"
                  :alt="option.label"
                />
              </button>
            </div>
            <div class="evening-mood-labels">
              <span class="evening-mood-label-left">
                {{ moodOptions[0]?.label }}
              </span>
              <span class="evening-mood-label-right">
                {{ moodOptions[moodOptions.length - 1]?.label }}
              </span>
            </div>
            <p
              v-if="selectedMood && selectedStress"
              class="evening-mood-rating"
            >
              {{ selectedStress }} / 5 - {{ selectedMood.label }}
            </p>
            <div class="evening-mood-tags-block">
              <p class="evening-mood-tags-title">
                Tu peux ajouter quelques mots sur ton etat (max 3) :
              </p>
              <div class="evening-mood-tags-row">
                <button
                  v-for="tag in eveningMoodTagSuggestions"
                  :key="tag"
                  type="button"
                  class="evening-mood-tag-chip"
                  :class="{ 'is-selected': eveningMoodTags.includes(tag) }"
                  @click="toggleEveningMoodTag(tag)"
                >
                  {{ tag }}
                </button>
                <button
                  v-if="!isAddingEveningMoodTag && eveningMoodTags.length < 3"
                  type="button"
                  class="evening-mood-tag-chip evening-mood-tag-chip--add"
                  @click="startAddEveningMoodTag"
                >
                  + Ajouter
                </button>
              </div>
              <div
                v-if="isAddingEveningMoodTag"
                class="evening-mood-tags-input-row"
              >
                <input
                  v-model="eveningMoodTagInput"
                  type="text"
                  class="evening-mood-tag-input"
                  maxlength="24"
                  placeholder="Un mot qui decrit ta soiree"
                  @keyup.enter.prevent="confirmAddEveningMoodTag"
                />
                <button
                  type="button"
                  class="evening-mood-tag-confirm"
                  @click="confirmAddEveningMoodTag"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          v-else
          class="evening-step"
        >
          <div class="evening-step-main evening-section-card">
            <h4 class="evening-section-title">Un petit mot pour clore la journee</h4>
            <p class="evening-question">
              {{ currentEveningQuestion }}
            </p>
            <textarea
              v-model="eveningNote"
              class="evening-textarea"
              rows="5"
              maxlength="280"
              placeholder="Une ou deux phrases suffisent. C'est juste pour toi."
            ></textarea>
            <p class="evening-note-counter">
              {{ eveningNote.length }}/280
            </p>
          </div>
        </section>
      </div>

      <div class="evening-footer">
        <button
          type="button"
          class="evening-back"
          :disabled="isSaving"
          @click="goToPreviousStep"
        >
          {{ currentStep === 1 ? 'Fermer' : 'Retour' }}
        </button>
        <button
          type="button"
          class="primary evening-cta"
          :disabled="isSaving || !selectedStress"
          @click="goToNextStep"
        >
          <span v-if="isSaving">Enregistrement...</span>
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

.evening-card {
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

.evening-header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 1.1rem;
  margin-bottom: 1rem;
}

.evening-header .dialog-title {
  width: 100%;
  text-align: center;
  font-size: 1.15rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}

.evening-header .dialog-close {
  position: absolute;
  top: 0;
  right: 0;
}

.evening-body {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.evening-body > .evening-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 360px;
  margin: 0 auto;
}

.evening-step-main {
  margin-top: 0.75rem;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

.evening-text {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
  line-height: 1.5;
}

.evening-intro {
  margin-bottom: 1.25rem;
}

.evening-section-title {
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
}

.evening-section-card {
  border-radius: 1rem;
  padding: 1.1rem 1.25rem 1.2rem;
  background: #111111;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    0 -1px 4px rgba(255, 255, 255, 0.03),
    0 6px 20px rgba(0, 0, 0, 0.4);
}

.evening-section-card .evening-section-title {
  margin-top: 0;
  margin-bottom: 1.2rem;
}

.evening-section-card > .evening-text,
.evening-section-card > .evening-question {
  margin-top: 0.25rem;
}

.evening-scale-row {
  margin-top: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.evening-scale-label {
  font-size: 0.8rem;
  opacity: 0.8;
}

.evening-stress-slider {
  flex: 1;
  accent-color: #22c55e;
}

.evening-scale-value {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

.evening-question {
  margin: 0.5rem 0 0.4rem;
  font-size: 0.9rem;
  opacity: 0.95;
}

.evening-textarea {
  margin-top: 0.25rem;
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.85);
  background: #020617;
  color: #e5e7eb;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  resize: vertical;
  min-height: 96px;
}

.evening-note-counter {
  margin-top: 0.3rem;
  font-size: 0.75rem;
  opacity: 0.75;
  text-align: right;
}

.evening-footer {
  margin-top: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.evening-back {
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #9ca3af;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
}

.evening-cta {
  margin-left: auto;
}

.evening-mood-row {
  margin-top: 0.85rem;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.evening-mood-button {
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease-out;
  animation: evening-mood-pop 0.25s ease-out;
}

.evening-mood-button.is-selected {
  transform: scale(1.05);
}

.evening-mood-icon {
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

.evening-mood-button.is-selected .evening-mood-icon {
  border-color: #22c55e;
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.6), 0 8px 20px rgba(22, 163, 74, 0.45);
}

@keyframes evening-mood-pop {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.evening-mood-labels {
  margin-top: 0.6rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  opacity: 0.8;
}

.evening-mood-rating {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  opacity: 0.85;
}

.evening-mood-tags-block {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.evening-mood-tags-title {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

.evening-mood-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.evening-mood-tag-chip {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #020617;
  color: #e5e7eb;
  padding: 0.25rem 0.7rem;
  font-size: 0.75rem;
}

.evening-mood-tag-chip.is-selected {
  border-color: #22c55e;
  background: #16a34a;
  color: #022c22;
}

.evening-mood-tag-chip--add {
  border-style: dashed;
  opacity: 0.9;
}

.evening-mood-tags-input-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.evening-mood-tag-input {
  flex: 1;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: #020617;
  color: #e5e7eb;
  padding: 0.3rem 0.7rem;
  font-size: 0.8rem;
}

.evening-mood-tag-confirm {
  border-radius: 999px;
  border: none;
  background: #22c55e;
  color: #022c22;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
}

</style>
