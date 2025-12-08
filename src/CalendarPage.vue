<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { CalendarCell } from './types'

const props = defineProps<{
  monthLabel: string
  cells: CalendarCell[]
  monthAvgStress: number | null
  monthCheckinsCount: number
}>()

const emit = defineEmits<{
  (e: 'prev-month'): void
  (e: 'next-month'): void
  (e: 'select-day', iso: string): void
}>()

const router = useRouter()
const showSessions = ref(true)

function onCellClick(cell: CalendarCell) {
  if (!cell.date || !cell.iso) {
    return
  }
  emit('select-day', cell.iso)
}
</script>

<template>
  <div class="calendar-page-root">
    <button
      type="button"
      class="icon-button calendar-back-button"
      @click="router.back()"
    >
      <i class="pi pi-chevron-left" aria-hidden="true"></i>
    </button>

    <section class="card calendar-page-card">
      <p class="calendar-page-kicker">Journal</p>
      <h2 class="calendar-page-title">Ton calendrier</h2>
      <p class="calendar-page-subtitle">
        Ton calendrier met en vert les jours ou il y a des entrees a lire.
      </p>

      <div class="calendar-nav">
        <button
          type="button"
          class="calendar-nav-btn"
          @click="emit('prev-month')"
        >
          <i class="pi pi-chevron-left" aria-hidden="true"></i>
        </button>
        <span class="calendar-nav-hint">{{ props.monthLabel }}</span>
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
            'has-session': cell.hasSession || cell.hasCheckin || cell.hasMorning,
            'stress-low': cell.stressLevel && cell.stressLevel <= 2,
            'stress-medium': cell.stressLevel && cell.stressLevel > 2 && cell.stressLevel <= 3.5,
            'stress-high': cell.stressLevel && cell.stressLevel > 3.5,
          }"
          :disabled="cell.date === null"
          @click="onCellClick(cell)"
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
    </section>
  </div>
</template>

<style scoped>
.calendar-page-root {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  padding: 0.75rem 0.25rem 0.5rem;
}

.calendar-back-button {
  margin: 0 0 0.75rem;
}

.calendar-page-card {
  margin-top: 0.75rem;
}

.calendar-page-kicker {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent-soft);
  opacity: 0.9;
}

.calendar-page-title {
  margin: 0 0 0.6rem;
  font-size: 1.05rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.calendar-page-subtitle {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

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
</style>
