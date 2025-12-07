<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{
  isAuthenticated: boolean
}>()

const router = useRouter()

const soundPresets = [
  { key: 'waves', title: 'Vagues', hint: 'Fond calme et regulier pour respirer.' },
  { key: 'deep-sea', title: 'Mer profonde', hint: 'Sons graves pour se sentir enveloppee.' },
  { key: 'soft-forest', title: 'Foret douce', hint: 'Oiseaux et feuillages legers.' },
  { key: 'white-noise', title: 'Bruit blanc', hint: 'Masquer le bruit ambiant.' },
  { key: 'soft-wind', title: 'Vent calme', hint: 'Souffle discret pour se poser.' },
]

const breathingPresets = [
  {
    key: 'coherence-5-5',
    title: 'Cohérence cardiaque (5-5)',
    description: 'Ralentit le systeme nerveux. 1 minute suffit.',
    context: 'Pour calmer avant une reunion ou te recentrer.',
  },
  {
    key: 'box-4-4-4-4',
    title: 'Respiration carree (4-4-4-4)',
    description: '4 temps egaux pour couper le pilote automatique.',
    context: 'A utiliser quand les pensees tournent en boucle.',
  },
  {
    key: 'slow-6-6',
    title: 'Respiration lente (6-6)',
    description: 'Inspire 6s, expire 6s pour relacher la pression.',
    context: 'Ideal le soir ou quand tout va trop vite.',
  },
  {
    key: 'reset-3min',
    title: 'Reinitialisation mentale (3 min)',
    description: 'Reset de 3 minutes pour repartir plus calme.',
    context: 'Apres une journee chargee ou un conflit.',
  },
]

const expressPresets = [
  { key: 'shoulders', label: 'Relacher les epaules' },
  { key: 'jaw', label: 'Decrisper la machoire' },
  { key: 'body-scan', label: 'Scan corporel rapide' },
  { key: 'heart-hands', label: 'Mains sur le coeur' },
]

const movementPresets = [
  { key: 'back', title: 'Etirement du dos', context: '2 min pour ouvrir le haut du dos.' },
  { key: 'neck', title: 'Mobilite de la nuque', context: 'Relache les tensions cervicales.' },
  { key: 'chest', title: 'Ouverture du thorax', context: 'Respirer un peu plus large.' },
  { key: 'wrists', title: 'Mobilite des poignets', context: 'Ideal si tu travailles beaucoup assise.' },
]

const ritualShortcuts = [
  { key: 'morning', title: 'Rituel du matin', hint: 'Commencer la journee du bon pied.' },
  { key: 'midday', title: 'Pause du midi', hint: 'Souffler au milieu de la journee.' },
  { key: 'evening', title: 'Bilan du soir', hint: 'Fermer la journee en douceur.' },
]

function openBreathingFlow(id: string) {
  router.push({ name: 'breath', params: { id } })
}

function openSound(id: string) {
  router.push({ name: 'pause', query: { sound: id } })
}

const showMindsetDetails = ref(false)

let sectionObserver: IntersectionObserver | null = null

onMounted(() => {
  sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
        }
      }
    },
    { threshold: 0.15 },
  )

  document.querySelectorAll<HTMLElement>('.resources-section').forEach((el) => {
    sectionObserver?.observe(el)
  })
})

onBeforeUnmount(() => {
  if (sectionObserver) {
    sectionObserver.disconnect()
    sectionObserver = null
  }
})
</script>

