<script setup lang="ts">
import { computed, defineProps } from 'vue'

const props = defineProps<{
  isAuthenticated: boolean
  reasons: { id: string; created_at: string; reason: string | null }[]
  isLoadingReasons: boolean
  reasonsError: string | null
}>()

const sortedReasons = computed(() => {
  return [...props.reasons].sort((a, b) => a.created_at < b.created_at ? 1 : -1)
})

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <section class="stress-reasons-page">
    <h2 class="stress-reasons-title">Ce qui declenche mon stress</h2>

    <p v-if="!isAuthenticated" class="stress-reasons-text">
      Connecte-toi pour enregistrer et revoir les raisons qui declenchent ton stress.
    </p>

    <template v-else>
      <p class="stress-reasons-text">
        A chaque fois que tu utilises l'espace zen, tu peux noter ce qui a declenche ta
        montee de stress. Ici, tu retrouves ces raisons pour reperer ce qui revient
        souvent.
      </p>

      <p v-if="isLoadingReasons" class="stress-reasons-text">
        Chargement de tes raisons de stress...
      </p>

      <p v-else-if="reasonsError" class="stress-reasons-text stress-reasons-text--error">
        {{ reasonsError }}
      </p>

      <p
        v-else-if="!sortedReasons.length"
        class="stress-reasons-text stress-reasons-text--muted"
      >
        Tu n'as pas encore enregistre de raisons de stress depuis l'espace zen. La
        prochaine fois que tu sens la pression monter, prends 30 secondes pour noter ce
        qui s'est passe.
      </p>

      <ul v-else class="stress-reasons-list">
        <li v-for="item in sortedReasons" :key="item.id" class="stress-reasons-item">
          <p class="stress-reasons-reason">
            {{ item.reason ?? '(raison vide)' }}
          </p>
          <p class="stress-reasons-meta">
            Note le {{ formatDate(item.created_at) }}
          </p>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.stress-reasons-page {
  max-width: 100%;
  width: 100%;
  padding: 1.5rem 1.5rem 1.25rem;
  border-radius: 1rem;
  margin: 0 auto;
  background: #020617;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85);
}

.stress-reasons-title {
  margin: 0 0 0.9rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stress-reasons-text {
  margin: 0 0 0.6rem;
  font-size: 0.9rem;
}

.stress-reasons-text--muted {
  opacity: 0.8;
  font-size: 0.85rem;
}

.stress-reasons-text--error {
  color: #fecaca;
}

.stress-reasons-list {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.stress-reasons-item {
  padding: 0.7rem 0.8rem;
  border-radius: 0.75rem;
  background: #020617;
  border: 1px solid rgba(148, 163, 184, 0.45);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stress-reasons-reason {
  margin: 0;
  font-size: 0.9rem;
}

.stress-reasons-meta {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.8;
}
</style>
