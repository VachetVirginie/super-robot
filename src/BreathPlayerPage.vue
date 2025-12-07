<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const gongRef = ref<HTMLAudioElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)
const bubbleRef = ref<HTMLElement | null>(null)

const isRunning = ref(false)
const currentPhaseIndex = ref(0)
const phaseTimeoutId = ref<number | null>(null)

const maxOffset = ref(0)
const bubbleOffset = ref(0)
const bubbleDuration = ref(0)

type PhaseKey = 'inhale' | 'exhale' | 'hold-top' | 'hold-bottom'

interface BreathPhase {
  key: PhaseKey
  durationSeconds: number
}

interface BreathPattern {
  id: string
  title: string
  subtitle: string
  description: string
  phases: BreathPhase[]
}

const PATTERNS: Record<string, BreathPattern> = {
  'coherence-5-5': {
    id: 'coherence-5-5',
    title: 'Equilibrer',
    subtitle: 'Cohérence cardiaque',
    description: 'Inspire 5 secondes, expire 5 secondes, sans forcer.',
    phases: [
      { key: 'inhale', durationSeconds: 5 },
      { key: 'exhale', durationSeconds: 5 },
    ],
  },
  'box-4-4-4-4': {
    id: 'box-4-4-4-4',
    title: 'Cadrer',
    subtitle: 'Respiration carrée',
    description: 'Inspire 4s, retiens 4s, expire 4s, retiens 4s.',
    phases: [
      { key: 'inhale', durationSeconds: 4 },
      { key: 'hold-top', durationSeconds: 4 },
      { key: 'exhale', durationSeconds: 4 },
      { key: 'hold-bottom', durationSeconds: 4 },
    ],
  },
  'slow-6-6': {
    id: 'slow-6-6',
    title: 'Ralentir',
    subtitle: 'Respiration lente',
    description: 'Inspire 6 secondes, expire 6 secondes pour allonger le souffle.',
    phases: [
      { key: 'inhale', durationSeconds: 6 },
      { key: 'exhale', durationSeconds: 6 },
    ],
  },
  'reset-3min': {
    id: 'reset-3min',
    title: 'Reinitialiser',
    subtitle: 'Reset 3 minutes',
    description: 'Cycles de 5-5 pendant environ 3 minutes pour repartir du bon pied.',
    phases: [
      { key: 'inhale', durationSeconds: 5 },
      { key: 'exhale', durationSeconds: 5 },
    ],
  },
}

const patternId = computed(() => (route.params.id as string) || 'coherence-5-5')
const pattern = computed<BreathPattern>(() => PATTERNS[patternId.value] ?? PATTERNS['coherence-5-5'])

const phases = computed(() => pattern.value.phases)
const currentPhase = computed(() => phases.value[currentPhaseIndex.value])

const phaseLabel = computed(() => {
  const key = currentPhase.value.key
  if (key === 'inhale') return 'Inspire doucement...'
  if (key === 'exhale') return 'Expire en laissant tomber les epaules...'
  if (key === 'hold-top') return 'Garde l\'air un instant...'
  if (key === 'hold-bottom') return 'Fais une petite pause avant la prochaine inspiration...'
  return ''
})

const bubbleStyle = computed(() => ({
  transform: `translateY(${bubbleOffset.value}px)` as string,
  transition: `transform ${bubbleDuration.value}s linear`,
}))

function measure() {
  const track = trackRef.value
  const bubble = bubbleRef.value
  if (!track || !bubble) return
  const offset = track.offsetHeight - bubble.offsetHeight
  maxOffset.value = offset > 0 ? offset : 0
}

function setBubblePositionForPhase(phase: BreathPhase) {
  if (!maxOffset.value) {
    measure()
  }
  let target = bubbleOffset.value
  if (phase.key === 'inhale' || phase.key === 'hold-top') {
    target = 0
  } else if (phase.key === 'exhale' || phase.key === 'hold-bottom') {
    target = maxOffset.value
  }
  bubbleDuration.value = phase.key === 'hold-top' || phase.key === 'hold-bottom' ? 0 : phase.durationSeconds
  bubbleOffset.value = target
}

function playGong() {
  const audio = gongRef.value
  if (!audio) return
  try {
    audio.currentTime = 0
    void audio.play()
  } catch (error) {
    // ignore playback errors (autoplay restrictions)
  }
}

