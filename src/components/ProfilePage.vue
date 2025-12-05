<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  displayName: string
  profileEmail: string
  profileInitial: string
  isProfileLoading: boolean
  isProfileSaving: boolean
  isPushSupported: boolean
  isLoadingNotifications: boolean
  notificationsStatus: 'idle' | 'requesting' | 'enabled' | 'error'
  notificationsError: string | null
  profileError: string | null
  onOpenWeekPlan: () => void
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:displayName', value: string): void
  (e: 'save-display-name'): void
  (e: 'enable-notifications'): void
  (e: 'sign-out'): void
}>()

const heroName = computed(() => {
  if (props.displayName?.trim()) return props.displayName
  if (props.profileEmail?.trim()) return props.profileEmail
  return 'Athlete'
})

function onInputDisplayName(event: Event) {
  const target = event.target as HTMLInputElement | null
  emit('update:displayName', target?.value ?? '')
}
</script>

<template>
  <div class="profile-page">
    <div class="profile-page-inner">
      <header class="profile-header">
        <button
          type="button"
          class="icon-button profile-back"
          @click="emit('close')"
        >
          <i class="pi pi-chevron-left" aria-hidden="true"></i>
        </button>
        <span class="profile-header-spacer"></span>
      </header>

      <section class="card profile-main-card">
        <div class="profile-hero">
          <div class="profile-hero-avatar">
            <span class="profile-hero-initial">
              {{ profileInitial }}
            </span>
          </div>
          <h3 class="profile-hero-name">
            {{ heroName }}
          </h3>
          <p v-if="profileEmail" class="profile-hero-email">
            {{ profileEmail }}
          </p>
        </div>

        <div class="profile-section profile-section--pseudo">
          <h4 class="profile-section-title">Pseudo</h4>
          <input
            :value="displayName"
            type="text"
            class="input profile-input"
            placeholder="Ton pseudo"
            :disabled="isProfileLoading || isProfileSaving"
            @input="onInputDisplayName"
          />
          <button
            type="button"
            class="primary profile-save"
            :disabled="isProfileSaving || isProfileLoading"
            @click="emit('save-display-name')"
          >
            <span v-if="isProfileSaving">Enregistrement...</span>
            <span v-else>Enregistrer le pseudo</span>
          </button>
        </div>

        <div class="profile-section">
          <h4 class="profile-section-title">Notifications</h4>
          <button
            type="button"
            class="secondary profile-notif"
            :disabled="
              !isPushSupported ||
              isLoadingNotifications ||
              notificationsStatus === 'enabled'
            "
            @click="emit('enable-notifications')"
          >
            <span v-if="notificationsStatus === 'enabled'">
              Notifications activees
            </span>
            <span v-else-if="isLoadingNotifications">
              Activation en cours...
            </span>
            <span v-else>Activer les notifications</span>
          </button>
          <p v-if="!isPushSupported" class="info">
            Les notifications push ne sont pas supportees sur ce navigateur.
          </p>
          <p v-if="notificationsError" class="error">
            {{ notificationsError }}
          </p>
        </div>

        <div class="profile-section">
          <h4 class="profile-section-title">Mes créneaux d’entraînement</h4>
          <button
            type="button"
            class="secondary profile-planning"
            @click="props.onOpenWeekPlan()"
          >
            Configurer ma semaine
          </button>
        </div>

        <div class="profile-section">
          <h4 class="profile-section-title">Compte</h4>
          <button
            type="button"
            class="secondary profile-signout"
            @click="emit('sign-out')"
          >
            Se deconnecter
          </button>
        </div>

        <p v-if="profileError" class="error">
          {{ profileError }}
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  position: fixed;
  inset: 0;
  z-index: 35;
  background: radial-gradient(circle at top, #020617, #020617 40%, #000000);
  display: flex;
  justify-content: center;
  overflow-y: auto;
}
.profile-page-inner {
  width: 100%;
  max-width: 420px;
  padding: 1.25rem 1.25rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.profile-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
}
.profile-main-card {
  margin-top: 0.25rem;
}
.profile-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  text-align: center;
}
.profile-hero-avatar {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 999px;
  background: radial-gradient(circle at top left, #16a34a, #22c55e);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16px 32px rgba(22, 163, 74, 0.65);
}
.profile-hero-initial {
  font-size: 1.2rem;
  font-weight: 700;
  color: #020617;
}
.profile-hero-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}
.profile-hero-email {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.8;
}
.profile-hero-edit {
  margin-top: 0.75rem;
}
.profile-section {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.profile-section-title {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
  font-weight: 600;
}
.profile-input {
  width: 100%;
  padding: 0.65rem 1rem;
  border-radius: 999px;
  border: 1px solid #4b5563;
  background: #020617;
  font-size: 0.95rem;
}
.profile-input:focus-visible {
  outline: 2px solid #22c55e;
  outline-offset: 2px;
  border-color: transparent;
}
.profile-save,
.profile-notif,
.profile-signout {
  margin-top: 0.25rem;
}
</style>
