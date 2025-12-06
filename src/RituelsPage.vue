<script setup lang="ts">
import { computed, defineProps, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Ritual, RitualFocus, RitualMoment } from './composables/useRituals'

interface RitualsByMoment {
  morning: Ritual | null
  midday: Ritual | null
  evening: Ritual | null
}

const props = defineProps<{
  isAuthenticated: boolean
  ritualsByMoment: RitualsByMoment
  isLoadingRituals: boolean
  isSavingRitual: boolean
  ritualsError: string | null
  upsertRitual: (
    moment: RitualMoment,
    payload: { focus: RitualFocus; title: string; description?: string | null },
  ) => void | Promise<void>
}>()

const router = useRouter()

const moments: { key: RitualMoment; label: string; hint: string }[] = [
  {
    key: 'morning',
    label: 'Rituel du matin',
    hint: 'Commencer ta journee avec un petit geste simple pour toi.',
  },
  {
    key: 'midday',
    label: 'Rituel du milieu de journee',
    hint: 'Faire une courte pause au milieu de la journee pour souffler.',
  },
  {
    key: 'evening',
    label: 'Rituel du soir',
    hint: 'Aider ton corps et ta tete a redescendre avant la nuit.',
  },
]

const activeMoment = ref<RitualMoment | null>(null)
const editTitle = ref('')
const editFocus = ref<RitualFocus>('move')
const editDescription = ref('')

const isSubmitting = computed(() => props.isSavingRitual)

function getRitual(moment: RitualMoment) {
  return props.ritualsByMoment[moment]
}

function formatFocus(value: RitualFocus) {
  if (value === 'move') return 'Bouger'
  if (value === 'stress') return 'Anti-stress'
  return 'Bouger + anti-stress'
}

function openEditor(moment: RitualMoment) {
  if (!props.isAuthenticated) {
    return
  }
  activeMoment.value = moment
  const ritual = getRitual(moment)
  editTitle.value = ritual?.title ?? ''
  editDescription.value = ritual?.description ?? ''
  editFocus.value = ritual?.focus ?? 'move'
}

function cancelEdit() {
  activeMoment.value = null
  editTitle.value = ''
  editDescription.value = ''
}

const canSave = computed(() => {
  if (!props.isAuthenticated || isSubmitting.value) {
    return false
  }
  return editTitle.value.trim().length > 0
})

async function saveCurrentRitual() {
  if (!activeMoment.value || !canSave.value) {
    return
  }

  const title = editTitle.value.trim()
  const description = editDescription.value.trim()

  await props.upsertRitual(activeMoment.value, {
    focus: editFocus.value,
    title,
    description: description || null,
  })

  activeMoment.value = null
}
</script>

