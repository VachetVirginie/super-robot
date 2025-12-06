<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TodaySlot, DailyIntention } from '../composables/useDailyPlan'

const props = defineProps<{
  displayName: string
  perWeekGoal: number | null
  weeklySessions: number | null
  initialSlot: TodaySlot | null
  initialIntention: DailyIntention | null
  isLoading: boolean
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: { slot: TodaySlot; intention: DailyIntention }): void
}>()

const slotOptions: { value: TodaySlot; label: string }[] = [
  { value: 'morning', label: 'Matin' },
  { value: 'noon', label: 'Midi' },
  { value: 'afternoon', label: 'Apres-midi' },
  { value: 'evening', label: 'Soir' },
  { value: 'unknown', label: 'Je ne sais pas encore' },
]

const intentionOptions: { value: DailyIntention; label: string }[] = [
  { value: 'calme', label: 'Plus calme' },
  { value: 'detente', label: 'Moins tendue' },
  { value: 'mobilite', label: 'Un peu plus mobile' },
  { value: 'presence', label: 'Plus presente a toi-meme' },
  { value: 'none', label: "Sans intention aujourd'hui" },
]

const selectedSlot = ref<TodaySlot>(props.initialSlot ?? 'unknown')
const selectedIntention = ref<DailyIntention>(props.initialIntention ?? 'none')

const friendlyName = computed(() => {
  const raw = props.displayName?.trim()
  if (!raw) return ''
  const first = raw.split(' ')[0] ?? ''
  return first
})

const previousSlotLabel = computed(() => {
  const value = props.initialSlot
  if (!value || value === 'unknown') {
    return ''
  }
  const mapping: Record<TodaySlot, string> = {
    morning: 'Matin',
    noon: 'Midi',
    afternoon: 'Apres-midi',
    evening: 'Soir',
    unknown: 'Je ne sais pas encore',
  }
  return mapping[value] ?? ''
})

const contractMainLine = computed(() => {
  const goal = props.perWeekGoal
  if (goal == null) {
    return "Tu peux choisir ton objectif dans 'Ma semaine'. Pas d'urgence."
  }
  if (goal === 1) {
    return 'Cette semaine, tu veux prendre 1 moment rien que pour toi.'
  }
  return `Cette semaine, tu veux prendre ${goal} moments rien que pour toi.`
})

const contractProgressLine = computed(() => {
  const goal = props.perWeekGoal
  const done = props.weeklySessions
  if (goal == null || done == null) {
    return ''
  }
  return `Tu es deja a ${done} sur ${goal}. On continue a ton rythme.`
})

function onConfirm() {
  const slotToSave = selectedSlot.value ?? 'unknown'
  const intentionToSave = selectedIntention.value ?? 'none'
  emit('confirm', { slot: slotToSave, intention: intentionToSave })
}
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <div class="dialog-card morning-card">
      <div class="dialog-header">
        <h3 class="dialog-title">
          Bonjour<span v-if="friendlyName">, {{ friendlyName }}</span>
        </h3>
        <button
          type="button"
          class="dialog-close"
          @click="emit('close')"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>

      <div class="morning-body">
        <section>
          <p class="morning-text">
            On prepare un mini plan realiste pour t'aider a passer une bonne journee.
          </p>
        </section>

        <section>
          <p v-if="previousSlotLabel" class="morning-previous-slot">
            Tu avais choisi : {{ previousSlotLabel }}. Tu veux changer ?
          </p>
          <h4 class="morning-section-title">Choisir ton moment pour bouger</h4>
          <p class="morning-text">Tu preferes bouger quand aujourd'hui ?</p>

          <div class="morning-options-row">
            <button
              v-for="option in slotOptions"
              :key="option.value"
              type="button"
              class="morning-option"
              :class="{ 'is-selected': selectedSlot === option.value }"
              @click="selectedSlot = option.value"
            >
              {{ option.label }}
            </button>
          </div>

          <p class="morning-microcopy">
            Ce n'est pas un engagement strict : juste une direction.
          </p>
        </section>

        <section>
          <h4 class="morning-section-title">Ton intention du jour</h4>
          <p class="morning-text">
            Et aujourd'hui, tu voudrais plutot te sentir...
          </p>

          <div class="morning-options-row">
            <button
              v-for="option in intentionOptions"
              :key="option.value"
              type="button"
              class="morning-intention-option"
              :class="{ 'is-selected': selectedIntention === option.value }"
              @click="selectedIntention = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </section>

        <section>
          <p class="morning-contract">
            {{ contractMainLine }}
          </p>
          <p v-if="contractProgressLine" class="morning-contract">
            {{ contractProgressLine }}
          </p>
        </section>

        <button
          type="button"
          class="primary morning-cta"
          :disabled="isSaving || isLoading"
          @click="onConfirm"
        >
          <span v-if="isSaving">Enregistrement...</span>
          <span v-else>Enregistrer</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.morning-card {
  max-width: 420px;
}

.morning-body {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.morning-text {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.morning-section-title {
  margin: 0;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}

.morning-options-row {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.morning-option,
.morning-intention-option {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #020617;
  color: #e5e7eb;
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
}

.morning-option.is-selected,
.morning-intention-option.is-selected {
  border-color: #22c55e;
  background: #22c55e;
  color: #022c22;
}

.morning-microcopy {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

.morning-contract {
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.morning-previous-slot {
  margin: 0 0 0.4rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.morning-cta {
  margin-top: 1.25rem;
  width: 100%;
}
</style>
