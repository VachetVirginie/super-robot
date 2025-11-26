<script setup lang="ts">
import { ref } from 'vue'

const isPlaying = ref(false)
const progress = ref(0)
const duration = ref(0)
const currentTime = ref(0)
const audioRef = ref<HTMLAudioElement | null>(null)

const trackTitle = 'Respiration zen'
const trackSubtitle = '2 minutes pour relacher la pression'

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
    void audio.play()
    isPlaying.value = true
  } else {
    audio.pause()
    isPlaying.value = false
  }
}

function onLoadedMetadata() {
  const audio = audioRef.value
  if (!audio) return
  duration.value = Number.isFinite(audio.duration) ? audio.duration : 0
}

function onTimeUpdate() {
  const audio = audioRef.value
  if (!audio || !duration.value) return

  currentTime.value = audio.currentTime
  progress.value = Math.min(100, Math.max(0, (audio.currentTime / duration.value) * 100))
}

function onEnded() {
  isPlaying.value = false
  progress.value = 0
  currentTime.value = 0
}

function onScrub(event: Event) {
  const input = event.target as HTMLInputElement | null
  const audio = audioRef.value
  if (!input || !audio || !duration.value) return

  const value = Number(input.value)
  const ratio = Math.min(100, Math.max(0, value)) / 100
  const newTime = duration.value * ratio
  audio.currentTime = newTime
}
</script>

<template>
  <section class="alert-page">
    <h2 class="alert-title">Espace zen</h2>
    <p class="alert-subtitle">
      Quand tu sens que la pression monte un peu trop, tu peux venir ici pour te poser,
      respirer et laisser ton corps se detendre quelques minutes.
    </p>

    <div class="player-card">
      <div class="player-header">
        <div class="player-badge">Anti-stress</div>
        <span class="player-duration">
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </span>
      </div>

      <div class="player-main">
        <div class="player-visual">
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

    <audio
      ref="audioRef"
      src=""
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
    ></audio>
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
}

.alert-subtitle {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.85;
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