<template>
  <div class="resources-root">
    <section class="card resources-section resources-section--highlight">
      <div class="resources-section-header">
        <p class="resources-kicker">Ressources</p>
        <h2 class="resources-title">Sons et ambiances</h2>
        <p class="resources-text">
          Pour apaiser ton systeme nerveux en quelques secondes.
        </p>
      </div>

      <div class="resources-sounds-strip">
        <article
          v-for="item in soundPresets"
          :key="item.key"
          class="resources-sound-card"
        >
          <h3 class="resources-sound-title">{{ item.title }}</h3>
          <p class="resources-sound-hint">
            {{ item.hint }}
          </p>
          <button
            type="button"
            class="secondary resources-sound-cta"
            @click="openSound(item.key)"
          >
            Ecouter
          </button>
        </article>
      </div>
    </section>

    <section class="card resources-section">
      <div class="resources-section-header">
        <p class="resources-kicker">Respirations</p>
        <h2 class="resources-title">Respirations guidees</h2>
        <p class="resources-text">
          Des protocoles simples que tu peux utiliser a tout moment de la journee.
        </p>
      </div>

      <div class="resources-breathing-list">
        <article
          v-for="item in breathingPresets"
          :key="item.key"
          class="resources-breathing-card"
          @click="openBreathingFlow(item.key)"
        >
          <h3 class="resources-breathing-title">{{ item.title }}</h3>
          <p class="resources-breathing-desc">
            {{ item.description }}
          </p>
        </article>
      </div>
    </section>

    <section class="card resources-section">
      <div class="resources-section-header">
        <p class="resources-kicker">Anti-stress express</p>
        <h2 class="resources-title">1 minute pour relacher</h2>
        <p class="resources-text">
          Des micro-gestes pour detendre ton corps sans changer de piece.
        </p>
      </div>

      <div class="resources-grid resources-grid-express">
        <button
          v-for="item in expressPresets"
          :key="item.key"
          type="button"
          class="resources-chip"
        >
          {{ item.label }}
        </button>
      </div>
    </section>

    <section class="card resources-section">
      <div class="resources-section-header">
        <p class="resources-kicker">Mouvement doux</p>
        <h2 class="resources-title">Bouger sans performance</h2>
        <p class="resources-text">
          Des mini-seances pour remettre un peu de mouvement dans la journee.
        </p>
      </div>

      <div class="resources-grid resources-grid-move">
        <article
          v-for="item in movementPresets"
          :key="item.key"
          class="resources-move-card"
        >
          <div class="resources-move-icon-circle"></div>
          <div class="resources-move-content">
            <h3 class="resources-move-title">{{ item.title }}</h3>
            <p class="resources-move-text">
              {{ item.context }}
            </p>
          </div>
        </article>
      </div>
    </section>

    <section class="card resources-section resources-mindset resources-section--highlight">
      <div class="resources-section-header">
        <p class="resources-kicker">Mindset</p>
        <h2 class="resources-title">Changer de regard</h2>
        <p class="resources-text">
          Une question, une perspective, un espace pour deposer ce qui tourne en boucle.
        </p>
      </div>

      <div class="resources-mindset-body">
        <div class="resources-mindset-block">
          <h3 class="resources-mindset-title">Question du jour</h3>
          <p class="resources-mindset-text">
            Quel petit geste pourrait rendre ta journee un peu plus douce pour toi ?
          </p>
        </div>
        <div class="resources-mindset-block">
          <h3 class="resources-mindset-title">Perspective</h3>
          <p class="resources-mindset-text">
            Tu ne controles pas tout ce qui arrive, mais tu peux choisir ce que tu nourris
            maintenant.
          </p>
        </div>
        <button
          type="button"
          class="resources-mindset-more"
          @click="showMindsetDetails = !showMindsetDetails"
        >
          {{ showMindsetDetails ? 'Masquer' : 'Voir plus' }}
        </button>
        <div
          v-if="showMindsetDetails"
          class="resources-mindset-field"
        >
          <label class="resources-mindset-label">
            Deposer une pensee
            <textarea
              rows="3"
              class="resources-mindset-textarea"
              placeholder="Une phrase ou deux suffisent. C'est juste pour toi."
            ></textarea>
          </label>
          <button type="button" class="primary resources-mindset-cta">
            Enregistrer pour aujourd'hui
          </button>
        </div>
      </div>
    </section>

    <section class="card resources-section">
      <div class="resources-section-header">
        <p class="resources-kicker">Rituels</p>
        <h2 class="resources-title">Guides et rituels</h2>
        <p class="resources-text">
          Des raccourcis vers tes routines matin, midi et soir.
        </p>
      </div>

      <div class="resources-rituals-list">
        <article
          v-for="item in ritualShortcuts"
          :key="item.key"
          class="resources-ritual-row"
        >
          <div class="resources-ritual-main">
            <h3 class="resources-ritual-title">{{ item.title }}</h3>
            <p class="resources-ritual-hint">
              {{ item.hint }}
            </p>
          </div>
          <button type="button" class="resources-ritual-cta">
            Ouvrir
          </button>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.resources-root {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  padding: 0.5rem 0.25rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.resources-section {
  padding: 0.9rem 0.9rem 0.9rem;
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 0.12s ease-out,
    transform 0.12s ease-out;
}

.resources-section.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.resources-section--highlight {
  background:
    radial-gradient(circle at top left, rgba(20, 244, 209, 0.16), transparent 60%),
    radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.12), transparent 60%),
    #111111;
  border-color: rgba(255, 255, 255, 0.09);
}

.resources-section-header {
  margin-bottom: 0.75rem;
  position: relative;
}

.resources-section-header::before {
  content: '';
  position: absolute;
  inset: -16px -12px auto -12px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 0% 0%, rgba(20, 244, 209, 0.15), transparent 55%);
  opacity: 0.9;
  pointer-events: none;
  z-index: -1;
}

.resources-kicker {
  margin: 0 0 0.25rem;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-soft);
  opacity: 0.9;
}

