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
        <h3 class="dialog-title">Ajuster ta semaine</h3>
        <button
          type="button"
          class="dialog-close"
          @click="emit('close')"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>
      <p class="dialog-text">
        Si tu as oublie d'enregistrer une ou plusieurs seances les jours precedents,
        tu peux corriger le total de ta semaine ici.
      </p>
      <p class="dialog-text">
        Seances actuellement comptabilisees cette semaine :
        <strong>{{ props.weeklySessions ?? 0 }}</strong>
      </p>
      <div class="dialog-actions">
        <button
          type="button"
          class="secondary dialog-primary"
          :disabled="props.isSavingSession || !props.weeklySessions || props.weeklySessions === 0"
          @click="emit('confirm-remove')"
        >
          Retirer la derniere seance de la semaine
        </button>
        <button
          type="button"
          class="primary dialog-primary"
          :disabled="props.isSavingSession"
          @click="emit('confirm-add')"
        >
          <span v-if="props.isSavingSession">Enregistrement...</span>
          <span v-else>Ajouter une seance a la semaine</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Utilise les styles dialog-* globaux definis dans style.css */
</style>