<template>
  <div class="rituals-root">
    <button
      type="button"
      class="icon-button rituals-back-button"
      @click="router.push({ name: 'bilan' })"
    >
      <i class="pi pi-chevron-left" aria-hidden="true"></i>
    </button>

    <section class="card rituals-page">
      <h2 class="rituals-title">Mes rituels</h2>
      <p class="rituals-text">
        Ton coach t'aide a choisir 2 ou 3 petits rituels pour rythmer ta journee et proteger ton
        energie.
      </p>

      <p v-if="!isAuthenticated" class="rituals-text rituals-text--muted">
        Connecte-toi pour definir et enregistrer tes rituels.
      </p>

      <template v-else>
        <p v-if="isLoadingRituals" class="rituals-text">
          Chargement de tes rituels...
        </p>
        <p v-else-if="ritualsError" class="rituals-text rituals-text--error">
          {{ ritualsError }}
        </p>
        <p v-else class="rituals-text rituals-text--muted">
          Tu peux commencer par un seul rituel, puis en ajouter un deuxieme quand tu te sens
          pret(e).
        </p>
      </template>
    </section>

    <section
      v-if="isAuthenticated"
      class="rituals-cards"
    >
      <section
        v-for="moment in moments"
        :key="moment.key"
        class="card rituals-card"
      >
        <h3 class="rituals-card-title">{{ moment.label }}</h3>
        <p class="rituals-card-hint">
          {{ moment.hint }}
        </p>

        <div v-if="getRitual(moment.key)" class="rituals-current">
          <p class="rituals-current-title">
            {{ getRitual(moment.key)?.title }}
          </p>
          <p class="rituals-current-meta">
            Focus : {{ formatFocus(getRitual(moment.key)!.focus) }}
          </p>
        </div>
        <p v-else class="rituals-current-empty">
          Pas encore de rituel pour ce moment. On peut en choisir un tres simple.
        </p>

        <button
          type="button"
          class="rituals-edit-button"
          @click="openEditor(moment.key)"
        >
          Choisir / modifier mon rituel
        </button>

        <div
          v-if="activeMoment === moment.key"
          class="rituals-editor"
        >
          <label class="rituals-label">
            Intitule du rituel
            <input
              v-model="editTitle"
              type="text"
              class="rituals-input"
              placeholder="Exemples : 3 respirations avant les mails, petite marche apres le dejeuner..."
            />
          </label>

          <label class="rituals-label">
            Type de rituel
            <select
              v-model="editFocus"
              class="rituals-select"
            >
              <option value="move">Bouger</option>
              <option value="stress">Anti-stress</option>
              <option value="both">Bouger + anti-stress</option>
            </select>
          </label>

          <label class="rituals-label">
            Details (facultatif)
            <textarea
              v-model="editDescription"
              rows="3"
              class="rituals-textarea"
            ></textarea>
          </label>

          <div class="rituals-editor-actions">
            <button
              type="button"
              class="rituals-secondary-button"
              @click="cancelEdit"
            >
              Annuler
            </button>
            <button
              type="button"
              class="primary rituals-primary-button"
              :disabled="!canSave"
              @click="saveCurrentRitual"
            >
              <span v-if="isSubmitting">Enregistrement...</span>
              <span v-else>Enregistrer ce rituel</span>
            </button>
          </div>
        </div>
      </section>
    </section>
  </div>
</template>

<style scoped>
.rituals-root {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  padding: 0.75rem 0.25rem 0.5rem;
}

.rituals-back-button {
  margin: 0 0 0.75rem;
}

.rituals-page {
  padding: 0.9rem 0.9rem 0.85rem;
}

.rituals-title {
  margin: 0 0 0.9rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.rituals-text {
  margin: 0 0 0.6rem;
  font-size: 0.9rem;
}

.rituals-text--muted {
  opacity: 0.8;
  font-size: 0.85rem;
}

.rituals-text--error {
  color: #fecaca;
}

.rituals-cards {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rituals-card {
  padding: 0.9rem 0.9rem 0.85rem;
}

.rituals-card-title {
  margin: 0 0 0.35rem;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.rituals-card-hint {
  margin: 0 0 0.6rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.rituals-current {
  margin-bottom: 0.4rem;
}

.rituals-current-title {
  margin: 0;
  font-size: 0.95rem;
}

.rituals-current-meta {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  opacity: 0.8;
}

.rituals-current-empty {
  margin: 0 0 0.4rem;
  font-size: 0.85rem;
  opacity: 0.8;
}

.rituals-edit-button {
  width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: transparent;
  color: #e5e7eb;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}

.rituals-editor {
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid #27272a;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rituals-label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.8rem;
}

.rituals-input,
.rituals-select,
.rituals-textarea {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #020617;
  color: #e5e7eb;
  padding: 0.45rem 0.7rem;
  font-size: 0.85rem;
}

.rituals-select {
  border-radius: 999px;
}

.rituals-textarea {
  resize: vertical;
}

.rituals-editor-actions {
  margin-top: 0.1rem;
  display: flex;
  gap: 0.5rem;
}

.rituals-secondary-button,
.rituals-primary-button {
  flex: 1;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}

.rituals-secondary-button {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: transparent;
  color: #e5e7eb;
}

.rituals-primary-button:disabled {
  opacity: 0.7;
}

.card {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}
</style>
