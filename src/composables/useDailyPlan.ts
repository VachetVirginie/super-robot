import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

export type TodaySlot = 'morning' | 'noon' | 'afternoon' | 'evening' | 'unknown'

export type DailyIntention = 'calme' | 'detente' | 'mobilite' | 'presence' | 'none'

interface DailySlotRow {
  slot: string | null
  created_at: string
}

interface DailyIntentionRow {
  intention: string | null
  created_at: string
}

export function useDailyPlan(session: Ref<Session | null>) {
  const todaySlot = ref<TodaySlot | null>(null)
  const todayIntention = ref<DailyIntention | null>(null)
  const isDailyPlanLoading = ref(false)
  const isDailyPlanSaving = ref(false)
  const dailyPlanError = ref<string | null>(null)

  async function loadDailyPlan() {
    const user = session.value?.user

    if (!user) {
      todaySlot.value = null
      todayIntention.value = null
      dailyPlanError.value = null
      return
    }

    isDailyPlanLoading.value = true
    dailyPlanError.value = null

    try {
      const now = new Date()
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)

      try {
        const { data, error } = await supabase
          .from('daily_slots')
          .select('slot, created_at')
          .eq('user_id', user.id)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          const msg = (error as { message?: string }).message ?? ''
          if (
            !msg.includes('relation "daily_slots" does not exist') &&
            !msg.includes('NetworkError when attempting to fetch resource')
          ) {
            // eslint-disable-next-line no-console
            console.error('Error loading daily slot', error)
          }
          if (!msg.includes('relation "daily_slots" does not exist')) {
            dailyPlanError.value = 'Impossible de charger ton plan du jour.'
          }
        } else {
          const row = (data?.[0] as DailySlotRow | undefined) ?? null
          const value = row?.slot ?? null
          if (
            value === 'morning' ||
            value === 'noon' ||
            value === 'afternoon' ||
            value === 'evening' ||
            value === 'unknown'
          ) {
            todaySlot.value = value
          } else {
            todaySlot.value = null
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Unexpected error loading daily slot', error)
      }

      try {
        const { data, error } = await supabase
          .from('daily_intentions')
          .select('intention, created_at')
          .eq('user_id', user.id)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          const msg = (error as { message?: string }).message ?? ''
          if (
            !msg.includes('relation "daily_intentions" does not exist') &&
            !msg.includes('NetworkError when attempting to fetch resource')
          ) {
            // eslint-disable-next-line no-console
            console.error('Error loading daily intention', error)
          }
          if (!msg.includes('relation "daily_intentions" does not exist')) {
            dailyPlanError.value = 'Impossible de charger ton plan du jour.'
          }
        } else {
          const row = (data?.[0] as DailyIntentionRow | undefined) ?? null
          const value = row?.intention ?? null
          if (
            value === 'calme' ||
            value === 'detente' ||
            value === 'mobilite' ||
            value === 'presence' ||
            value === 'none'
          ) {
            todayIntention.value = value
          } else {
            todayIntention.value = null
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Unexpected error loading daily intention', error)
      }
    } finally {
      isDailyPlanLoading.value = false
    }
  }

  async function saveDailyPlan(options: { slot: TodaySlot; intention: DailyIntention }) {
    const user = session.value?.user
    if (!user) {
      return
    }

    isDailyPlanSaving.value = true
    dailyPlanError.value = null

    try {
      const slotPromise = supabase.from('daily_slots').insert({
        user_id: user.id,
        slot: options.slot,
      })

      const intentionPromise = supabase.from('daily_intentions').insert({
        user_id: user.id,
        intention: options.intention,
      })

      const [slotResult, intentionResult] = await Promise.all([slotPromise, intentionPromise])

      if (slotResult.error) {
        const msg = (slotResult.error as { message?: string }).message ?? ''
        if (!msg.includes('NetworkError when attempting to fetch resource')) {
          // eslint-disable-next-line no-console
          console.error('Error saving daily slot', slotResult.error)
        }
        dailyPlanError.value = "Impossible d'enregistrer ton plan du jour."
      } else {
        todaySlot.value = options.slot
      }

      if (intentionResult.error) {
        const msg = (intentionResult.error as { message?: string }).message ?? ''
        if (!msg.includes('NetworkError when attempting to fetch resource')) {
          // eslint-disable-next-line no-console
          console.error('Error saving daily intention', intentionResult.error)
        }
        dailyPlanError.value = "Impossible d'enregistrer ton plan du jour."
      } else {
        todayIntention.value = options.intention
      }
    } finally {
      isDailyPlanSaving.value = false
    }
  }

  watch(
    session,
    () => {
      void loadDailyPlan()
    },
    { immediate: true },
  )

  return {
    todaySlot,
    todayIntention,
    isDailyPlanLoading,
    isDailyPlanSaving,
    dailyPlanError,
    loadDailyPlan,
    saveDailyPlan,
  }
}