.resources-title {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.resources-text {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.75;
}

.resources-sounds-strip {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.resources-sounds-strip::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.resources-sound-card {
  min-width: 220px;
  max-width: 260px;
  border-radius: 0.9rem;
  padding: 0.75rem 0.85rem;
  background:
    radial-gradient(circle at top left, rgba(20, 244, 209, 0.12), transparent 60%),
    #111111;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.resources-sound-title {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
}

.resources-sound-hint {
  margin: 0 0 0.6rem;
  font-size: 0.8rem;
  opacity: 0.8;
}

.resources-sound-cta {
  width: 100%;
  font-size: 0.8rem;
}

.resources-breathing-list {
  margin-top: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.resources-breathing-card {
  border-radius: 0.9rem;
  padding: 0.7rem 0.8rem;
  background: #111111;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition:
    border-color 0.15s ease-out,
    box-shadow 0.15s ease-out,
    transform 0.12s ease-out;
}

.resources-breathing-title {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
}

.resources-breathing-desc {
  margin: 0 0 0.25rem;
  font-size: 0.8rem;
  opacity: 0.85;
}

.resources-breathing-meta {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.75;
}

.resources-grid {
  margin-top: 0.75rem;
  display: grid;
  gap: 0.5rem;
}

.resources-grid-express {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.resources-grid-move {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.resources-chip {
  width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background:
    radial-gradient(circle at 0% 0%, rgba(20, 244, 209, 0.16), transparent 55%),
    #020617;
  color: #e5e7eb;
  padding: 0.45rem 0.5rem;
  font-size: 0.8rem;
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.9),
    0 10px 24px rgba(20, 244, 209, 0.18);
  transition:
    background-color 0.15s ease-out,
    box-shadow 0.15s ease-out,
    transform 0.12s ease-out,
    border-color 0.12s ease-out;
}

.resources-chip:hover {
  border-color: rgba(20, 244, 209, 0.7);
  box-shadow:
    0 0 0 1px rgba(20, 244, 209, 0.5),
    0 16px 32px rgba(20, 244, 209, 0.28);
  transform: translateY(-1px);
}

.resources-chip:active {
  transform: translateY(0);
  box-shadow:
    0 0 0 1px rgba(20, 244, 209, 0.45),
    0 10px 20px rgba(20, 244, 209, 0.2);
  animation: resources-chip-tap 0.12s ease-out;
}

@keyframes resources-chip-tap {
  0% {
    transform: scale(0.97);
  }
  50% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
  }
}

.resources-move-card {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  border-radius: 0.9rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: #111111;
  transition:
    border-color 0.15s ease-out,
    box-shadow 0.15s ease-out,
    transform 0.12s ease-out;
}

.resources-move-icon-circle {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: radial-gradient(circle at 20% 0%, rgba(20, 244, 209, 0.2), rgba(15, 23, 42, 0.95));
}

.resources-move-title {
  margin: 0 0 0.1rem;
  font-size: 0.9rem;
}

.resources-move-text {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.8;
}

.resources-mindset {
  margin-top: 0.25rem;
}

.resources-mindset-body {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.resources-mindset-block {
  border-radius: 0.9rem;
  padding: 0.7rem 0.8rem;
  background: #111111;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition:
    border-color 0.15s ease-out,
    box-shadow 0.15s ease-out,
    transform 0.12s ease-out;
}

.resources-mindset-title {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
}

.resources-mindset-text {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.85;
}

.resources-mindset-field {
  border-radius: 0.9rem;
  padding: 0.7rem 0.8rem;
  background: #111111;
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.resources-breathing-card:hover,
.resources-move-card:hover,
.resources-mindset-block:hover,
.resources-mindset-field:hover {
  border-color: rgba(20, 244, 209, 0.6);
  box-shadow:
    0 0 0 1px rgba(20, 244, 209, 0.25),
    0 14px 32px rgba(20, 244, 209, 0.22);
  transform: translateY(-1px);
}

.resources-mindset-more {
  align-self: flex-start;
  margin-top: 0.25rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: transparent;
  color: #e5e7eb;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.resources-mindset-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
}

.resources-mindset-textarea {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #020617;
  color: #e5e7eb;
  padding: 0.45rem 0.7rem;
  font-size: 0.85rem;
  resize: vertical;
  min-height: 72px;
}

.resources-mindset-cta {
  width: 100%;
  font-size: 0.85rem;
}

.resources-rituals-list {
  margin-top: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.resources-ritual-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0;
  border-top: 1px solid #27272a;
}

.resources-ritual-row:first-of-type {
  border-top: none;
}

.resources-ritual-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.resources-ritual-title {
  margin: 0;
  font-size: 0.9rem;
}

.resources-ritual-hint {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.8;
}

.resources-ritual-cta {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: transparent;
  color: #e5e7eb;
  padding: 0.25rem 0.7rem;
  font-size: 0.75rem;
}
</style>
