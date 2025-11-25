<script setup lang="ts">
const props = defineProps<{
  isSavingSession: boolean
  weeklySessions: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm-add'): void
  (e: 'confirm-remove'): void
}>()
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <div class="dialog-card">
      <div class="dialog-header">
        <h3 class="dialog-title">Ajouter une seance</h3>
        <button
          type="button"
          class="dialog-close"
          @click="emit('close')"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>
      <p class="dialog-text">
        Confirme que tu as realise une seance. Elle sera ajoutee a ta semaine
        en cours.
      </p>
      <div class="dialog-actions">
        <button
          type="button"
          class="secondary dialog-primary"
          :disabled="props.isSavingSession || !props.weeklySessions || props.weeklySessions === 0"
          @click="emit('confirm-remove')"
        >
          Retirer la derniere seance
        </button>
        <button
          type="button"
          class="primary dialog-primary"
          :disabled="props.isSavingSession"
          @click="emit('confirm-add')"
        >
          <span v-if="props.isSavingSession">Enregistrement...</span>
          <span v-else>Confirmer la seance</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Utilise les styles dialog-* globaux definis dans RootApp.vue */
</style>
