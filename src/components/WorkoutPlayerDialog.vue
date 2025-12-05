<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { EXERCISES, WORKOUT_TEMPLATES, type WorkoutTemplate } from '../workoutCatalog'

type BlockType = 'warmup' | 'main' | 'cooldown'

const props = defineProps<{
  templateKey: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'finish'): void
}>()

interface WorkoutStep {
  index: number
  total: number
  blockType: BlockType
  exerciseId: string
  exerciseName: string
  exerciseDescription: string
  durationSeconds: number
}

const template = computed<WorkoutTemplate | null>(() => {
  if (!props.templateKey) return null
  return WORKOUT_TEMPLATES.find((tpl) => tpl.key === props.templateKey) ?? null
})

const steps = computed<WorkoutStep[]>(() => {
  const tpl = template.value
  if (!tpl) return []

  const result: WorkoutStep[] = []
  let index = 0

  for (const block of tpl.blocks) {
    if (!block.exerciseIds.length || block.durationSeconds <= 0) continue

    const perExercise = Math.max(15, Math.round(block.durationSeconds / block.exerciseIds.length))

    for (const exerciseId of block.exerciseIds) {
      const exercise = EXERCISES.find((ex) => ex.id === exerciseId) ?? null
      result.push({
        index,
        total: 0, // sera rempli juste apres
        blockType: block.type,
        exerciseId,
        exerciseName: exercise?.name ?? exerciseId,
        exerciseDescription: exercise?.description ?? '',
        durationSeconds: perExercise,
      })
      index += 1
    }
  }

  const total = result.length
  for (const step of result) {
    step.total = total
  }

  return result
})

const currentStepIndex = ref(0)
const remainingSeconds = ref<number | null>(null)
const isPlaying = ref(false)
const timerId = ref<number | null>(null)
const isAutoAdvance = ref(true)
const isCompleted = ref(false)

const currentStep = computed<WorkoutStep | null>(() => {
  const list = steps.value
  if (!list.length) return null
  if (currentStepIndex.value < 0 || currentStepIndex.value >= list.length) return list[0]!
  return list[currentStepIndex.value] ?? null
})

const totalDurationMinutes = computed(() => {
  const totalSeconds = steps.value.reduce((acc, step) => acc + step.durationSeconds, 0)
  return Math.round(totalSeconds / 60)
})

const blockTypeLabel = computed(() => {
  const step = currentStep.value
  if (!step) return ''
  if (step.blockType === 'warmup') return 'Echauffement'
  if (step.blockType === 'cooldown') return 'Retour au calme'
  return 'Bloc principal'
})

