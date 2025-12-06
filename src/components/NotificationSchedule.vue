<script setup lang="ts">
import { computed } from 'vue'

type NotificationSlot = {
  id: string
  label: string
  description: string
  time: string
  enabled: boolean
}

const props = defineProps<{
  modelValue: NotificationSlot[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: NotificationSlot[]): void
}>()

const rows = computed(() => props.modelValue)

function toggleSlot(id: string) {
  const next = props.modelValue.map((slot) =>
    slot.id === id ? { ...slot, enabled: !slot.enabled } : slot,
  )
  emit('update:modelValue', next)
}

function onTimeInput(id: string, event: Event) {
  const target = event.target as HTMLInputElement | null
  const value = target?.value ?? ''
  const next = props.modelValue.map((slot) =>
    slot.id === id ? { ...slot, time: value } : slot,
  )
  emit('update:modelValue', next)
}
</script>

<template>
  <section class="notif-schedule">
    <h4 class="notif-schedule-title">Moments de rappel</h4>
    <p class="notif-schedule-subtitle">
      Choisis quand tu veux recevoir tes notifications dans la journee.
    </p>

    <div
      v-for="slot in rows"
      :key="slot.id"
      class="notif-schedule-row"
    >
      <div class="notif-schedule-icon">
        <i class="pi pi-bell" aria-hidden="true"></i>
      </div>
      <div class="notif-schedule-main">
        <div class="notif-schedule-label-row">
          <span class="notif-schedule-label">{{ slot.label }}</span>
          <input
            :value="slot.time"
            type="time"
            class="notif-schedule-time"
            @input="onTimeInput(slot.id, $event)"
          />
        </div>
        <p class="notif-schedule-desc">
          {{ slot.description }}
        </p>
      </div>
      <button
        type="button"
        class="notif-switch"
        :class="{ 'is-on': slot.enabled }"
        @click="toggleSlot(slot.id)"
      >
        <span class="notif-switch-thumb"></span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.notif-schedule {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notif-schedule-title {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
}

.notif-schedule-subtitle {
  margin: 0.15rem 0 0.25rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.notif-schedule-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 0.9rem;
  background: #050505;
  border: 1px solid #27272a;
}

.notif-schedule-icon {
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e5e7eb;
  flex-shrink: 0;
}

.notif-schedule-main {
  flex: 1;
  min-width: 0;
}

.notif-schedule-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.notif-schedule-label {
  font-size: 0.9rem;
  font-weight: 500;
}

.notif-schedule-time {
  border-radius: 999px;
  border: 1px solid #4b5563;
  background: #020617;
  color: #e5e7eb;
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
}

.notif-schedule-desc {
  margin: 0.35rem 0 0;
  font-size: 0.75rem;
  opacity: 0.8;
}

.notif-switch {
  width: 40px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid #4b5563;
  background: #020617;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
}

.notif-switch-thumb {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #e5e7eb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  transform: translateX(2px);
  transition: transform 0.15s ease-out;
}

.notif-switch.is-on {
  background: linear-gradient(90deg, #22c55e, #4ade80);
  border-color: #22c55e;
}

.notif-switch.is-on .notif-switch-thumb {
  transform: translateX(20px);
}
</style>
