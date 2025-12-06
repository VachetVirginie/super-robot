<script setup lang="ts">
import { computed, defineProps, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const isPlaying = ref(false)
const audioRef = ref<HTMLAudioElement | null>(null)

const SESSION_DURATION = 180

const isOverlayOpen = ref(false)
const remainingSeconds = ref(SESSION_DURATION)
const timerId = ref<number | null>(null)
const showCongrats = ref(false)
const congratsTimeoutId = ref<number | null>(null)

const showReflection = ref(false)
const reflectionText = ref('')
const reflectionSaved = ref(false)
const reflectionCategory = ref('other')

const reflectionCategories = [
  { value: 'work', label: 'Travail' },
  { value: 'family', label: 'Famille' },
  { value: 'health', label: 'Sante' },
  { value: 'other', label: 'Autre' },
]

const props = defineProps<{
  isAuthenticated: boolean
  isSavingStressReason: boolean
  saveStressReason: (reason: string, category?: string | null) => void | Promise<void>
}>()

const tracks = [
  {
    id: 'waves',
    label: 'Vagues',
    title: 'Mer',
    subtitle: "Le roulement des vagues pour apaiser l'esprit",
    src: '/sounds/waves.mp3',
  },
  {
    id: 'ocean',
    label: 'Océan',
    title: 'Océan calme',
    subtitle: "Un océan paisible pour respirer en profondeur",
    src: '/sounds/ocean.mp3',
  },
  {
    id: 'river',
    label: 'Rivi1ere',
    title: 'Rivi1ere sereine',
    subtitle: "Le flux de l'eau qui coule pour se recentrer",
    src: '/sounds/river.mp3',
  },
  {
    id: 'water',
    label: 'Eau',
    title: 'Eau apaisante',
    subtitle: "Un fond d'eau douce pour t'accompagner",
    src: '/sounds/water.mp3',
  },
  {
    id: 'birds',
    label: 'Oiseaux',
    title: "Chants d'oiseaux",
    subtitle: 'Les oiseaux pour une balade mentale en nature',
    src: '/sounds/birds.mp3',
  },
  {
    id: 'calm',
    label: 'Calme',
    title: 'Ambiance calme',
    subtitle: 'Un fond sonore doux pour se poser',
    src: '/sounds/calm.mp3',
  },
  {
    id: 'gong',
    label: 'Gong',
    title: 'Gong zen',
    subtitle: "Un gong doux pour marquer le d1ebut ou la fin d'une pause",
    src: '/sounds/gong.mp3',
  },
]

const defaultTrack = tracks[0]!
const selectedTrackId = ref(defaultTrack.id)
const currentTrack = computed(
  () => tracks.find((track) => track.id === selectedTrackId.value) ?? defaultTrack,
)

const trackTitle = computed(() => currentTrack.value.title)
const trackSubtitle = computed(() => currentTrack.value.subtitle)

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return '0:00'
  }
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// const formattedRemainingTime = computed(() => formatTime(remainingSeconds.value))
const elapsedSeconds = computed(() => SESSION_DURATION - remainingSeconds.value)
const formattedElapsedTime = computed(() => formatTime(elapsedSeconds.value))
const formattedSessionDuration = computed(() => formatTime(SESSION_DURATION))
const sessionProgressPercent = computed(() => {
  if (SESSION_DURATION <= 0) return 0
  const ratio = elapsedSeconds.value / SESSION_DURATION
  return Math.max(0, Math.min(100, ratio * 100))
})

const route = useRoute()
const isQuickPause = computed(() => route.query.auto === '1')

function toggleSession() {
  if (isPlaying.value) {
    stopAudio()
    stopTimer()
    return
  }
  startAudio()
  startTimer()
}

function seekSeconds(delta: number) {
  const next = remainingSeconds.value - delta
  const clamped = Math.max(0, Math.min(SESSION_DURATION, next))
  remainingSeconds.value = clamped
}

function onFinishClick() {
  isOverlayOpen.value = false
  stopTimer()
  stopAudio()

  if (!isQuickPause.value) {
    showReflection.value = true
  }
}

const canSaveReflection = computed(() => {
  if (!props.isAuthenticated || props.isSavingStressReason) {
    return false
  }
  return reflectionText.value.trim().length > 0
})

function startAudio() {
  const audio = audioRef.value
  if (!audio) return

  audio.currentTime = 0
  audio.loop = true
  void audio.play()
  isPlaying.value = true
}

