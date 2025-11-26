<script setup lang="ts">
const props = defineProps<{
  isSavingSession: boolean
  weekDays: {
    iso: string
    label: string
    sessionsCount: number
    isToday: boolean
  }[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'add-for-date', iso: string): void
  (e: 'remove-for-date', iso: string): void
}>()

function onAdd(iso: string) {
  emit('add-for-date', iso)
}

function onRemove(iso: string) {
  emit('remove-for-date', iso)
}
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <div class="dialog-card dialog-card--wide">
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
        Si tu as oublie d'enregistrer une seance, ou que tu en as valide une en avance
        mais finalement pas effectuee, tu peux corriger chaque jour ici.
      </p>

      <div class="weekdays-list">
        <div
          v-for="day in props.weekDays"
          :key="day.iso"
          class="weekday-row"
        >
          <div class="weekday-main">
            <div class="weekday-labels">
              <span class="weekday-title">
                {{ day.label }}
                <span v-if="day.isToday" class="weekday-today-tag">(aujourd'hui)</span>
              </span>
              <span class="weekday-subtitle">
                {{ day.sessionsCount }} seance(s) realisee(s)
              </span>
            </div>
          </div>
          <div class="weekday-actions">
            <button
              type="button"
              class="icon-btn icon-btn--minus"
              :disabled="props.isSavingSession || day.sessionsCount === 0"
              @click="onRemove(day.iso)"
            >
              −
            </button>
            <button
              type="button"
              class="icon-btn icon-btn--plus"
              :disabled="props.isSavingSession"
              @click="onAdd(day.iso)"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Utilise les styles dialog-* globaux definis dans style.css */

.dialog-card--wide {
  max-width: 420px;
}

.weekdays-list {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.weekday-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.75rem;
  background: #020617;
  border: 1px solid #1f2937;
}

.weekday-labels {
  display: flex;
  flex-direction: column;
}

.weekday-title {
  font-size: 0.85rem;
  font-weight: 500;
}

.weekday-today-tag {
  margin-left: 0.3rem;
  font-size: 0.75rem;
  opacity: 0.8;
}

.weekday-subtitle {
  margin-top: 0.15rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.weekday-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.icon-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid #4b5563;
  background: #020617;
  color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.icon-btn--plus {
  border-color: #22c55e;
}

.icon-btn--minus {
  border-color: #f97316;
}

.icon-btn:disabled {
  opacity: 0.45;
}
</style>
