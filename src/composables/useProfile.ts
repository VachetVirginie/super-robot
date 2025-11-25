import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

export function useProfile(session: Ref<Session | null>) {
  const displayName = ref('')
  const isProfileLoading = ref(false)
  const isProfileSaving = ref(false)
  const profileError = ref<string | null>(null)

  async function loadProfile() {
    const user = session.value?.user

    if (!user) {
      displayName.value = ''
      profileError.value = null
      return
    }

    isProfileLoading.value = true
    profileError.value = null

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        profileError.value = "Impossible de charger ton profil."
        return
      }

      const row = data as
        | {
            display_name?: string | null
            username?: string | null
          }
        | null

      const username = row?.username ?? null
      const name = row?.display_name ?? null

      if (username && username.trim()) {
        displayName.value = username
      } else if (name && name.trim()) {
        displayName.value = name
      } else {
        displayName.value = user.email ?? ''
      }
    } finally {
      isProfileLoading.value = false
    }
  }

  async function saveDisplayName() {
    const user = session.value?.user
    if (!user) {
      return
    }

    isProfileSaving.value = true
    profileError.value = null

    try {
      const trimmed = displayName.value.trim() || null

      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            display_name: trimmed,
            username: trimmed,
          },
          { onConflict: 'id' },
        )

      if (error) {
        const code = (error as { code?: string }).code
        if (code === '23505') {
          profileError.value = 'Ce pseudo est deja pris.'
        } else {
          profileError.value = 'Impossible denregistrer le pseudo.'
        }
      }
    } finally {
      isProfileSaving.value = false
    }
  }

  const profileInitial = computed(() => {
    const name = displayName.value?.trim()
    if (name) {
      return name.charAt(0).toUpperCase()
    }

    const user = session.value?.user
    const email = typeof user?.email === 'string' ? user.email : ''
    if (email) {
      return email.charAt(0).toUpperCase()
    }

    return 'S'
  })

  watch(
    session,
    () => {
      void loadProfile()
    },
    { immediate: true },
  )

  return {
    displayName,
    isProfileLoading,
    isProfileSaving,
    profileError,
    saveDisplayName,
    profileInitial,
  }
}
