<script setup lang="ts">
const props = defineProps<{
  isPushSupported: boolean
  isLoading: boolean
  status: 'idle' | 'requesting' | 'enabled' | 'error'
  errorMessage: string | null
}>()

const emit = defineEmits<{
  (e: 'enable-notifications'): void
}>()
</script>

<template>
  <section class="notifications-card">
    <h2>Notifications de motivation</h2>
    <p>Active les notifications push pour recevoir des rappels reguliers.</p>
    <button
      type="button"
      :disabled="!props.isPushSupported || props.isLoading || props.status === 'enabled'"
      @click="emit('enable-notifications')"
    >
      <span v-if="props.status === 'enabled'">Notifications activees</span>
      <span v-else-if="props.isLoading">Activation en cours...</span>
      <span v-else>Activer les notifications</span>
    </button>
    <p v-if="!props.isPushSupported" class="info">
      Les notifications push ne sont pas supportees sur ce navigateur.
    </p>
    <p v-if="props.errorMessage" class="error">
      {{ props.errorMessage }}
    </p>
  </section>
</template>

<style scoped>
.notifications-card {
  max-width: 100%;
  width: 100%;
  padding: 1.5rem 1.5rem 1.25rem;
  border-radius: 1rem;
  margin: 0 auto;
  background: #111111;
  border: 1px solid #27272a;
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.notifications-card > h2 {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
