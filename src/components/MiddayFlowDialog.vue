<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  displayName: string
  hasBreathingOption: boolean
  initialMoodTags?: { tag: string; count: number }[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'choose-move', payload: { moodLevel: number | null; moodTags: string[] }): void
  (e: 'choose-breathe', payload: { moodLevel: number | null; moodTags: string[] }): void
}>()

const friendlyName = computed(() => {
  const raw = props.displayName?.trim()
  if (!raw) return ''
  const first = raw.split(' ')[0] ?? ''
  return first
})

const currentStep = ref<1 | 2>(1)
const moodLevel = ref<number | null>(null)

const totalSteps = 2
const stepIndicatorLabel = computed(
  () => `Pause du midi · Etape ${currentStep.value} / ${totalSteps}`,
)

const moodOptions = [
  { value: 1, label: 'Mal', icon: 'very-sad' },
  { value: 2, label: 'Plutot mal', icon: 'sad' },
  { value: 3, label: 'Comme dhabitude', icon: 'neutral' },
  { value: 4, label: 'Plutot bien', icon: 'happy' },
  { value: 5, label: 'Super bien', icon: 'very-happy' },
]

const selectedMood = computed(() => {
  if (moodLevel.value == null) return null
  return moodOptions.find((opt) => opt.value === moodLevel.value) ?? null
})

const baseMiddayMoodTagSuggestions = [
  'malade',
  'epuise(e)',
  'tres stresse(e)',
  'fatigue(e)',
  'tendue',
  'anxieuse',
  'apaisee',
  'submergee',
]

const middayMoodTags = ref<string[]>([])
const isAddingMiddayMoodTag = ref(false)
const middayMoodTagInput = ref('')

