<script setup lang="ts">
import ProfilePage from './components/ProfilePage.vue'

defineProps<{
  displayName: string
  profileEmail: string
  profileInitial: string
  isProfileLoading: boolean
  isProfileSaving: boolean
  profileError: string | null
  onUpdateDisplayName: (value: string) => void
  onSaveDisplayName: () => void | Promise<void>
  onSignOut: () => void | Promise<void>
  onClose: () => void
}>()
</script>

<template>
  <ProfilePage
    :display-name="displayName"
    :profile-email="profileEmail"
    :profile-initial="profileInitial"
    :is-profile-loading="isProfileLoading"
    :is-profile-saving="isProfileSaving"
    :profile-error="profileError"
    @update:displayName="onUpdateDisplayName"
    @save-display-name="onSaveDisplayName"
    @sign-out="onSignOut"
    @close="onClose"
  />
</template>
