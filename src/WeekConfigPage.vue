<script setup lang="ts">
import { computed } from 'vue'
import type { WeeklySlot } from './composables/useWeeklySlots'

const props = defineProps<{
  isAuthenticated: boolean
  perWeekGoal: number | null
  weeklySlots: WeeklySlot[]
  isWeeklySlotsLoading: boolean
  weeklySlotsError: string | null
  onOpenWeekPlan: () => void
}>()

const planSummary = computed(() => {
  if (props.isWeeklySlotsLoading) {
    return 'On charge ton planning...'
  }
  if (props.weeklySlotsError) {
    return props.weeklySlotsError
  }
  const count = props.weeklySlots.length
  if (count === 0) {
    return "Tu n'as encore rien prevu. On peut commencer par 1 ou 2 moments tres simples."
  }
  if (count === 1) {
    return 'Tu as prevu 1 moment pour toi cette semaine.'
  }

  return `Tu as prevu ${count} moments pour toi cette semaine.`
})

const contractSummary = computed(() => {
  const goal = props.perWeekGoal
  if (goal == null) {
    return "Tu n'as pas encore d'objectif par semaine. On peut en definir un tres simple (1 ou 2 seances)."
  }
  return `Ton objectif actuel : ${goal} seance(s) par semaine.`
})
</script>

<template>
  <section v-if="!isAuthenticated" class="card config-card">
    <h2 class="config-title">Configurer ma semaine</h2>
    <p class="config-text">
      Connecte-toi pour enregistrer tes moments pour toi et ton objectif hebdomadaire.
    </p>
  </section>

  <section v-else class="card config-card">
    <h2 class="config-title">Ma semaine</h2>
    <p class="config-text">
      Ici tu peux choisir quelques moments pour toi dans la semaine et ajuster ton objectif.
    </p>
    <p class="config-summary">
      {{ planSummary }}
    </p>
    <p class="config-summary">
      {{ contractSummary }}
    </p>

    <p v-if="isWeeklySlotsLoading" class="config-hint">
      On charge ton planning...
    </p>
    <p v-else-if="weeklySlotsError" class="config-error">
      {{ weeklySlotsError }}
    </p>
    <p v-else class="config-hint">
      Commence par 1 ou 2 moments que tu es presque sur(e) de pouvoir garder.
    </p>

    <button type="button" class="primary config-button" @click="onOpenWeekPlan">
      Configurer mes moments
    </button>
  </section>
</template>

<style scoped>
.config-card {
  margin-top: 0.75rem;
}

.config-title {
  margin: 0 0 0.9rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.config-text {
  margin: 0 0 0.6rem;
  font-size: 0.9rem;
}

.config-summary {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.config-hint {
  margin: 0.75rem 0 0.5rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.config-error {
  margin: 0.75rem 0 0.5rem;
  font-size: 0.8rem;
  color: #fecaca;
}

.config-button {
  margin-top: 0.75rem;
}
</style>
