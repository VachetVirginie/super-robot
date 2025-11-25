<script setup lang="ts">
import ProfilePage from './components/ProfilePage.vue'

defineProps<{
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
  onUpdateDisplayName: (value: string) => void
  onSaveDisplayName: () => void | Promise<void>
  onEnableNotifications: () => void | Promise<void>
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
    :is-push-supported="isPushSupported"
    :is-loading-notifications="isLoadingNotifications"
    :notifications-status="notificationsStatus"
    :notifications-error="notificationsError"
    :profile-error="profileError"
    @update:displayName="onUpdateDisplayName"
    @save-display-name="onSaveDisplayName"
    @enable-notifications="onEnableNotifications"
    @sign-out="onSignOut"
    @close="onClose"
  />
</template>
