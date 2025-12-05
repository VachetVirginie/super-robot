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

const currentStep = ref<1 | 2>(1)

const isLastStep = computed(() => currentStep.value === 2)

const primaryCtaLabel = computed(() => (isLastStep.value ? "C'est parti" : 'Continuer'))

const selectedKindLabel = computed(() => {
  const option = kindOptions.find((opt) => opt.key === props.selectedKind)
  return option?.label ?? "Auto (laisse l'app choisir)"
})

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
                @click="emit('update:selected-duration', value)"
              >
                {{ value }} min
              </button>
            </div>
            <p class="session-hint">
              Tu peux rester sur 5 minutes, c'est deja tres bien.
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
              Tu peux choisir un type precis ou laisser sur "Auto" et je choisis pour toi.
            </p>
            <div class="session-choices-row">
              <button
                v-for="option in kindOptions"
                :key="option.key"
                type="button"
                class="session-chip"
                :class="{ 'is-active': selectedKind === option.key }"
                :disabled="isSavingSession"
                @click="emit('update:selected-kind', option.key)"
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
  margin-top: auto;
  margin-bottom: auto;
  display: flex;
  flex-direction: column;
}

.session-text {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.session-intro {
  margin-bottom: 2rem;
}

.session-section-title {
  margin: 0;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
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
}

.session-chip.is-active {
  border-color: #22c55e;
  background: #22c55e;
  color: #022c22;
}

.session-hint {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

.session-summary {
  margin: 1rem 0 0;
  font-size: 0.8rem;
  opacity: 0.85;
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
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: transparent;
  color: #e5e7eb;
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
