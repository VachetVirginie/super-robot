<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from './supabaseClient'

const router = useRouter()

const newPassword = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const message = ref<string | null>(null)

async function onSubmit() {
  if (!newPassword.value || !confirmPassword.value) {
    error.value = 'Merci de saisir et confirmer ton nouveau mot de passe.'
    return
  }

  if (newPassword.value.length < 6) {
    error.value = 'Ton mot de passe doit contenir au moins 6 caracteres.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Les deux mots de passe ne correspondent pas.'
    return
  }

  error.value = null
  message.value = null
  isSubmitting.value = true

  try {
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword.value,
    })

    if (updateError) {
      error.value =
        'Impossible de mettre a jour ton mot de passe. Le lien a peut-etre expire.'
      return
    }

    message.value =
      'Ton mot de passe a ete mis a jour. Tu peux maintenant continuer dans OLVIUS.'
  } finally {
    isSubmitting.value = false
  }
}

function goHome() {
  router.push({ name: 'today' })
}
</script>

<template>
  <section class="card reset-card">
    <h2 class="reset-title">Choisir un nouveau mot de passe</h2>
    <p class="reset-text">
      On met a jour ton mot de passe pour ce compte. Tu pourras ensuite revenir a
      ta journee normalement.
    </p>

    <form class="reset-form" @submit.prevent="onSubmit">
      <input
        v-model="newPassword"
        type="password"
        class="reset-input"
        placeholder="Nouveau mot de passe"
        autocomplete="new-password"
      />
      <input
        v-model="confirmPassword"
        type="password"
        class="reset-input"
        placeholder="Confirmer le mot de passe"
        autocomplete="new-password"
      />
      <button type="submit" class="primary" :disabled="isSubmitting">
        <span v-if="isSubmitting">Mise a jour...</span>
        <span v-else>Mettre a jour mon mot de passe</span>
      </button>
    </form>

    <p v-if="message" class="reset-info">
      {{ message }}
    </p>
    <p v-if="error" class="reset-error">
      {{ error }}
    </p>

    <button type="button" class="link reset-back" @click="goHome">
      Revenir a l'accueil
    </button>
  </section>
</template>

<style scoped>
.reset-card {
  margin-top: 0.75rem;
}

.reset-title {
  margin: 0 0 0.9rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.reset-text {
  margin: 0;
  font-size: 0.9rem;
}

.reset-form {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reset-input {
  padding: 0.6rem 0.8rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 1rem;
  background: #020617;
  color: #e5e7eb;
}

.reset-info {
  margin-top: 1rem;
  font-size: 0.9rem;
}

.reset-error {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #ff6b6b;
}

.reset-back {
  margin-top: 0.75rem;
}
</style>
