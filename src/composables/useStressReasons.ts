import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

interface StressReasonRow {
  id: string
  created_at: string
  reason: string | null
  category: string | null
}

export function useStressReasons(session: Ref<Session | null>) {
  const reasons = ref<StressReasonRow[]>([])
  const isLoadingReasons = ref(false)
  const isSavingReason = ref(false)
  const reasonsError = ref<string | null>(null)

  async function loadRecentReasons() {
    const user = session.value?.user

    if (!user) {
      reasons.value = []
      reasonsError.value = null
      return
    }

    isLoadingReasons.value = true
    reasonsError.value = null

    try {
      const { data, error } = await supabase
        .from('stress_reasons')
        .select('id, created_at, reason, category')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (!msg.includes('relation "stress_reasons" does not exist') &&
            !msg.includes('NetworkError when attempting to fetch resource')) {
          // eslint-disable-next-line no-console
          console.error('Error loading stress reasons', error)
        }
        if (msg.includes('relation "stress_reasons" does not exist')) {
          reasons.value = []
          return
        }
        reasonsError.value = 'Impossible de charger tes raisons de stress.'
        return
      }

      reasons.value = (data ?? []) as StressReasonRow[]
    } finally {
      isLoadingReasons.value = false
    }
  }

  async function saveStressReason(reason: string, category?: string | null) {
    const text = reason.trim()
    const user = session.value?.user
    if (!user || !text) {
      return
    }

    isSavingReason.value = true
    reasonsError.value = null

    try {
      const payload: { user_id: string; reason: string; category?: string | null } = {
        user_id: user.id,
        reason: text,
      }

      if (category && category.trim()) {
        payload.category = category.trim()
      }

      const { error } = await supabase.from('stress_reasons').insert(payload)

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (!msg.includes('NetworkError when attempting to fetch resource')) {
          // eslint-disable-next-line no-console
          console.error('Error inserting stress reason', error)
        }
        reasonsError.value = "Impossible d'enregistrer cette raison de stress."
        return
      }

      await loadRecentReasons()
    } finally {
      isSavingReason.value = false
    }
  }

  watch(
    session,
    () => {
      void loadRecentReasons()
    },
    { immediate: true },
  )

  const reasonsCount = computed(() => reasons.value.length)

  async function deleteStressReason(id: string) {
    const user = session.value?.user
    if (!user || !id) {
      return
    }

    reasonsError.value = null

    try {
      const { error } = await supabase
        .from('stress_reasons')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (!msg.includes('NetworkError when attempting to fetch resource')) {
          // eslint-disable-next-line no-console
          console.error('Error deleting stress reason', error)
        }
        reasonsError.value = "Impossible de supprimer cette raison de stress."
        return
      }

      reasons.value = reasons.value.filter((item) => item.id !== id)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unexpected error in deleteStressReason', error)
      reasonsError.value = "Impossible de supprimer cette raison de stress."
    }
  }

  return {
    reasons,
    reasonsCount,
    isLoadingReasons,
    isSavingReason,
    reasonsError,
    loadRecentReasons,
    saveStressReason,
    deleteStressReason,
  }
}