const middayMoodTagSuggestions = computed(() => {
  const base = baseMiddayMoodTagSuggestions
  const dynamicSource = props.initialMoodTags ?? []

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

const customMiddayMoodTags = computed(() => {
  const suggestions = middayMoodTagSuggestions.value.map((tag) => tag.toLowerCase())
  return middayMoodTags.value.filter(
    (tag) => !suggestions.includes(tag.toLowerCase()),
  )
})

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

function toggleMiddayMoodTag(tag: string) {
  const value = tag.trim()
  if (!value) {
    return
  }

  const normalized = value.toLowerCase()
  const current = middayMoodTags.value
  const index = current.findIndex((item) => item.toLowerCase() === normalized)

  if (index !== -1) {
    middayMoodTags.value = [
      ...current.slice(0, index),
      ...current.slice(index + 1),
    ]
    return
  }

  if (current.length >= 3) {
    return
  }

  middayMoodTags.value = [...current, value]
  vibrateLight()
}

function startAddMiddayMoodTag() {
  isAddingMiddayMoodTag.value = true
  middayMoodTagInput.value = ''
}

function confirmAddMiddayMoodTag() {
  const value = middayMoodTagInput.value.trim()
  if (!value) {
    isAddingMiddayMoodTag.value = false
    return
  }

  toggleMiddayMoodTag(value)
  isAddingMiddayMoodTag.value = false
  middayMoodTagInput.value = ''
}

function goToPreviousStep() {
  if (currentStep.value === 1) {
    emit('close')
    return
  }
  currentStep.value = 1
}

function goToNextStep() {
  if (
    currentStep.value === 1 &&
    (isAddingMiddayMoodTag.value || middayMoodTagInput.value.trim())
  ) {
    confirmAddMiddayMoodTag()
  }

  if (!moodLevel.value) {
    return
  }
  currentStep.value = 2
}

function onChooseMove() {
  emit('choose-move', { moodLevel: moodLevel.value ?? null, moodTags: middayMoodTags.value })
}

function onChooseBreathe() {
  emit('choose-breathe', { moodLevel: moodLevel.value ?? null, moodTags: middayMoodTags.value })
}
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <div class="dialog-card midday-card">
      <div class="dialog-header midday-header">
        <h3 class="dialog-title">
          Midi<span v-if="friendlyName">, {{ friendlyName }}</span>
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

      <div class="midday-body">
        <section
          v-if="currentStep === 1"
          class="midday-step"
        >
          <p class="midday-text midday-intro">
            On prend 30 secondes pour voir comment tu te sens avant ta pause.
          </p>

          <div class="midday-step-main midday-section-card">
            <h4 class="midday-section-title">Comment tu te sens en ce moment ?</h4>
            <div class="midday-mood-row">
              <button
                v-for="option in moodOptions"
                :key="option.value"
                type="button"
                class="midday-mood-button"
                :class="{ 'is-selected': moodLevel === option.value }"
                @click="selectMood(option.value)"
              >
                <img
                  class="midday-mood-icon"
                  :src="moodIconUrl(option.icon)"
                  :alt="option.label"
                />
              </button>
            </div>
            <div class="midday-mood-labels">
              <span class="midday-mood-label-left">{{ moodOptions[0]?.label }}</span>
              <span class="midday-mood-label-right">
                {{ moodOptions[moodOptions.length - 1]?.label }}
              </span>
            </div>
            <p
              v-if="selectedMood && moodLevel"
              class="midday-mood-rating"
            >
              {{ moodLevel }} / 5 - {{ selectedMood.label }}
            </p>
            <div class="midday-mood-tags-block">
              <p class="midday-mood-tags-title">
                Tu peux preciser avec quelques mots (max 3) :
              </p>
              <div class="midday-mood-tags-row">
                <button
                  v-for="tag in middayMoodTagSuggestions"
                  :key="tag"
                  type="button"
                  class="midday-mood-tag-chip"
                  :class="{ 'is-selected': middayMoodTags.includes(tag) }"
                  @click="toggleMiddayMoodTag(tag)"
                >
                  {{ tag }}
                </button>
                <button
                  v-if="!isAddingMiddayMoodTag && middayMoodTags.length < 3"
                  type="button"
                  class="midday-mood-tag-chip midday-mood-tag-chip--add"
                  @click="startAddMiddayMoodTag"
                >
                  + Ajouter
                </button>
              </div>
              <div
                v-if="customMiddayMoodTags.length"
                class="midday-mood-tags-row midday-mood-tags-row--custom"
              >
                <button
                  v-for="tag in customMiddayMoodTags"
                  :key="tag"
                  type="button"
                  class="midday-mood-tag-chip is-selected"
                  @click="toggleMiddayMoodTag(tag)"
                >
                  {{ tag }}
                </button>
              </div>
              <div
                v-if="isAddingMiddayMoodTag"
                class="midday-mood-tags-input-row"
              >
                <input
                  v-model="middayMoodTagInput"
                  type="text"
                  class="midday-mood-tag-input"
                  maxlength="24"
                  placeholder="Un mot qui decrit ton etat"
                  @keyup.enter.prevent="confirmAddMiddayMoodTag"
                />
                <button
                  type="button"
                  class="midday-mood-tag-confirm"
                  @click="confirmAddMiddayMoodTag"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          v-else
          class="midday-step"
        >
          <div class="midday-step-main midday-section-card">
            <h4 class="midday-section-title">Ta pause de milieu de journee</h4>
            <p class="midday-text">
              Tu peux choisir de bouger un peu ou de respirer au calme.
            </p>
            <div class="midday-actions">
              <button
                type="button"
                class="primary midday-action-button"
                @click="onChooseMove"
              >
                Bouger 5 minutes
              </button>
              <button
                v-if="props.hasBreathingOption"
                type="button"
                class="secondary midday-action-button"
                @click="onChooseBreathe"
              >
                Respirer 3 minutes
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="midday-footer">
        <button
          type="button"
          class="midday-back"
          @click="goToPreviousStep"
        >
          {{ currentStep === 1 ? 'Fermer' : 'Retour' }}
        </button>
        <button
          v-if="currentStep === 1"
          type="button"
          class="primary midday-cta"
          :disabled="!moodLevel"
          @click="goToNextStep"
        >
          Continuer
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

.midday-card {
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

.midday-header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 1.1rem;
  margin-bottom: 1rem;
}

.midday-header .dialog-title {
  width: 100%;
  text-align: center;
  font-size: 1.15rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}

.midday-header .dialog-close {
  position: absolute;
  top: 0;
  right: 0;
}

.midday-body {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.midday-body > .midday-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 360px;
  margin: 0 auto;
}

.midday-step-main {
  margin-top: 0.75rem;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

.midday-text {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
  line-height: 1.5;
}

.midday-intro {
  margin-bottom: 1.25rem;
}

.midday-section-title {
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
}

.midday-section-card {
  border-radius: 1rem;
  padding: 1.1rem 1.25rem 1.2rem;
  background: #111111;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    0 -1px 4px rgba(255, 255, 255, 0.03),
    0 6px 20px rgba(0, 0, 0, 0.4);
}

.midday-section-card .midday-section-title {
  margin-top: 0;
  margin-bottom: 1.2rem;
}

.midday-section-card > .midday-text {
  margin-top: 0.25rem;
}

.midday-mood-row {
  margin-top: 0.75rem;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.midday-mood-button {
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease-out;
  animation: midday-mood-pop 0.25s ease-out;
}

.midday-mood-button.is-selected {
  transform: scale(1.05);
}

.midday-mood-icon {
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

.midday-mood-button.is-selected .midday-mood-icon {
  border-color: #22c55e;
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.6), 0 8px 20px rgba(22, 163, 74, 0.45);
}

@keyframes midday-mood-pop {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.midday-mood-labels {
  margin-top: 0.6rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  opacity: 0.8;
}

.midday-mood-rating {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  opacity: 0.85;
}

.midday-mood-tags-block {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.midday-mood-tags-title {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

.midday-mood-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.midday-mood-tags-row--custom {
  margin-top: 0.1rem;
}

.midday-mood-tag-chip {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #020617;
  color: #e5e7eb;
  padding: 0.25rem 0.7rem;
  font-size: 0.75rem;
}

.midday-mood-tag-chip.is-selected {
  border-color: #22c55e;
  background: #16a34a;
  color: #022c22;
}

.midday-mood-tag-chip--add {
  border-style: dashed;
  opacity: 0.9;
}

.midday-mood-tags-input-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.midday-mood-tag-input {
  flex: 1;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: #020617;
  color: #e5e7eb;
  padding: 0.3rem 0.7rem;
  font-size: 0.8rem;
}

.midday-mood-tag-confirm {
  border-radius: 999px;
  border: none;
  background: #22c55e;
  color: #022c22;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.midday-actions {
  margin-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.midday-action-button {
  width: 100%;
}

.midday-footer {
  margin-top: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.midday-back {
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #9ca3af;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
}

.midday-cta {
  margin-left: auto;
}
</style>
