<script setup lang="ts">
import type { WellbeingExercise } from '../types'

const props = defineProps<{
  exercise: WellbeingExercise
}>()

const emit = defineEmits<{
  (e: 'start'): void
}>()
</script>

<template>
  <section class="wellbeing-card">
    <h2>Bien-etre du jour</h2>
    <h3 class="wellbeing-title">{{ props.exercise.title }}</h3>
    <p class="wellbeing-text">
      {{ props.exercise.description }}
    </p>
    <p class="wellbeing-meta">
      Environ {{ props.exercise.durationMinutes }} minute(s).
    </p>
    <button type="button" class="primary wellbeing-button" @click="emit('start')">
      Commencer
    </button>
  </section>
</template>

<style scoped>
.wellbeing-card {
  max-width: 100%;
  width: 100%;
  padding: 1.5rem 1.5rem 1.25rem;
  border-radius: 1rem;
  margin: 0 auto;
  background: #111111;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    0 -1px 4px rgba(255, 255, 255, 0.03),
    0 6px 20px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.wellbeing-card > h2 {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.wellbeing-title {
  margin: 0;
  font-size: 1.1rem;
}
.wellbeing-text {
  margin: 0;
  font-size: 0.95rem;
}
.wellbeing-meta {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.8;
}
.wellbeing-button {
  width: 100%;
}
</style>
