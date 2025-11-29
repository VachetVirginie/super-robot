<script setup lang="ts">
import { computed, defineProps, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  isAuthenticated: boolean
  reasons: { id: string; created_at: string; reason: string | null; category: string | null }[]
  isLoadingReasons: boolean
  reasonsError: string | null
  isSavingReason: boolean
  deleteStressReason: (id: string) => void | Promise<void>
  updateStressReason: (id: string, updates: { reason?: string; category?: string | null }) => void | Promise<void>
}>()

const router = useRouter()

const sortedReasons = computed(() => {
  return [...props.reasons].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
})

const groupedReasons = computed(() => {
  const groups: Record<
    string,
    { id: string; created_at: string; reason: string | null; category: string | null }[]
  > = {}

  for (const item of sortedReasons.value) {
    const key =
      item.category && ['work', 'family', 'health', 'other'].includes(item.category)
        ? item.category
        : 'uncategorized'
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
  }

  const order = ['work', 'family', 'health', 'other', 'uncategorized']
  const labels: Record<string, string> = {
    work: 'Travail',
    family: 'Famille',
    health: 'Sante',
    other: 'Autre',
    uncategorized: 'Sans categorie precise',
  }

  return order
    .filter((key) => groups[key] && groups[key].length)
    .map((key) => ({ key, label: labels[key], items: groups[key] }))
})

const categoryOptions = [
  { value: 'work', label: 'Travail' },
  { value: 'family', label: 'Famille' },
  { value: 'health', label: 'Sante' },
  { value: 'other', label: 'Autre' },
]

const editingId = ref<string | null>(null)
const editText = ref('')
const editCategory = ref<string | null>(null)
const deleteId = ref<string | null>(null)
const activeCategory = ref<'all' | 'work' | 'family' | 'health' | 'other' | 'uncategorized'>('all')

const filterOptions: { key: 'all' | 'work' | 'family' | 'health' | 'other' | 'uncategorized'; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'work', label: 'Travail' },
  { key: 'family', label: 'Famille' },
  { key: 'health', label: 'Sante' },
  { key: 'other', label: 'Autre' },
  { key: 'uncategorized', label: 'Sans categorie' },
]

const filteredGroups = computed(() => {
  if (activeCategory.value === 'all') {
    return groupedReasons.value
  }
  return groupedReasons.value.filter((group) => group.key === activeCategory.value)
})

