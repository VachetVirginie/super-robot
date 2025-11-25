<script setup lang="ts">
const props = defineProps<{
  goalDraft: number | null
  perWeekGoal: number | null
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'change-draft', delta: number): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <div class="dialog-card">
      <div class="dialog-header">
        <h3 class="dialog-title">Ajuster ton objectif</h3>
        <button
          type="button"
          class="dialog-close"
          @click="emit('close')"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>
      <p class="dialog-text">
        Combien de seances veux-tu viser cette semaine ?
      </p>
      <div class="goal-dialog-row">
        <button
          type="button"
          class="goal-btn"
          @click="emit('change-draft', -1)"
        >
          -
        </button>
        <div class="goal-dialog-value">
          {{ props.goalDraft ?? props.perWeekGoal ?? 1 }} seance(s) / semaine
        </div>
        <button
          type="button"
          class="goal-btn"
          @click="emit('change-draft', 1)"
        >
          +
        </button>
      </div>
      <div class="dialog-actions">
        <button
          type="button"
          class="primary dialog-primary"
          :disabled="props.isSaving"
          @click="emit('confirm')"
        >
          Mettre a jour l'objectif
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Utilise les styles dialog-*, goal-dialog-* globaux definis dans RootApp.vue */
</style>