function scheduleNextPhase(prevPhase: BreathPhase | null) {
  const phase = currentPhase.value
  setBubblePositionForPhase(phase)

  const durationMs = Math.max(0.1, phase.durationSeconds) * 1000
  if (phaseTimeoutId.value !== null) {
    window.clearTimeout(phaseTimeoutId.value)
  }

  phaseTimeoutId.value = window.setTimeout(() => {
    if (!isRunning.value) return

    const list = phases.value
    const current = currentPhase.value
    const index = list.indexOf(current)
    const nextIndex = index === -1 ? 0 : (index + 1) % list.length
    const nextPhase = list[nextIndex]

    // Dong uniquement quand on bascule inspire <-> expire
    if (
      (current.key === 'inhale' && nextPhase.key === 'exhale') ||
      (current.key === 'exhale' && nextPhase.key === 'inhale')
    ) {
      playGong()
    }

    currentPhaseIndex.value = nextIndex
    scheduleNextPhase(current)
  }, durationMs)
}

function startSession() {
  if (isRunning.value) return
  isRunning.value = true
  currentPhaseIndex.value = 0
  measure()
  scheduleNextPhase(null)
}

function stopSession() {
  isRunning.value = false
  if (phaseTimeoutId.value !== null) {
    window.clearTimeout(phaseTimeoutId.value)
    phaseTimeoutId.value = null
  }
}

function toggleSession() {
  if (isRunning.value) {
    stopSession()
    return
  }
  startSession()
}

function goBack() {
  router.back()
}

onMounted(() => {
  measure()
})

onBeforeUnmount(() => {
  stopSession()
})
</script>

<template>
  <section class="breath-page">
    <header class="breath-header">
      <button type="button" class="icon-button" @click="goBack">
        <i class="pi pi-chevron-left" aria-hidden="true"></i>
      </button>
      <div class="breath-header-main">
        <p class="breath-kicker">Respiration guidee</p>
        <h1 class="breath-title">{{ pattern.title }}</h1>
        <p class="breath-subtitle">
          {{ pattern.subtitle }} · {{ pattern.description }}
        </p>
      </div>
    </header>

    <main class="breath-main">
      <div class="breath-track-wrapper">
        <div ref="trackRef" class="breath-track">
          <div ref="bubbleRef" class="breath-bubble" :style="bubbleStyle"></div>
        </div>
      </div>

      <p class="breath-instruction">
        {{ phaseLabel }}
      </p>
    </main>

    <footer class="breath-footer">
      <button type="button" class="primary breath-cta" @click="toggleSession">
        <span v-if="!isRunning">Commencer la seance</span>
        <span v-else>Mettre en pause</span>
      </button>
    </footer>

    <audio ref="gongRef" src="/sounds/gong.mp3"></audio>
  </section>
</template>

<style scoped>
.breath-page {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem 0.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.breath-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.breath-header-main {
  flex: 1;
  min-width: 0;
}

.breath-kicker {
  margin: 0 0 0.2rem;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent-soft);
  opacity: 0.9;
}

.breath-title {
  margin: 0;
  font-size: 1.1rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.breath-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.breath-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 0.5rem 0.75rem 0;
}

.breath-track-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.breath-track {
  position: relative;
  width: 72px;
  max-width: 72px;
  height: 320px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 20% 0%, rgba(20, 244, 209, 0.35), transparent 55%),
    radial-gradient(circle at 80% 100%, rgba(56, 189, 248, 0.3), transparent 55%),
    #020617;
  box-shadow:
    0 0 0 1px rgba(148, 163, 184, 0.4),
    0 26px 60px rgba(0, 0, 0, 0.95);
  overflow: hidden;
  padding: 10px 14px;
}

.breath-bubble {
  position: absolute;
  left: 50%;
  width: 40px;
  height: 40px;
  margin-left: -20px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.9), transparent 55%),
    radial-gradient(circle at 80% 100%, rgba(20, 244, 209, 0.75), transparent 60%),
    radial-gradient(circle at 50% 60%, #38bdf8, #0ea5e9 60%, #020617 100%);
  box-shadow:
    0 10px 35px rgba(15, 23, 42, 0.95),
    0 0 30px rgba(56, 189, 248, 0.6);
  will-change: transform;
}

.breath-instruction {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.breath-footer {
  margin-top: 0.5rem;
}

.breath-cta {
  width: 100%;
  font-size: 0.9rem;
}
</style>
