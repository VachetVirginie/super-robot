<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TimeOfDay, WeeklySlot as Slot } from '../composables/useWeeklySlots'

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const timeSlots: { key: TimeOfDay; label: string }[] = [
  { key: 'morning', label: 'Matin' },
  { key: 'afternoon', label: 'Après-midi' },
  { key: 'evening', label: 'Soir' },
]

const props = defineProps<{
  initialSlots?: Slot[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', value: Slot[]): void
}>()

const selectedSlots = ref<Slot[]>([...(props.initialSlots ?? [])])

const selectedCount = computed(() => selectedSlots.value.length)

function isSelected(dayIndex: number, slotKey: TimeOfDay) {
  return selectedSlots.value.some(
    (slot) => slot.dayIndex === dayIndex && slot.timeOfDay === slotKey,
  )
}

function toggleSlot(dayIndex: number, slotKey: TimeOfDay) {
  const idx = selectedSlots.value.findIndex(
    (slot) => slot.dayIndex === dayIndex && slot.timeOfDay === slotKey,
  )

  if (idx >= 0) {
    selectedSlots.value.splice(idx, 1)
    return
  }
  selectedSlots.value.push({ dayIndex, timeOfDay: slotKey })
}

function close() {
  emit('close')
}

function save() {
  emit('save', selectedSlots.value)
  emit('close')
}
</script>

<template>
  <div class="dialog-backdrop" @click.self="close">
    <div class="dialog-card planweek-card">
      <div class="dialog-header">
        <h3 class="dialog-title">Planifier ta semaine</h3>
        <button type="button" class="dialog-close" @click="close">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>

      <p class="dialog-text">
        Choisis des moments concrets dans ta semaine pour bouger. Commence petit,
        tu pourras toujours ajuster ensuite.
      </p>
      <p class="planweek-counter">
        {{ selectedCount }} moment(s) planifiés
      </p>

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
            :class="{ 'is-selected': isSelected(dayIndex, slot.key) }"
            @click="toggleSlot(dayIndex, slot.key)
            "
          >
            <span class="planweek-slot-dot"></span>
          </button>
        </template>
      </div>

      <p class="planweek-hint">
        Commence par quelques moments que tu es presque sûr·e de pouvoir tenir.
      </p>

      <div class="dialog-actions">
        <button type="button" class="primary dialog-primary" @click="save">
          Valider ce planning
        </button>
        <button type="button" class="secondary dialog-primary" @click="close">
          Annuler
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.planweek-card {
  max-width: 420px;
}

.planweek-counter {
  margin: 0.75rem 0 0.5rem;
  font-size: 0.8rem;
  opacity: 0.85;
}

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

.planweek-hint {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  opacity: 0.8;
}
</style>
