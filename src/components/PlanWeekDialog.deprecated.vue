<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WeeklySlot as Slot } from '../composables/useWeeklySlots.deprecated'
import WeeklySlotsGrid from './WeeklySlotsGrid.vue'

const props = defineProps<{
  initialSlots?: Slot[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', value: Slot[]): void
}>()

const selectedSlots = ref<Slot[]>([...(props.initialSlots ?? [])])

const selectedCount = computed(() => selectedSlots.value.length)

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
        Choisis des moments concrets pour toi dans ta semaine : bouger un peu, souffler,
        faire une pause zen... Commence petit, tu pourras toujours ajuster ensuite.
      </p>
      <p class="planweek-counter">
        {{ selectedCount }} moment(s) planifiés
      </p>

      <WeeklySlotsGrid v-model="selectedSlots" />

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

.planweek-hint {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  opacity: 0.8;
}
</style>