function stopAudio() {
  const audio = audioRef.value
  if (!audio) return

  audio.pause()
  audio.currentTime = 0
  isPlaying.value = false
}

function startTimer(reset = false) {
  stopTimer()
  if (reset) {
    remainingSeconds.value = SESSION_DURATION
  }
  timerId.value = window.setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value -= 1
    }

    if (remainingSeconds.value <= 0) {
      stopTimer()
      onTimerComplete()
    }
  }, 1000)
}

function stopTimer() {
  if (timerId.value !== null) {
    window.clearInterval(timerId.value)
    timerId.value = null
  }
}

function onTimerComplete() {
  isOverlayOpen.value = false
  stopAudio()
  stopTimer()

  if (!isQuickPause.value) {
    showReflection.value = true
  }

  showCongrats.value = true

  if (congratsTimeoutId.value !== null) {
    window.clearTimeout(congratsTimeoutId.value)
  }

  congratsTimeoutId.value = window.setTimeout(() => {
    showCongrats.value = false
    congratsTimeoutId.value = null
  }, 4000)
}

function openOverlay(autoStart?: boolean | Event) {
  const shouldAutoStart = typeof autoStart === 'boolean' ? autoStart : false
  showCongrats.value = false
  showReflection.value = false
  reflectionSaved.value = false
  reflectionText.value = ''
  reflectionCategory.value = 'other'
  isOverlayOpen.value = true
  remainingSeconds.value = SESSION_DURATION
  stopTimer()
  stopAudio()
  isPlaying.value = false

  if (shouldAutoStart) {
    startAudio()
    startTimer()
  }
}

function openRandomOverlayIfNeeded() {
  const auto = route.query.auto
  if (auto === '1') {
    if (tracks.length > 0) {
      const index = Math.floor(Math.random() * tracks.length)
      const randomTrack = tracks[index]
      if (randomTrack) {
        selectedTrackId.value = randomTrack.id
      }
    }
    openOverlay(true)
  }
}

function closeOverlay() {
  isOverlayOpen.value = false
  stopTimer()
  stopAudio()

  const hasStarted = remainingSeconds.value < SESSION_DURATION
  const finished = remainingSeconds.value <= 0
  if (!isQuickPause.value && hasStarted && !finished) {
    showReflection.value = true
  }
}

function onVisualClick() {
  // Permet de (re)lancer l'audio par un vrai geste utilisateur
  toggleSession()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOverlayOpen.value) {
    event.preventDefault()
    closeOverlay()
  }
}

