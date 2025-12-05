<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  displayName: string
  isSaving: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: {
    level: number
    note?: string
    question?: string
  }): void
}>()

const friendlyName = computed(() => {
  const raw = props.displayName?.trim()
  if (!raw) return ''
  const first = raw.split(' ')[0] ?? ''
  return first
})

const currentStep = ref<1 | 2>(1)
const selectedStress = ref<number | null>(null)
const eveningNote = ref('')

const eveningQuestions = [
  "Qu'est-ce qui t'a aidee a tenir aujourd'hui ?",
  "Qu'est-ce que tu aimerais laisser de cote apres cette journee ?",
  "Quel petit moment de ta journee tu aimerais garder en memoire ?",
  "Qu'est-ce qui etait clairement hors de ton controle aujourd'hui ?",
  "Qu'as-tu fait aujourd'hui qui allait dans le sens de ce qui compte pour toi ?",
  "Quelle petite chose a ete un soutien aujourd'hui ?",
  "Qui t'a fait du bien, meme indirectement ?",
  "Quel geste as-tu fait qui merite d'etre reconnu ?",
  "Quel moment t'a fait sourire, meme brievement ?",
  "Une mini-chose que tu as appreciee aujourd'hui ?",
  "Quel confort as-tu eu la chance d'avoir aujourd'hui ?",
  "Qu'est-ce qui a ete plus simple que prevu ?",
  "De quoi peux-tu te remercier ce soir ?",
]

const currentEveningQuestion = computed(() => {
  if (!eveningQuestions.length) {
    return ''
  }

  const today = new Date()
  const startOfYear = Date.UTC(today.getFullYear(), 0, 1)
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const dayOfYear = Math.floor((todayUtc - startOfYear) / (24 * 60 * 60 * 1000))

  const index = dayOfYear % eveningQuestions.length
  return eveningQuestions[index] ?? eveningQuestions[0]
})

const isLastStep = computed(() => currentStep.value === 2)

const primaryCtaLabel = computed(() => (isLastStep.value ? 'Enregistrer mon check-in' : 'Continuer'))

function goToPreviousStep() {
  if (currentStep.value === 1) {
    emit('close')
    return
  }
  currentStep.value = 1
}

function goToNextStep() {
  if (!selectedStress.value) {
    return
  }
  if (!isLastStep.value) {
    currentStep.value = 2
    return
  }
  onConfirm()
}

function onConfirm() {
  if (!selectedStress.value) {
    return
  }
  emit('confirm', {
    level: selectedStress.value,
    note: eveningNote.value || undefined,
    question: currentEveningQuestion.value,
  })
}
</script>

<template>
  <div class="dialog-backdrop" @click.self="emit('close')">
    <div class="dialog-card evening-card">
      <div class="dialog-header evening-header">
        <h3 class="dialog-title">
          Bonsoir<span v-if="friendlyName">, {{ friendlyName }}</span>
        </h3>
        <button
          type="button"
          class="dialog-close"
          @click="emit('close')"
        >
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>

      <div class="evening-body">
        <section
          v-if="currentStep === 1"
          class="evening-step"
        >
          <p class="evening-text evening-intro">
            On prend 1 minute pour faire le point avant de fermer la journee.
          </p>

          <div class="evening-step-main">
            <h4 class="evening-section-title">Ton niveau de stress ce soir</h4>
            <p class="evening-text">
              De 1 (tres calme) a 5 (au max), ou tu te situes ?
            </p>
            <div class="evening-scale">
              <button
                v-for="level in 5"
                :key="level"
                type="button"
                class="evening-dot"
                :class="{ 'is-active': selectedStress === level }"
                :disabled="isSaving"
                @click="selectedStress = level"
              >
                {{ level }}
              </button>
            </div>
          </div>
        </section>

        <section
          v-else
          class="evening-step"
        >
          <div class="evening-step-main">
            <h4 class="evening-section-title">Un petit mot pour clore la journee</h4>
            <p class="evening-question">
              {{ currentEveningQuestion }}
            </p>
            <textarea
              v-model="eveningNote"
              class="evening-textarea"
              rows="4"
              placeholder="Une ou deux phrases suffisent. C'est juste pour toi."
            ></textarea>
          </div>
        </section>
      </div>

      <div class="evening-footer">
        <button
          type="button"
          class="evening-back"
          :disabled="isSaving"
          @click="goToPreviousStep"
        >
          {{ currentStep === 1 ? 'Fermer' : 'Retour' }}
        </button>
        <button
          type="button"
          class="primary evening-cta"
          :disabled="isSaving || !selectedStress"
          @click="goToNextStep"
        >
          <span v-if="isSaving">Enregistrement...</span>
          <span v-else>{{ primaryCtaLabel }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
  background: #050505;
  z-index: 40;
}

.evening-card {
  max-width: 420px;
  width: 100%;
  height: 100vh;
  margin: 0 auto;
  border-radius: 0;
  border: none;
  box-shadow: none;
  padding: 1.75rem 1.25rem 2.25rem;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.evening-header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 1.75rem;
  margin-bottom: 1.5rem;
}

.evening-header .dialog-title {
  width: 100%;
  text-align: center;
}

.evening-header .dialog-close {
  position: absolute;
  top: 0;
  right: 0;
}

.evening-body {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.evening-body > .evening-step {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.evening-step-main {
  margin-top: auto;
  margin-bottom: auto;
  display: flex;
  flex-direction: column;
}

.evening-text {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.evening-intro {
  margin-bottom: 2rem;
}

.evening-section-title {
  margin: 0;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}

.evening-scale {
  margin-top: 0.75rem;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.evening-dot {
  flex: 1;
  border-radius: 999px;
  border: 1px solid rgba(75, 85, 99, 0.9);
  background: #020617;
  color: #e5e7eb;
  padding: 0.4rem 0;
  font-size: 0.85rem;
}

.evening-dot.is-active {
  border-color: #22c55e;
  background: #22c55e;
  color: #020617;
}

.evening-question {
  margin: 0.75rem 0 0.5rem;
  font-size: 0.9rem;
  opacity: 0.95;
}

.evening-textarea {
  margin-top: 0.5rem;
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: #020617;
  color: #e5e7eb;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  resize: vertical;
  min-height: 96px;
}

.evening-footer {
  margin-top: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.evening-back {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: transparent;
  color: #e5e7eb;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
}

.evening-cta {
  margin-left: auto;
}
</style>