const formattedRemaining = computed(() => {
  const value = remainingSeconds.value
  if (value == null || !Number.isFinite(value) || value <= 0) return '0:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const upcomingSteps = computed(() =>
  steps.value.slice(currentStepIndex.value + 1).slice(0, 4),
)

function stopTimer() {
  if (timerId.value !== null) {
    window.clearInterval(timerId.value)
    timerId.value = null
  }
  isPlaying.value = false
}

function startTimerForCurrentStep() {
  const step = currentStep.value
  if (!step) {
    remainingSeconds.value = null
    stopTimer()
    return
  }

  stopTimer()
  remainingSeconds.value = step.durationSeconds
  isPlaying.value = true

  timerId.value = window.setInterval(() => {
    if (remainingSeconds.value == null) return

    if (remainingSeconds.value > 0) {
      remainingSeconds.value -= 1
    }

    if (remainingSeconds.value <= 0) {
      goToNextStep(true)
    }
  }, 1000)
}

function goToNextStep(auto = false) {
  stopTimer()

  if (!steps.value.length) return

  if (currentStepIndex.value < steps.value.length - 1) {
    if (auto && !isAutoAdvance.value) {
      // En mode manuel, on ne passe pas automatiquement a l'etape suivante
      return
    }

    currentStepIndex.value += 1

    if (auto && isAutoAdvance.value) {
      startTimerForCurrentStep()
    }
  } else {
    // Fin de la sequence : on demande a l'utilisateur s'il veut enregistrer
    isCompleted.value = true
  }
}

function goToPreviousStep() {
  stopTimer()
  if (!steps.value.length) return

  if (currentStepIndex.value > 0) {
    currentStepIndex.value -= 1
  }
}

function onTogglePlay() {
  if (!currentStep.value || isCompleted.value) return
  if (isPlaying.value) {
    stopTimer()
  } else {
    startTimerForCurrentStep()
  }
}

function onClose() {
  stopTimer()
  emit('close')
}

watch(
  () => props.templateKey,
  () => {
    stopTimer()
    currentStepIndex.value = 0
    isCompleted.value = false
    const step = currentStep.value
    remainingSeconds.value = step ? step.durationSeconds : null
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<template>
  <div class="dialog-backdrop" @click.self="onClose">
    <div class="dialog-card workout-player">
      <header class="workout-player-header">
        <div class="workout-player-text">
          <h3 class="workout-player-title">
            {{ template?.name ?? 'Seance' }}
          </h3>
          <p class="workout-player-subtitle">
            <span v-if="template">
              <span v-if="template.kind === 'cardio'">Cardio leger</span>
              <span v-else-if="template.kind === 'strength'">Renfo</span>
              <span v-else-if="template.kind === 'mobility'">Mobilite</span>
              <span v-else-if="template.kind === 'jump'">Corde à sauter</span>
              <span v-else-if="template.kind === 'stretch'">Flexibilite</span>
              <span v-else-if="template.kind === 'yoga'">Yoga</span>
              <span v-else-if="template.kind === 'rowing'">Rameur</span>
              <span v-else-if="template.kind === 'mixed'">Mix cardio + renfo</span>
              · ~{{ totalDurationMinutes }} min
            </span>
            <span v-else>Seance non trouvee.</span>
          </p>
        </div>
        <button type="button" class="dialog-close" @click="onClose">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </header>

      <section v-if="isCompleted" class="workout-player-main">
        <p class="workout-player-desc">
          Seance terminee. Tu veux l'enregistrer dans ta semaine ?
        </p>
      </section>

      <section v-else-if="currentStep" class="workout-player-main">
        <div class="workout-player-timer">
          <div class="workout-player-circle">
            <span class="workout-player-time">{{ formattedRemaining }}</span>
          </div>
          <p class="workout-player-step-index">
            Etape {{ currentStep.index + 1 }} / {{ currentStep.total }}
          </p>
          <p class="workout-player-block">{{ blockTypeLabel }}</p>
        </div>

        <div class="workout-player-info">
          <h4 class="workout-player-exercise">{{ currentStep.exerciseName }}</h4>
          <p v-if="currentStep.exerciseDescription" class="workout-player-desc">
            {{ currentStep.exerciseDescription }}
          </p>
        </div>

        <section v-if="upcomingSteps.length" class="workout-player-upcoming">
          <p class="workout-player-upcoming-title">A venir :</p>
          <ul class="workout-player-upcoming-list">
            <li
              v-for="step in upcomingSteps"
              :key="step.index"
              class="workout-player-upcoming-item"
            >
              <span class="upcoming-block">
                {{
                  step.blockType === 'warmup'
                    ? 'Echauffement'
                    : step.blockType === 'cooldown'
                      ? 'Retour au calme'
                      : 'Bloc principal'
                }}
              </span>
              <span class="upcoming-name">{{ step.exerciseName }}</span>
              <span class="upcoming-duration">
                {{ Math.max(1, Math.round(step.durationSeconds / 60)) }} min
              </span>
            </li>
          </ul>
        </section>
      </section>

      <section v-else class="workout-player-main">
        <p class="workout-player-desc">
          Aucune etape trouvee pour cette seance.
        </p>
      </section>

      <footer v-if="isCompleted" class="workout-player-footer">
        <button
          type="button"
          class="secondary workout-player-button"
          @click="onClose"
        >
          Ne pas enregistrer
        </button>
        <button
          type="button"
          class="primary workout-player-button main"
          @click="emit('finish')"
        >
          Enregistrer la seance
        </button>
      </footer>

      <footer v-else class="workout-player-footer">
        <button
          type="button"
          class="secondary workout-player-button"
          :disabled="!currentStep || currentStep.index === 0"
          @click="goToPreviousStep()"
        >
          Etape precedente
        </button>
        <button
          type="button"
          class="primary workout-player-button main"
          :disabled="!currentStep"
          @click="onTogglePlay"
        >
          <span v-if="isPlaying">Pause</span>
          <span v-else>Lancer l'etape</span>
        </button>
        <button
          type="button"
          class="secondary workout-player-button"
          :disabled="!currentStep"
          @click="goToNextStep()"
        >
          Etape suivante
        </button>
        <button
          type="button"
          class="secondary workout-player-button mode"
          @click="isAutoAdvance = !isAutoAdvance"
        >
          Mode {{ isAutoAdvance ? 'auto' : 'manuel' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.workout-player {
  max-width: 420px;
}

.workout-player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.workout-player-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.workout-player-title {
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.workout-player-subtitle {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

.workout-player-main {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1.1rem;
}

.workout-player-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

.workout-player-circle {
  width: 120px;
  height: 120px;
  border-radius: 999px;
  border: 2px solid #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.workout-player-time {
  font-size: 1.4rem;
  font-variant-numeric: tabular-nums;
}

.workout-player-step-index {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.85;
}

.workout-player-block {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.75;
}

.workout-player-info {
  border-radius: 0.9rem;
  padding: 0.85rem 0.9rem;
  background: #0b0b0b;
  border: 1px solid #27272a;
}

.workout-player-exercise {
  margin: 0 0 0.3rem;
  font-size: 0.95rem;
}

.workout-player-desc {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.85;
}

.workout-player-upcoming {
  margin-top: 0.85rem;
}

.workout-player-upcoming-title {
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.workout-player-upcoming-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.workout-player-upcoming-item {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  font-size: 0.8rem;
  opacity: 0.85;
}

.upcoming-block {
  font-weight: 500;
}

.upcoming-name {
  opacity: 0.95;
}

.upcoming-duration {
  opacity: 0.75;
}

.workout-player-footer {
  margin-top: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.workout-player-button {
  width: 100%;
}

.workout-player-button.main {
  font-weight: 600;
}

.workout-player-button.mode {
  font-size: 0.8rem;
}
</style>