const stressSummary = computed(() => {
  const groups = groupedReasons.value
  if (!groups.length) {
    return [] as { key: string; label: string; count: number }[]
  }

  const sorted = [...groups].sort(
    (a, b) => (b.items?.length ?? 0) - (a.items?.length ?? 0),
  )

  return sorted
    .filter((group) => (group.items?.length ?? 0) > 0)
    .slice(0, 3)
    .map((group) => ({
      key: group.key,
      label: group.label,
      count: group.items?.length ?? 0,
    }))
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

function formatCategory(value: string | null) {
  if (value === 'work') return 'Travail'
  if (value === 'family') return 'Famille'
  if (value === 'health') return 'Sante'
  if (value === 'other') return 'Autre'
  return 'Sans categorie precise'
}

function categoryCoachingText(key: string) {
  if (key === 'work') {
    return "Travail : regarde si ce sont surtout la charge, les delais ou les relations. Choisis une petite action simple pour alleger un peu ta semaine."
  }
  if (key === 'family') {
    return "Famille : pense a un moment de la journee ou la tension monte. Quelle petite chose pourrais-tu changer pour te proteger un peu plus ?"
  }
  if (key === 'health') {
    return "Sante : concentre-toi sur ce qui est sous ton controle (sommeil, marche, pause respiration) et choisis une seule action realiste pour cette semaine."
  }
  if (key === 'other') {
    return "Autre : prends un exemple recent et demande-toi ce qui t'a le plus pese. Note une idee a tester la prochaine fois."
  }
  return "Ne cherche pas a tout corriger. Repere ce qui revient le plus et choisis une seule idee d'action a tester cette semaine."
}

function startEdit(item: {
  id: string
  created_at: string
  reason: string | null
  category: string | null
}) {
  editingId.value = item.id
  editText.value = item.reason ?? ''
  editCategory.value = item.category
}

function cancelEdit() {
  editingId.value = null
  editText.value = ''
  editCategory.value = null
}

async function saveEdit(id: string) {
  const text = editText.value.trim()
  if (!text) {
    return
  }
  await props.updateStressReason(id, {
    reason: text,
    category: editCategory.value,
  })
  editingId.value = null
}

async function onDelete(id: string) {
  deleteId.value = id
}

function cancelDelete() {
  deleteId.value = null
}

async function confirmDelete() {
  if (!deleteId.value) {
    return
  }
  const id = deleteId.value
  deleteId.value = null
  await props.deleteStressReason(id)
}
</script>

<template>
  <div class="stress-reasons-root">
    <button
      type="button"
      class="icon-button stress-back-button"
      @click="router.push({ name: 'bilan' })"
    >
      <i class="pi pi-chevron-left" aria-hidden="true"></i>
    </button>

    <section class="card stress-reasons-page">
      <h2 class="stress-reasons-title">Ce qui declenche mon stress</h2>

      <p v-if="!isAuthenticated" class="stress-reasons-text">
        Connecte-toi pour enregistrer et revoir les raisons qui declenchent ton stress.
      </p>

      <template v-else>
        <p class="stress-reasons-text">
          Ton coach se base sur ce que tu notes ici pour comprendre ce qui pese le plus
          en ce moment. Le but n'est pas de tout regler d'un coup, mais de reperer 1 ou
          2 pistes sur lesquelles tu peux agir plus facilement.
        </p>

        <p v-if="isLoadingReasons" class="stress-reasons-text">
          Chargement de tes raisons de stress...
        </p>

        <p v-else-if="reasonsError" class="stress-reasons-text stress-reasons-text--error">
          {{ reasonsError }}
        </p>

        <p
          v-else-if="!groupedReasons.length"
          class="stress-reasons-text stress-reasons-text--muted"
        >
          Tu n'as pas encore enregistre de raisons de stress depuis l'espace zen. La
          prochaine fois que tu sens la pression monter, prends 30 secondes pour noter ce
          qui s'est passe.
        </p>

        <template v-else>
          <section v-if="stressSummary.length" class="stress-summary">
            <p class="stress-reasons-text stress-reasons-text--muted">
              Sur tes dernieres notes, voici ce qui ressort le plus souvent :
            </p>
            <ul class="stress-summary-list">
              <li
                v-for="item in stressSummary"
                :key="item.key"
                class="stress-summary-item"
              >
                <span class="stress-summary-label">{{ item.label }}</span>
                <span class="stress-summary-count">{{ item.count }} raison(s)</span>
              </li>
            </ul>
          </section>

          <div class="stress-filters">
            <button
              v-for="option in filterOptions"
              :key="option.key"
              type="button"
              class="stress-filter-button"
              :class="{ 'is-active': activeCategory === option.key }"
              @click="activeCategory = option.key"
            >
              {{ option.label }}
            </button>
          </div>
        </template>
      </template>
    </section>

    <section
      v-if="isAuthenticated && filteredGroups.length"
      class="stress-categories-container"
    >
      <section
        v-for="group in filteredGroups"
        :key="group.key"
        class="card stress-category-card"
      >
        <h3 class="stress-reasons-group-title">
          {{ group.label }}
        </h3>
        <p class="stress-reasons-text stress-reasons-text--muted">
          {{ categoryCoachingText(group.key) }}
        </p>
        <ul class="stress-reasons-list">
          <li
            v-for="item in group.items"
            :key="item.id"
            class="stress-reasons-item"
          >
            <template v-if="editingId === item.id">
              <textarea
                v-model="editText"
                class="stress-reasons-edit-textarea"
                rows="3"
              ></textarea>
              <select
                v-model="editCategory"
                class="stress-reasons-select"
              >
                <option :value="null">Sans categorie precise</option>
                <option
                  v-for="option in categoryOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <div class="stress-reasons-actions">
                <button
                  type="button"
                  class="stress-reasons-action"
                  :disabled="props.isSavingReason"
                  @click="saveEdit(item.id)"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  class="stress-reasons-action"
                  @click="cancelEdit"
                >
                  Annuler
                </button>
              </div>
            </template>
            <template v-else>
              <p class="stress-reasons-reason">
                {{ item.reason ?? '(raison vide)' }}
              </p>
              <p class="stress-reasons-meta">
                Note le {{ formatDate(item.created_at) }} ·
                {{ formatCategory(item.category) }}
              </p>
              <div class="stress-reasons-actions">
                <button
                  type="button"
                  class="stress-reasons-action"
                  @click="startEdit(item)">
                  Modifier
                </button>
                <button
                  type="button"
                  class="stress-reasons-action stress-reasons-action--danger"
                  :disabled="props.isSavingReason"
                  @click="onDelete(item.id)"
                >
                  Supprimer
                </button>
              </div>
            </template>
          </li>
        </ul>
      </section>
    </section>

    <section
      v-if="isAuthenticated && groupedReasons.length"
      class="card stress-reasons-page"
    >
      <p class="stress-reasons-text stress-reasons-text--muted">
        Tu n'as pas besoin de tout changer d'un coup. Choisis un seul theme ou une
        seule situation sur laquelle tu as envie de tester quelque chose de different
        cette semaine.
      </p>
    </section>

    <div
      v-if="deleteId"
      class="dialog-backdrop"
      @click.self="cancelDelete"
    >
      <div class="dialog-card stress-delete-card">
        <h3 class="stress-delete-title">Supprimer cette raison ?</h3>
        <p class="stress-delete-text">
          Tu pourras toujours noter de nouvelles raisons plus tard. Est-ce que tu es sur(e) de vouloir la supprimer ?
        </p>
        <div class="stress-delete-actions">
          <button
            type="button"
            class="stress-delete-button stress-delete-button--danger"
            :disabled="props.isSavingReason"
            @click="confirmDelete"
          >
            Supprimer
          </button>
          <button
            type="button"
            class="stress-delete-button"
            @click="cancelDelete"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stress-delete-card {
  padding: 1rem 0.9rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.stress-delete-title {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}

.stress-delete-text {
  margin: 0;
  font-size: 0.9rem;
}

.stress-delete-actions {
  margin-top: 0.4rem;
  display: flex;
  gap: 0.5rem;
}

.stress-delete-button {
  flex: 1;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: transparent;
  color: #e5e7eb;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}

.stress-delete-button--danger {
  border-color: rgba(248, 113, 113, 0.8);
  color: #fecaca;
}

.stress-back-button {
  margin: 0 0 0.75rem;
}

.stress-reasons-title {
  margin: 0 0 0.9rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
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

.stress-filters {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.stress-filter-button {
  border-radius: 999px;
  border: 1px solid #27272a;
  background: transparent;
  color: #e5e7eb;
  padding: 0.25rem 0.8rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.stress-filter-button:hover {
  background: #0b0b0b;
  border-color: #4b5563;
}

.stress-filter-button.is-active {
  background: #22c55e;
  border-color: #22c55e;
  color: #020617;
}

.stress-reasons-list {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.stress-reasons-groups {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.stress-reasons-group-title {
  margin: 0 0 0.3rem;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
  font-weight: 600;
}

.stress-reasons-item {
  padding: 0.7rem 0.8rem;
  border-radius: 0.75rem;
  background: #0b0b0b;
  border: 1px solid #27272a;
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

.stress-reasons-actions {
  margin-top: 0.45rem;
  display: flex;
  gap: 0.4rem;
}

.stress-reasons-action {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: transparent;
  color: #e5e7eb;
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
}

.stress-reasons-action--danger {
  border-color: rgba(248, 113, 113, 0.8);
  color: #fecaca;
}

.stress-reasons-edit-textarea {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #020617;
  color: #e5e7eb;
  padding: 0.6rem 0.7rem;
  font-size: 0.85rem;
  resize: vertical;
}

.stress-reasons-select {
  margin-top: 0.3rem;
  width: 100%;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: #020617;
  color: #e5e7eb;
  padding: 0.35rem 0.7rem;
  font-size: 0.85rem;
}

.stress-category-card {
  padding: 0.7rem 0.8rem;
  margin-top: 0.75rem;
}

.stress-reasons-item {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

.card {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}
</style>
