<script setup lang="ts">
import { computed, ref } from 'vue'

type DialogWorkoutKind =
  | 'cardio'
  | 'strength'
  | 'mobility'
  | 'mixed'
  | 'auto'
  | 'jump'
  | 'stretch'
  | 'yoga'
  | 'rowing'

const props = defineProps<{
  isSavingSession: boolean
  weeklySessions: number | null
  selectedDuration: 5 | 10 | 15 | 20 | 30
  selectedKind: DialogWorkoutKind
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm-add'): void
  (e: 'confirm-remove'): void
  (e: 'update:selected-duration', value: 5 | 10 | 15 | 20 | 30): void
  (e: 'update:selected-kind', value: DialogWorkoutKind): void
}>()

const durations: (5 | 10 | 15 | 20 | 30)[] = [5, 10, 15, 20, 30]

const kindOptions: { key: DialogWorkoutKind; label: string }[] = [
  { key: 'cardio', label: 'Cardio leger' },
  { key: 'strength', label: 'Renfo' },
  { key: 'mobility', label: 'Mobilite / reveil' },
  { key: 'jump', label: 'Corde a sauter' },
  { key: 'stretch', label: 'Flexibilite' },
  { key: 'yoga', label: 'Yoga' },
  { key: 'rowing', label: 'Rameur' },
  { key: 'mixed', label: 'Mix cardio + renfo' },
  { key: 'auto', label: "Auto (laisse l'app choisir)" },
]

const explicitKindOptions = computed(() => kindOptions.filter((opt) => opt.key !== 'auto'))

const currentStep = ref<1 | 2>(1)

const isLastStep = computed(() => currentStep.value === 2)

const primaryCtaLabel = computed(() => (isLastStep.value ? 'Commencer' : 'Continuer'))

const stepIndicatorLabel = computed(() => `Etape ${currentStep.value} / 2`)

const selectedKindLabel = computed(() => {
  const option = kindOptions.find((opt) => opt.key === props.selectedKind)
  return option?.label ?? "Auto (laisse l'app choisir)"
})

const durationMessages: Record<5 | 10 | 15 | 20 | 30, string> = {
  5: '5 minutes pour te poser sans pression.',
  10: '10 minutes pour relancer ton energie en douceur.',
  15: '15 minutes pour une vraie parenthese pour toi.',
  20: '20 minutes pour decompresser un peu plus en profondeur.',
  30: '30 minutes rien que pour toi, a ton rythme.',
}

const durationMoodMessage = computed(() => durationMessages[props.selectedDuration])

function vibrateLight() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

function updateDuration(value: 5 | 10 | 15 | 20 | 30) {
  emit('update:selected-duration', value)
  vibrateLight()
}

function updateKind(value: DialogWorkoutKind) {
  emit('update:selected-kind', value)
  vibrateLight()
}

function goToNextStep() {
  if (!isLastStep.value) {
    currentStep.value = 2
    return
  }
  emit('confirm-add')
}

