import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

export type RitualMoment = 'morning' | 'midday' | 'evening'
export type RitualFocus = 'move' | 'stress' | 'both'

export interface Ritual {
  id: string
  moment: RitualMoment
  focus: RitualFocus
  title: string
  description: string | null
  is_active: boolean
}

export function useRituals(session: Ref<Session | null>) {
  const rituals = ref<Ritual[]>([])
  const isLoadingRituals = ref(false)
  const isSavingRitual = ref(false)
  const ritualsError = ref<string | null>(null)

  async function loadRituals() {
    const user = session.value?.user

    if (!user) {
      rituals.value = []
      ritualsError.value = null
      return
    }

    isLoadingRituals.value = true
    ritualsError.value = null

    try {
      const { data, error } = await supabase
        .from('rituals')
        .select('id, moment, focus, title, description, is_active')
        .eq('user_id', user.id)
        .order('moment', { ascending: true })

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (
          !msg.includes('relation "rituals" does not exist') &&
          !msg.includes('NetworkError when attempting to fetch resource')
        ) {
          // eslint-disable-next-line no-console
          console.error('Error loading rituals', error)
        }
        if (msg.includes('relation "rituals" does not exist')) {
          rituals.value = []
          return
        }
        ritualsError.value = 'Impossible de charger tes rituels.'
        return
      }

      rituals.value = (data ?? []) as Ritual[]
    } finally {
      isLoadingRituals.value = false
    }
  }

  async function upsertRitual(
    moment: RitualMoment,
    payload: { focus: RitualFocus; title: string; description?: string | null; is_active?: boolean },
  ) {
    const user = session.value?.user
    const title = payload.title.trim()
    if (!user || !title) {
      return
    }

    isSavingRitual.value = true
    ritualsError.value = null

    try {
      const existing = rituals.value.find((item) => item.moment === moment)
      const description =
        typeof payload.description === 'string' && payload.description.trim()
          ? payload.description.trim()
          : null
      const body = {
        focus: payload.focus,
        title,
        description,
        is_active: payload.is_active ?? true,
      }

      let error: unknown = null

      if (existing) {
        const result = await supabase
          .from('rituals')
          .update(body)
          .eq('id', existing.id)
          .eq('user_id', user.id)
        error = result.error
      } else {
        const result = await supabase.from('rituals').insert({
          user_id: user.id,
          moment,
          ...body,
        })
        error = result.error
      }

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (!msg.includes('NetworkError when attempting to fetch resource')) {
          // eslint-disable-next-line no-console
          console.error('Error saving ritual', error)
        }
        ritualsError.value = "Impossible d'enregistrer ce rituel."
        return
      }

      await loadRituals()
    } finally {
      isSavingRitual.value = false
    }
  }

  const ritualsByMoment = computed(() => {
    const map: Record<RitualMoment, Ritual | null> = {
      morning: null,
      midday: null,
      evening: null,
    }

    for (const ritual of rituals.value) {
      if (!ritual.is_active) continue
      map[ritual.moment] = ritual
    }

    return map
  })

  watch(
    session,
    () => {
      void loadRituals()
    },
    { immediate: true },
  )

  return {
    rituals,
    ritualsByMoment,
    isLoadingRituals,
    isSavingRitual,
    ritualsError,
    loadRituals,
    upsertRitual,
  }
}
