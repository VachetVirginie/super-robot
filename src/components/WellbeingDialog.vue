<script setup lang="ts">
import type { WellbeingExercise } from '../types'

const props = defineProps<{
  exercises: WellbeingExercise[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', key: string): void
}>()
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <div class="dialog-card">
      <div class="dialog-header">
        <h3 class="dialog-title">Choisir une pause</h3>
        <button
          type="button"
          class="dialog-close"
          @click="emit('close')"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>
      <p class="dialog-text">
        Selectionne un exercice de bien-etre pour ta pause.
      </p>
      <div class="wellbeing-dialog-grid">
        <button
          v-for="exercise in props.exercises"
          :key="exercise.key"
          type="button"
          class="wellbeing-option-card"
          @click="emit('select', exercise.key)"
        >
          <h4 class="wellbeing-option-title">{{ exercise.title }}</h4>
          <p class="wellbeing-option-desc">
            {{ exercise.description }}
          </p>
          <p class="wellbeing-option-meta">
            Environ {{ exercise.durationMinutes }} min
          </p>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Utilise les styles dialog-*, wellbeing-dialog-* globaux definis dans RootApp.vue */
</style>
