<script setup lang="ts">
import type { CalendarCell } from '../types'

const props = defineProps<{
  monthLabel: string
  cells: CalendarCell[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'prev-month'): void
  (e: 'next-month'): void
  (e: 'touch-start', event: TouchEvent): void
  (e: 'touch-end', event: TouchEvent): void
}>()
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
            'has-session': cell.hasSession,
          }"
          :disabled="cell.date === null"
        >
          <span v-if="cell.date !== null" class="calendar-date">
            {{ cell.date }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Utilise les styles dialog-*, calendar-* globaux definis dans RootApp.vue */
</style>
