<script setup lang="ts">
import { computed, defineProps, ref, watch } from 'vue'

const isPlaying = ref(false)
const progress = ref(0)
const duration = ref(0)
const currentTime = ref(0)
const audioRef = ref<HTMLAudioElement | null>(null)

const totalPlayed = ref(0)
const lastTick = ref<number | null>(null)
const MAX_DURATION = 180

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

const canSaveReflection = computed(() => {
  if (!props.isAuthenticated || props.isSavingStressReason) {
    return false
  }
  return reflectionText.value.trim().length > 0
})

const tracks = [
  {
    id: 'waves',
    label: 'Vagues',
    title: 'Vagues ocean',
    subtitle: "Le roulement des vagues pour apaiser l'esprit",
    src: '/sounds/waves.mp3',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    title: 'Ocean calme',
    subtitle: "Un ocean paisible pour respirer en profondeur",
    src: '/sounds/ocean.mp3',
  },
  {
    id: 'river',
    label: 'Riviere',
    title: 'Riviere sereine',
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
    subtitle: "Un gong doux pour marquer le debut ou la fin d'une pause",
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
  if (!Number.isFinite(value) || value <= 0) {
    return '0:00'
  }
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function togglePlay() {
  const audio = audioRef.value
  if (!audio) return

  if (audio.paused) {
    if (totalPlayed.value >= MAX_DURATION) {
      totalPlayed.value = 0
      audio.currentTime = 0
    }
    audio.loop = true
    lastTick.value = performance.now()
    void audio.play()
    isPlaying.value = true
    showReflection.value = false
    reflectionSaved.value = false
    reflectionText.value = ''
    reflectionCategory.value = 'other'
  } else {
    audio.pause()
    isPlaying.value = false
    lastTick.value = null
    if (totalPlayed.value > 0) {
      showReflection.value = true
    }
  }
}

function onLoadedMetadata() {
  const audio = audioRef.value
  if (!audio) return
  audio.loop = true
  duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
}

function onTimeUpdate() {
  const audio = audioRef.value
  if (!audio || !duration.value) return

  const now = performance.now()
  if (isPlaying.value && lastTick.value !== null) {
    totalPlayed.value += (now - lastTick.value) / 1000
  }
  lastTick.value = now

  if (totalPlayed.value >= MAX_DURATION) {
    audio.pause()
    isPlaying.value = false
    audio.currentTime = 0
    progress.value = 0
    currentTime.value = 0
    totalPlayed.value = 0
    lastTick.value = null
    showReflection.value = true
    return
  }

  currentTime.value = audio.currentTime
  progress.value = Math.min(100, Math.max(0, (audio.currentTime / duration.value) * 100))
}

function onEnded() {
  isPlaying.value = false
  progress.value = 0
  currentTime.value = 0
  totalPlayed.value = 0
  lastTick.value = null
}

function onScrub(event: Event) {
  const input = event.target as HTMLInputElement | null
  const audio = audioRef.value
  if (!input || !audio || !duration.value) return

  const value = Number(input.value)
  const ratio = Math.min(100, Math.max(0, value)) / 100
  const newTime = duration.value * ratio
  audio.currentTime = newTime
  lastTick.value = performance.now()
}

watch(selectedTrackId, () => {
  const audio = audioRef.value
  if (!audio) return

  audio.pause()
  audio.currentTime = 0
  isPlaying.value = false
  progress.value = 0
  duration.value = 0
  currentTime.value = 0
  totalPlayed.value = 0
  lastTick.value = null
  showReflection.value = false
  reflectionSaved.value = false
  reflectionText.value = ''
  reflectionCategory.value = 'other'
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
  <section class="zen-page">
    <h2 class="zen-title">Espace zen</h2>
    <p class="zen-subtitle">
      Quand tu sens que la pression monte un peu trop, tu peux venir ici pour te poser,
      respirer et laisser ton corps se detendre quelques minutes.
    </p>

    <p class="zen-instruction">
      Inspire doucement quand le cercle interieur gonfle, expire quand il se retrecit.
    </p>

    <div class="player-track-select">
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
        <span class="player-duration">
          {{ formatTime(currentTime) }} / 3:00
        </span>
      </div>

      <div class="player-main">
        <div :class="['player-visual', { 'is-playing': isPlaying }]">
          <div class="circle outer"></div>
          <div class="circle middle"></div>
          <div class="circle inner"></div>
        </div>
        <div class="player-info">
          <h3 class="player-title">{{ trackTitle }}</h3>
          <p class="player-subtitle">
            {{ trackSubtitle }}
          </p>
        </div>
      </div>

      <div class="player-controls">
        <button type="button" class="player-play" @click="togglePlay">
          <i v-if="!isPlaying" class="pi pi-play" aria-hidden="true"></i>
          <i v-else class="pi pi-pause" aria-hidden="true"></i>
        </button>
        <div class="player-progress">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="progress"
            class="player-slider"
            @input="onScrub"
          />
        </div>
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

    <audio
      ref="audioRef"
      :src="currentTrack.src"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
    ></audio>
  </section>
</template>

<style scoped>
.zen-page {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem 0.25rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.zen-title {
  margin: 0;
  font-size: 1.15rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.zen-subtitle {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.85;
}

.zen-instruction {
  margin: 0.4rem 0 0;
  font-size: 0.8rem;
  opacity: 0.75;
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
  background: #020617;
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
  background: #020617;
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
  background:
    radial-gradient(circle at top left, rgba(248, 113, 113, 0.3), transparent 55%),
    radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.35), transparent 55%),
    #020617;
  border: 1px solid rgba(148, 163, 184, 0.4);
  box-shadow: 0 22px 55px rgba(0, 0, 0, 0.95);
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

.player-visual.is-playing .circle.outer {
  animation: breatheOuter 8s ease-in-out infinite;
}

.player-visual.is-playing .circle.middle {
  animation: breatheMiddle 8s ease-in-out infinite;
}

.player-visual.is-playing .circle.inner {
  animation: breatheInner 8s ease-in-out infinite;
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
  background: radial-gradient(circle at top left, #f97316, #ef4444);
  box-shadow: 0 16px 38px rgba(248, 113, 113, 0.9);
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
    box-shadow: 0 16px 38px rgba(248, 113, 113, 0.9);
  }
  50% {
    transform: scale(1.15);
    box-shadow: 0 22px 48px rgba(248, 113, 113, 1);
  }
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
  background: #f97316;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #020617;
  box-shadow: 0 16px 32px rgba(248, 113, 113, 0.95);
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
  background: linear-gradient(to right, #f97316, #22c55e);
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
</style>
