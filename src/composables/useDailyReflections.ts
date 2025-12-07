import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

interface DailyReflectionRow {
  id: string
  day_date: string
  created_at: string
  mindset_note: string | null
  gratitude_note: string | null
}

export function useDailyReflections(session: Ref<Session | null>) {
  const todayReflections = ref<DailyReflectionRow | null>(null)
  const isReflectionsLoading = ref(false)
  const isReflectionsSaving = ref(false)
  const reflectionsError = ref<string | null>(null)

  async function loadTodayReflections() {
    const user = session.value?.user

    if (!user) {
      todayReflections.value = null
      reflectionsError.value = null
      return
    }

    isReflectionsLoading.value = true
    reflectionsError.value = null

    try {
      const todayIso = new Date().toISOString().slice(0, 10)

      const { data, error } = await supabase
        .from('daily_reflections')
        .select('id, day_date, created_at, mindset_note, gratitude_note')
        .eq('user_id', user.id)
        .eq('day_date', todayIso)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (msg.includes('relation "daily_reflections" does not exist')) {
          todayReflections.value = null
          return
        }
        if (!msg.includes('NetworkError when attempting to fetch resource')) {
          reflectionsError.value = "Impossible de charger tes notes du jour."
        }
        return
      }

      const row = (data?.[0] as DailyReflectionRow | undefined) ?? null
      todayReflections.value = row
    } finally {
      isReflectionsLoading.value = false
    }
  }

  async function saveDailyReflections(options: { mindsetNote?: string; gratitudeNote?: string }) {
    const user = session.value?.user

    if (!user) {
      return
    }

    isReflectionsSaving.value = true
    reflectionsError.value = null

    try {
      const todayIso = new Date().toISOString().slice(0, 10)

      const payload: {
        user_id: string
        day_date: string
        mindset_note: string | null
        gratitude_note: string | null
      } = {
        user_id: user.id,
        day_date: todayIso,
        mindset_note:
          typeof options.mindsetNote === 'string' && options.mindsetNote.trim().length
            ? options.mindsetNote.trim()
            : null,
        gratitude_note:
          typeof options.gratitudeNote === 'string' && options.gratitudeNote.trim().length
            ? options.gratitudeNote.trim()
            : null,
      }

      const { error } = await supabase
        .from('daily_reflections')
        .upsert(payload, { onConflict: 'user_id,day_date' })

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (!msg.includes('NetworkError when attempting to fetch resource')) {
          reflectionsError.value = "Impossible d'enregistrer tes notes du jour."
        }
        return
      }

      await loadTodayReflections()
    } finally {
      isReflectionsSaving.value = false
    }
  }

  watch(
    session,
    () => {
      void loadTodayReflections()
    },
    { immediate: true },
  )

  return {
    todayReflections,
    isReflectionsLoading,
    isReflectionsSaving,
    reflectionsError,
    saveDailyReflections,
  }
}
