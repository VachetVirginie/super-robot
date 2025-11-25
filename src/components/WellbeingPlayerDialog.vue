<script setup lang="ts">
import type { WellbeingExercise } from '../types'

const props = defineProps<{
  exercise: WellbeingExercise | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <div
    v-if="props.exercise"
    class="dialog-backdrop"
    @click.self="emit('close')"
  >
    <div class="dialog-card">
      <div class="dialog-header">
        <h3 class="dialog-title">{{ props.exercise.title }}</h3>
        <button
          type="button"
          class="dialog-close"
          @click="emit('close')"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>
      <p class="dialog-text">
        Installe-toi confortablement et lance la seance audio.
      </p>
      <div class="audio-dialog-body">
        <audio
          v-if="props.exercise.audioUrl"
          class="audio-player"
          :src="props.exercise.audioUrl"
          controls
          autoplay
        ></audio>
        <p v-else class="info">
          L'audio pour cette seance n'est pas encore configure.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Utilise les styles dialog-*, audio-dialog-* globaux definis dans RootApp.vue */
</style>