watch(selectedTrackId, () => {
  if (isOverlayOpen.value) {
    stopAudio()
    startAudio()
  } else {
    stopAudio()
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  openRandomOverlayIfNeeded()

  if (!isQuickPause.value) {
    openOverlay()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  stopTimer()
  stopAudio()

  if (congratsTimeoutId.value !== null) {
    window.clearTimeout(congratsTimeoutId.value)
  }
})

async function onSaveReflection() {
  const text = reflectionText.value.trim()
  if (!text || !canSaveReflection.value) {
    return
  }

  reflectionSaved.value = false
  await props.saveStressReason(text, reflectionCategory.value)
  if (!props.isSavingStressReason) {
    showReflection.value = false
    reflectionText.value = ''
    reflectionCategory.value = 'other'
  }
}
</script>

<template>
  <section class="alert-page">
    <h2 class="alert-title">Espace zen</h2>
    <p class="alert-subtitle">
      Quand tu sens que la pression monte un peu trop, tu peux venir ici pour te poser,
      respirer et laisser ton corps se detendre quelques minutes.
    </p>

    <div v-if="!isOverlayOpen" class="player-track-select">
      <label class="player-track-label" for="zen-track-select">Choisir une ambiance</label>
      <select
        id="zen-track-select"
        v-model="selectedTrackId"
        class="player-track-select-input"
      >
        <option v-for="track in tracks" :key="track.id" :value="track.id">
          {{ track.label }}
        </option>
      </select>
    </div>

    <div class="player-card">
      <div class="player-header">
        <div class="player-badge">Anti-stress</div>
      </div>

      <div class="player-card-main">
        <button type="button" class="player-play main-play" @click="openOverlay">
          <i class="pi pi-play" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <div v-if="isOverlayOpen" class="zen-overlay">
      <div class="zen-overlay-inner">
        <header class="zen-overlay-header">
          <button
            type="button"
            class="zen-overlay-header-icon"
            @click="closeOverlay"
          >
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
          </button>
          <!-- <div class="zen-overlay-header-title">{{ formattedRemainingTime }}</div> -->
          <span class="zen-overlay-timer">{{ formattedSessionDuration }}</span>
        </header>

        <div class="zen-overlay-body">
          <div class="player-track-select zen-overlay-track-select">
            <label class="player-track-label" for="zen-track-select-overlay">
              Choisir une ambiance
            </label>
            <select
              id="zen-track-select-overlay"
              v-model="selectedTrackId"
              class="player-track-select-input"
            >
              <option v-for="track in tracks" :key="track.id" :value="track.id">
                {{ track.label }}
              </option>
            </select>
          </div>

          <div
            :class="['zen-overlay-visual', { 'is-playing': isPlaying }]"
            @click="onVisualClick"
          >
            <div class="circle outer"></div>
            <div class="circle middle"></div>
            <div class="circle inner"></div>
          </div>

          <div class="zen-overlay-text">
            <h3 class="zen-overlay-title">{{ trackTitle }}</h3>
            <p class="zen-overlay-subtitle">
              {{ trackSubtitle }}
            </p>
          </div>

          <div class="zen-overlay-progress">
            <div class="zen-progress-bar">
              <div
                class="zen-progress-fill"
                :style="{ width: sessionProgressPercent + '%' }"
              ></div>
            </div>
            <div class="zen-progress-times">
              <span>{{ formattedElapsedTime }}</span>              
            </div>
          </div>

          <div class="zen-overlay-controls">
            <button
              type="button"
              class="zen-control-button"
              @click="seekSeconds(-10)"
            >
              <span class="zen-control-icon">
                <i class="pi pi-step-backward-alt" aria-hidden="true"></i>
                <span class="zen-control-label">10</span>
              </span>
            </button>

            <button
              type="button"
              class="zen-control-button zen-control-button-main"
              @click="toggleSession"
            >
              <i
                :class="['pi', isPlaying ? 'pi-pause' : 'pi-play']"
                aria-hidden="true"
              ></i>
            </button>

            <button
              type="button"
              class="zen-control-button"
              @click="seekSeconds(10)"
            >
              <span class="zen-control-icon">
                <span class="zen-control-label">10</span>
                <i class="pi pi-step-forward-alt" aria-hidden="true"></i>
              </span>
            </button>
          </div>

          <button
            type="button"
            class="primary zen-finish-button"
            @click="onFinishClick"
          >
            Terminer ma pause
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCongrats" class="zen-congrats">
      <div class="zen-congrats-card">
        <p class="zen-congrats-title">Prendre un petit recul</p>
        <p class="zen-congrats-text">
          Bravo, tu as pris 3 minutes pour toi. Prends encore une respiration profonde avant de
          reprendre ta journee.
        </p>
      </div>
    </div>

    <div
      v-if="showReflection"
      class="dialog-backdrop"
      @click.self="showReflection = false"
    >
      <div class="dialog-card reflection-card">
        <h3 class="reflection-title">Prendre un petit recul</h3>
        <p class="reflection-subtitle">
          Qu'est-ce qui a declenche cette montee de stress ? Note quelques mots pour t'aider a
          reperer ce qui revient souvent.
        </p>
        <textarea
          v-model="reflectionText"
          class="reflection-textarea"
          rows="3"
          placeholder="Exemples : conflit au travail, surcharge de messages, retard, impression de ne pas y arriver..."
        ></textarea>
        <label class="reflection-category-label" for="reflection-category">
          Cette situation est plutot liee a :
        </label>
        <select
          id="reflection-category"
          v-model="reflectionCategory"
          class="reflection-category-select"
        >
          <option
            v-for="option in reflectionCategories"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <button
          type="button"
          class="primary reflection-button"
          :disabled="!canSaveReflection"
          @click="onSaveReflection"
        >
          <span v-if="props.isSavingStressReason">Enregistrement...</span>
          <span v-else>Enregistrer cette raison</span>
        </button>
        <p v-if="reflectionSaved" class="reflection-hint">
          Merci, c'est note. On pourra s'en servir pour mieux comprendre ce qui revient.
        </p>
      </div>
    </div>

    <audio ref="audioRef" :src="currentTrack.src"></audio>
  </section>
</template>

<style scoped>
.alert-page {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem 0.25rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-title {
  margin: 0;
  font-size: 1.15rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}

.alert-subtitle {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.85;
}

.player-track-select {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-track-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.8;
}

.player-track-select-input {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
}

.player-card {
  margin-top: 0.25rem;
  border-radius: 1.5rem;
  padding: 1.1rem 1rem 1.1rem;
  min-height: 17rem;
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.16), transparent 55%),
    #111111;
  border: 1px solid #27272a;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.player-badge {
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(248, 250, 252, 0.2);
}

.player-duration {
  font-size: 0.75rem;
  opacity: 0.8;
}

.player-main {
  display: flex;
  align-items: center;
  gap: 1.1rem;
}

.player-visual {
  position: relative;
  width: 80px;
  height: 80px;
}

.circle {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 1px solid rgba(248, 250, 252, 0.7);
}

.circle.outer {
  opacity: 0.25;
}

.circle.middle {
  inset: 8px;
  opacity: 0.45;
}

.circle.inner {
  inset: 18px;
  background:
    radial-gradient(circle at 30% 20%, #bbf7d0 0, #4ade80 40%, #15803d 85%);
  box-shadow:
    0 20px 55px rgba(0, 0, 0, 0.9),
    0 0 40px rgba(34, 197, 94, 0.35);
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-title {
  margin: 0;
  font-size: 1rem;
}

.player-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.player-play {
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #22c55e, #4ade80);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #022c22;
  box-shadow: 0 16px 32px rgba(34, 197, 94, 0.6);
}

.player-play i {
  font-size: 1.1rem;
}

.player-progress {
  flex: 1;
}

.player-slider {
  width: 100%;
  appearance: none;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(to right, #22c55e, #4ade80);
  outline: none;
}

.player-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #f9fafb;
  border: 2px solid #020617;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.8);
  margin-top: -5px;
}

.player-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #f9fafb;
  border: 2px solid #020617;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.8);
}

.player-card-main {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-play.main-play {
  width: 5.5rem;
  height: 5.5rem;
  margin-top: 2rem;
}

.zen-overlay {
  position: fixed;
  inset: 0;
  background: rgba(22, 23, 24, 0.96);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.zen-overlay-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.zen-overlay-inner {
  width: 100%;
  height: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 2rem;
  display: flex;
  flex-direction: column;
}

.zen-overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.zen-overlay-timer {
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.zen-overlay-close {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  border: none;
  background: rgba(15, 23, 42, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e5e7eb;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7);
}

.zen-overlay-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 1.75rem;
  margin-top: 1.5rem;
}

.zen-overlay-text {
  text-align: center;
  align-self: center;
  margin-top: 0;
}

.zen-overlay-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.zen-overlay-subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.zen-overlay-visual {
  position: relative;
  width: 200px;
  height: 200px;
  margin-top: 4.25rem;
}

.zen-overlay-visual.is-playing .circle.outer {
  animation: breatheOuter 8s ease-in-out infinite;
}

.zen-overlay-visual.is-playing .circle.middle {
  animation: breatheMiddle 8s ease-in-out infinite;
}

.zen-overlay-visual.is-playing .circle.inner {
  animation: breatheInner 8s ease-in-out infinite;
}

@keyframes breatheOuter {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.25;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.4;
  }
}

@keyframes breatheMiddle {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.45;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.6;
  }
}

@keyframes breatheInner {
  0%,
  100% {
    transform: scale(1);
    box-shadow:
      0 20px 55px rgba(0, 0, 0, 0.9),
      0 0 40px rgba(34, 197, 94, 0.35);
  }
  50% {
    transform: scale(1.14);
    box-shadow:
      0 26px 65px rgba(0, 0, 0, 1),
      0 0 80px rgba(34, 197, 94, 0.6);
  }
}

.zen-congrats {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1.5rem 1rem;
  pointer-events: none;
  z-index: 60;
}

.zen-congrats-card {
  max-width: 420px;
  width: 100%;
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.22), transparent 55%),
    rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(34, 197, 94, 0.5);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.95);
  padding: 0.9rem 1rem;
}

.zen-congrats-title {
  margin: 0 0 0.25rem;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.9;
}

.zen-congrats-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.reflection-card {
  padding: 1rem 0.9rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.reflection-title {
  margin: 0;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.reflection-subtitle {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.8;
}

.reflection-textarea {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #050505;
  color: #e5e7eb;
  padding: 0.6rem 0.7rem;
  font-size: 0.85rem;
  resize: vertical;
}

.reflection-category-label {
  margin: 0.2rem 0 0.1rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.reflection-category-select {
  width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #050505;
  color: #e5e7eb;
  padding: 0.35rem 0.7rem;
  font-size: 0.85rem;
}

.reflection-button {
  margin-top: 0.1rem;
}

.reflection-hint {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.8;
}
</style>
