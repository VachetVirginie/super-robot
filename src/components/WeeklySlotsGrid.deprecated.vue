<script setup lang="ts">
import type { TimeOfDay, WeeklySlot } from '../composables/useWeeklySlots.deprecated'

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const timeSlots: { key: TimeOfDay; label: string }[] = [
  { key: 'morning', label: 'Matin' },
  { key: 'afternoon', label: 'Après-midi' },
  { key: 'evening', label: 'Soir' },
]

const props = defineProps<{
  modelValue: WeeklySlot[]
  disableAfterDayIndex?: number | null
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: WeeklySlot[]): void
}>()

function isSlotSelected(dayIndex: number, slotKey: TimeOfDay) {
  return props.modelValue.some(
    (slot) => slot.dayIndex === dayIndex && slot.timeOfDay === slotKey,
  )
}

function isSlotDisabled(dayIndex: number) {
  if (props.readonly) return true
  if (props.disableAfterDayIndex == null) return false
  return dayIndex > props.disableAfterDayIndex
}

function toggleSlot(dayIndex: number, slotKey: TimeOfDay) {
  if (isSlotDisabled(dayIndex)) return

  const next: WeeklySlot[] = [...props.modelValue]
  const idx = next.findIndex(
    (slot) => slot.dayIndex === dayIndex && slot.timeOfDay === slotKey,
  )

  if (idx >= 0) {
    next.splice(idx, 1)
  } else {
    next.push({ dayIndex, timeOfDay: slotKey })
  }

  emit('update:modelValue', next)
}
</script>

<template>
  <div class="planweek-grid">
    <div class="planweek-grid-header"></div>
    <div
      v-for="slot in timeSlots"
      :key="slot.key"
      class="planweek-grid-header planweek-grid-header--time"
    >
      {{ slot.label }}
    </div>

    <template v-for="(day, dayIndex) in days" :key="day">
      <div class="planweek-day-label">
        {{ day }}
      </div>
      <button
        v-for="slot in timeSlots"
        :key="slot.key"
        type="button"
        class="planweek-slot"
        :class="{
          'is-selected': isSlotSelected(dayIndex, slot.key),
          'is-disabled': isSlotDisabled(dayIndex) && !isSlotSelected(dayIndex, slot.key),
        }"
        @click="toggleSlot(dayIndex, slot.key)
        "
      >
        <span class="planweek-slot-dot"></span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.planweek-grid {
  margin-top: 0.25rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.35rem;
}

.planweek-grid-header {
  font-size: 0.7rem;
  opacity: 0.7;
}

.planweek-grid-header--time {
  text-align: center;
}

.planweek-day-label {
  font-size: 0.8rem;
  opacity: 0.85;
  display: flex;
  align-items: center;
}

.planweek-slot {
  position: relative;
  width: 100%;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid rgba(55, 65, 81, 0.9);
  background: #020617;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.planweek-slot-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.5);
}

.planweek-slot.is-selected {
  border-color: #22c55e;
  background: radial-gradient(circle at top left, rgba(34, 197, 94, 0.35), #020617);
}

.planweek-slot.is-selected .planweek-slot-dot {
  background: #22c55e;
}

.planweek-slot.is-disabled:not(.is-selected) {
  opacity: 0.4;
}
</style>