function goToPreviousStep() {
  if (currentStep.value === 1) {
    emit('close')
    return
  }
  currentStep.value = 1
}
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <div class="dialog-card session-card">
      <div class="dialog-header session-header">
        <h3 class="dialog-title">Nouvelle seance</h3>
        <p class="dialog-step-indicator">{{ stepIndicatorLabel }}</p>
        <button
          type="button"
          class="dialog-close"
          @click="emit('close')"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>

      <div class="session-body">
        <section
          v-if="currentStep === 1"
          class="session-step"
        >
          <p class="session-text session-intro">
            On se garde un petit moment realiste pour toi, la maintenant.
          </p>

          <div class="session-step-main">
            <h4 class="session-section-title">Combien de temps tu as devant toi ?</h4>
            <div class="session-choices-row">
              <button
                v-for="value in durations"
                :key="value"
                type="button"
                class="session-chip"
                :class="{ 'is-active': selectedDuration === value }"
                :disabled="isSavingSession"
                @click="updateDuration(value)"
              >
                {{ value }} min
              </button>
            </div>
            <p v-if="durationMoodMessage" class="session-hint session-hint--emotional">
              {{ durationMoodMessage }}
            </p>
          </div>
        </section>

        <section
          v-else
          class="session-step"
        >
          <div class="session-step-main">
            <h4 class="session-section-title">Quel type de seance te ferait du bien ?</h4>
            <p class="session-text">
              Tu peux laisser sur "Auto" et je choisis pour toi, ou choisir un type precis.
            </p>

            <div class="session-auto-block">
              <button
                type="button"
                class="session-chip session-chip--auto"
                :class="{ 'is-active': selectedKind === 'auto' }"
                :disabled="isSavingSession"
                @click="updateKind('auto')"
              >
                <span class="session-auto-title">Auto</span>
                <span class="session-auto-subtitle">Laisse l'app choisir pour toi</span>
              </button>
            </div>

            <p class="session-text session-text--muted">
              Ou choisis un type precis :
            </p>

            <div class="session-choices-row">
              <button
                v-for="option in explicitKindOptions"
                :key="option.key"
                type="button"
                class="session-chip"
                :class="{ 'is-active': selectedKind === option.key }"
                :disabled="isSavingSession"
                @click="updateKind(option.key)"
              >
                {{ option.label }}
              </button>
            </div>
            <p class="session-summary">
              {{ selectedDuration }} min - {{ selectedKindLabel }}
            </p>
          </div>
        </section>
      </div>

      <div class="session-footer">
        <button
          type="button"
          class="session-back"
          :disabled="isSavingSession"
          @click="goToPreviousStep"
        >
          {{ currentStep === 1 ? 'Fermer' : 'Retour' }}
        </button>
        <button
          type="button"
          class="primary session-cta"
          :disabled="isSavingSession"
          @click="goToNextStep"
        >
          <span v-if="isSavingSession">Enregistrement...</span>
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

.session-card {
  max-width: 420px;
  width: 100%;
  height: 100vh;
  margin: 0 auto;
  border-radius: 0;
  border: none;
  box-shadow: none;
  padding: 1.75rem 1.25rem 2.25rem;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.session-header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 1.75rem;
  margin-bottom: 1.5rem;
}

.session-header .dialog-title {
  width: 100%;
  text-align: center;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}

.session-header .dialog-close {
  position: absolute;
  top: 0;
  right: 0;
}

.session-body {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.session-body > .session-step {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.session-step-main {
  margin-bottom: auto;
  display: flex;
  flex-direction: column;
}

.session-text {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.session-intro {
  margin-bottom: 2rem;
}

.session-text--muted {
  opacity: 0.8;
  font-size: 0.8rem;
}

.session-section-title {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}

.session-choices-row {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.session-chip {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #020617;
  color: #e5e7eb;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
  transition: background-color 0.12s ease-out, border-color 0.12s ease-out,
    transform 0.12s ease-out, box-shadow 0.12s ease-out;
}

.session-chip.is-active {
  border-color: #22c55e;
  background: #22c55e;
  color: #022c22;
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 8px 18px rgba(34, 197, 94, 0.4);
}

.session-hint {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

.session-hint--emotional {
  margin-top: 0.35rem;
  opacity: 0.9;
}

.session-summary {
  margin: 1rem 0 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

.session-auto-block {
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
}

.session-chip--auto {
  width: 100%;
  justify-content: flex-start;
  padding: 0.55rem 0.9rem;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  border-color: #22c55e;
  color: #022c22;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.session-auto-title {
  font-size: 0.85rem;
  font-weight: 600;
}

.session-auto-subtitle {
  font-size: 0.8rem;
  opacity: 0.9;
}

.session-footer {
  margin-top: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.session-back {
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #9ca3af;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
}

.session-remove {
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #9ca3af;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
}

.session-cta {
  margin-left: auto;
}
</style>
