<script setup lang="ts">
import { ref } from 'vue'
import type { CalendarCell } from '../types'

const props = defineProps<{
  monthLabel: string
  cells: CalendarCell[]
  monthAvgStress: number | null
  monthCheckinsCount: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'prev-month'): void
  (e: 'next-month'): void
  (e: 'touch-start', event: TouchEvent): void
  (e: 'touch-end', event: TouchEvent): void
}>()

const showSessions = ref(true)
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <div
      class="dialog-card calendar-card"
      @touchstart.passive="emit('touch-start', $event)"
      @touchend.passive="emit('touch-end', $event)"
    >
      <div class="dialog-header">
        <h3 class="dialog-title">{{ props.monthLabel }}</h3>
        <button
          type="button"
          class="dialog-close"
          @click="emit('close')"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>
      <div class="calendar-nav">
        <button
          type="button"
          class="calendar-nav-btn"
          @click="emit('prev-month')"
        >
          <i class="pi pi-chevron-left" aria-hidden="true"></i>
        </button>
        <span class="calendar-nav-hint">Glisse pour changer de mois</span>
        <button
          type="button"
          class="calendar-nav-btn"
          @click="emit('next-month')"
        >
          <i class="pi pi-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
      <div class="calendar-mode-toggle">
        <button
          type="button"
          class="calendar-mode-btn"
          :class="{ 'is-active': showSessions }"
          @click="showSessions = true"
        >
          Seances + stress
        </button>
        <button
          type="button"
          class="calendar-mode-btn"
          :class="{ 'is-active': !showSessions }"
          @click="showSessions = false"
        >
          Seulement stress
        </button>
      </div>
      <div class="calendar-grid">
        <div
          class="calendar-weekday"
          v-for="w in ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']"
          :key="w"
        >
          {{ w }}
        </div>
        <button
          v-for="cell in props.cells"
          :key="cell.key"
          type="button"
          class="calendar-cell"
          :class="{
            'is-blank': cell.date === null,
            'is-today': cell.isToday,
            'has-session': showSessions && cell.hasSession,
            'stress-low': cell.stressLevel && cell.stressLevel <= 2,
            'stress-medium': cell.stressLevel && cell.stressLevel > 2 && cell.stressLevel <= 3.5,
            'stress-high': cell.stressLevel && cell.stressLevel > 3.5,
          }"
          :disabled="cell.date === null"
        >
          <span v-if="cell.date !== null" class="calendar-date">
            {{ cell.date }}
          </span>
        </button>
      </div>
      <div class="calendar-summary">
        <p v-if="monthCheckinsCount > 0" class="calendar-summary-text">
          Stress moyen du mois :
          <strong>{{ monthAvgStress ?? '—' }}/5</strong>
          ·
          {{ monthCheckinsCount }} check-in(s)
        </p>
        <p v-else class="calendar-summary-text calendar-summary-text--muted">
          Pas encore de check-ins ce mois-ci.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Utilise les styles dialog-*, calendar-* globaux definis dans RootApp.vue */
.calendar-mode-toggle {
  margin-top: 0.5rem;
  display: flex;
  gap: 0.4rem;
}

.calendar-mode-btn {
  flex: 1;
  border-radius: 999px;
  border: 1px solid #27272a;
  background: transparent;
  color: #e5e7eb;
  font-size: 0.78rem;
  padding: 0.25rem 0.4rem;
}

.calendar-mode-btn.is-active {
  background: #0f172a;
}

.calendar-summary {
  margin-top: 0.75rem;
}

.calendar-summary-text {
  margin: 0;
  font-size: 0.8rem;
}

.calendar-summary-text--muted {
  opacity: 0.75;
}
</style>
