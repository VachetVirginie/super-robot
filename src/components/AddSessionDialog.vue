<script setup lang="ts">
type DialogWorkoutKind = 'cardio' | 'strength' | 'mobility' | 'mixed' | 'auto'

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
  { key: 'mixed', label: 'Mix cardio + renfo' },
  { key: 'auto', label: "Auto (laisse l'app choisir)" },
]
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
      <div class="session-form">
        <div class="session-field">
          <p class="session-label">Duree souhaitee</p>
          <div class="session-choices">
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
        </div>
        <div class="session-field">
          <p class="session-label">Type de seance</p>
          <div class="session-choices">
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
        </div>
      </div>
      <div class="dialog-actions">
        <button
          type="button"
          class="primary dialog-primary"
          :disabled="props.isSavingSession"
          @click="emit('confirm-add')"
        >
          <span v-if="props.isSavingSession">Enregistrement...</span>
          <span v-else>Ajouter la seance</span>
        </button>
        <button
          type="button"
          class="secondary dialog-primary"
          :disabled="props.isSavingSession || !props.weeklySessions || props.weeklySessions === 0"
          @click="emit('confirm-remove')"
        >
          Retirer la derniere seance
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Utilise les styles dialog-* globaux definis dans RootApp.vue */
.session-form {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.session-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.session-label {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

.session-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.session-chip {
  border-radius: 999px;
  border: 1px solid #27272a;
  background: #050505;
  padding: 0.25rem 0.7rem;
  font-size: 0.8rem;
}

.session-chip.is-active {
  background: #22c55e;
  border-color: #22c55e;
  color: #022c22;
}
</style>
