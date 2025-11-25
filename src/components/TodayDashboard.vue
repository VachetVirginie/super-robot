<script setup lang="ts">
interface TodaySection {
  key: string
  title: string
  subtitle: string
  progress: number
}

defineProps<{
  sections: TodaySection[]
  perWeekGoal: number | null
}>()

const emit = defineEmits<{
  (e: 'row-click', key: string): void
}>()

function onRowClick(key: string) {
  emit('row-click', key)
}
</script>

<template>
  <section class="today-card">
    <h2>Aujourd'hui</h2>
    <p class="subtitle">Ton tableau de bord pour la semaine.</p>
    <div class="today-list">
      <button
        v-for="section in sections"
        :key="section.key"
        type="button"
        class="today-row"
        @click="onRowClick(section.key)"
      >
        <div class="today-row-main">
          <span class="today-row-title">{{ section.title }}</span>
          <span class="today-row-sub">{{ section.subtitle }}</span>
        </div>
        <div class="today-row-progress" :style="{ '--p': section.progress + '%' }">
          <div class="today-row-circle">
            <div class="today-row-circle-inner">
              <span class="today-row-percent">
                <template v-if="section.key === 'weekly-goal'">
                  {{ perWeekGoal ?? '—' }}
                </template>
                <template v-else>
                  {{ section.progress }}%
                </template>
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  </section>
</template>

<style scoped>
.today-card {
  max-width: 100%;
  width: 100%;
  padding: 1.5rem 1.5rem 1.25rem;
  border-radius: 1rem;
  margin: 0 auto;
  background: #111111;
  border: 1px solid #27272a;
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.today-card > h2 {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.subtitle {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.9;
}
.today-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.today-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.7rem 0.85rem;
  border-radius: 0.85rem;
  border: 1px solid #27272a;
  background: #0b0b0b;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.08s ease;
}
.today-row:hover {
  background: #111827;
  border-color: #3f3f46;
}
.today-row:active {
  transform: translateY(1px);
}
.today-row-main {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  text-align: left;
}
.today-row-title {
  font-size: 0.9rem;
  font-weight: 500;
}
.today-row-sub {
  font-size: 0.8rem;
  opacity: 0.8;
}
.today-row-progress {
  display: flex;
  align-items: center;
  justify-content: center;
}
.today-row-circle {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background:
    conic-gradient(#f9fafb var(--p), rgba(55, 65, 81, 0.6) 0);
  display: flex;
  align-items: center;
  justify-content: center;
}
.today-row-circle-inner {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #111111;
  display: flex;
  align-items: center;
  justify-content: center;
}
.today-row-percent {
  font-size: 0.7rem;
}
</style>
