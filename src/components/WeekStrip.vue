<script setup lang="ts">
interface WeekDay {
  key: string
  date: number
  label: string
  isToday: boolean
  hasSession: boolean
  plannedCount: number
  doneCount: number
}

const props = defineProps<{
  greeting: string
  rangeLabel: string
  days: WeekDay[]
  thermoState: 'green' | 'orange' | 'red'
}>()

const emit = defineEmits<{
  (e: 'open-month-calendar'): void
  (e: 'open-thermo'): void
}>()

function onOpenMonthCalendar() {
  emit('open-month-calendar')
}

function onOpenThermo() {
  emit('open-thermo')
}

function progressOpacity(day: WeekDay) {
  // 0 seance realisee ou aucun moment prevu => pas de check
  if (day.plannedCount <= 0 || day.doneCount <= 0) {
    return 0
  }

  const ratio = Math.max(0, Math.min(1, day.doneCount / day.plannedCount))
  // Opacite entre 0.3 (tres leger) et 1 (objectif du jour complet)
  return 0.3 + 0.7 * ratio
}
</script>

<template>
  <section class="week-strip">
    <div class="week-strip-header">
      <h2 class="week-strip-greeting">
        {{ props.greeting }}
      </h2>
      <div class="week-strip-icons">
        <button type="button" class="icon-button">
          <i class="pi pi-bell" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="icon-button"
          @click="onOpenMonthCalendar"
        >
          <i class="pi pi-calendar" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="thermo-button"
          @click="onOpenThermo"
          aria-label="Thermometre de charge mentale"
        >
          <span
            v-if="props.thermoState !== 'green'"
            class="thermo-dot"
            :class="{
              'thermo-dot--orange': props.thermoState === 'orange',
              'thermo-dot--red': props.thermoState === 'red',
            }"
          ></span>
          <i
            v-else
            class="pi pi-heart thermo-heart"
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </div>
    <p class="week-strip-range">
      {{ props.rangeLabel }}
    </p>
    <div class="week-strip-days">
      <button
        v-for="day in props.days"
        :key="day.key"
        type="button"
        class="week-day"
        :class="{ 'is-today': day.isToday }"
      >
        <span class="week-day-label">
          {{ day.label }}
        </span>
        <span class="week-day-date">
          {{ day.date }}
        </span>
        <span
          v-if="day.doneCount > 0"
          class="week-day-check"
          :style="{ opacity: progressOpacity(day) }"
        >
          ✓
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.week-strip {
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.2rem 1.1rem;
  border-radius: 1.75rem;
  background: radial-gradient(circle at top left, #16a34a1a, transparent 55%), #050816;
  border: none;
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.9);
}
.week-strip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.week-strip-greeting {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.week-strip-icons {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(229, 231, 235, 0.8);
}
.icon-button {
  border-radius: 999px;
  border: none;
  background: transparent;
  padding: 0.1rem 0.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}
.thermo-button {
  border-radius: 999px;
  border: none;
  padding: 0.1rem;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.thermo-dot {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
}
.thermo-dot--green {
  background: #22c55e;
  animation: thermo-breathe 2.5s ease-in-out infinite;
}
.thermo-dot--orange {
  background: #f97316;
  animation: thermo-tilt 2s ease-in-out infinite;
}
.thermo-dot--red {
  background: #ef4444;
  animation: thermo-halo 3s ease-in-out infinite;
}
.week-strip-range {
  margin: 0;
  font-size: 0.78rem;
  opacity: 0.75;
}
.week-strip-days {
  margin-top: 0.85rem;
  padding: 0.55rem 0.7rem;
  border-radius: 35px;
  background: #111827;
  display: flex;
  justify-content: space-between;
  gap: 0.4rem;
}
.week-day {
  flex: 1;
  min-width: 0;
  border-radius: 999px;
  border: none;
  background: #1f2937;
  padding: 0.25rem 0.25rem 0.3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #e5e7eb;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
}
.week-day-date {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid #4b5563;
  background: #020617;
  font-size: 0.8rem;
  font-weight: 600;
}
.week-day-label {
  font-size: 0.65rem;
  margin-bottom: 0.1rem;
  color: #d1d5db;
}
.week-day.is-today {
  background: #05e575f4;
  color: #022c22;
}
.week-day.is-today .week-day-date {
  background: #f9fafb;
  border-color: #f9fafb;
  color: #27272a;
}
.week-day.is-today .week-day-label {
  color: #022c22;
}
.week-day-check {
  margin-top: 0.15rem;
  font-size: 0.65rem;
  color: #22c55e;
}

.thermo-heart {
  font-size: 1.1rem;
  color: #22c55e;
  animation: thermo-breathe 2.5s ease-in-out infinite;
}

@keyframes thermo-breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.03);
    opacity: 0.92;
  }
}

@keyframes thermo-tilt {
  0%,
  100% {
    transform: rotate(-1deg);
  }
  50% {
    transform: rotate(1deg);
  }
}

@keyframes thermo-halo {
  0% {
    box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.16);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(248, 113, 113, 0.32);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.16);
  }
}
</style>
