import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

export interface WeeklySlot {
  dayIndex: number
  timeOfDay: TimeOfDay
}

export function useWeeklySlots(session: Ref<Session | null>) {
  const slots = ref<WeeklySlot[]>([])
  const isWeeklySlotsLoading = ref(false)
  const weeklySlotsError = ref<string | null>(null)

  async function loadWeeklySlots() {
    const userId = session.value?.user?.id

    if (!userId) {
      slots.value = []
      weeklySlotsError.value = null
      return
    }

    isWeeklySlotsLoading.value = true
    weeklySlotsError.value = null

    try {
      const { data, error } = await supabase
        .from('user_weekly_slots')
        .select('day_index, time_of_day')
        .eq('user_id', userId)
        .order('day_index', { ascending: true })

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (!msg.includes('relation "user_weekly_slots" does not exist')) {
          weeklySlotsError.value = "Impossible de charger ton planning de semaine."
          // eslint-disable-next-line no-console
          console.error('Error loading weekly slots', error)
        }
        slots.value = []
        return
      }

      slots.value = (data ?? []).map((row: { day_index: number; time_of_day: string }) => ({
        dayIndex: row.day_index,
        timeOfDay: row.time_of_day as WeeklySlot['timeOfDay'],
      }))
    } finally {
      isWeeklySlotsLoading.value = false
    }
  }

  async function saveWeeklySlots(newSlots: WeeklySlot[]) {
    const userId = session.value?.user?.id
    if (!userId) return

    isWeeklySlotsLoading.value = true
    weeklySlotsError.value = null

    try {
      // strategie simple : on remplace entierement les slots existants
      await supabase.from('user_weekly_slots').delete().eq('user_id', userId)

      if (!newSlots.length) {
        slots.value = []
        return
      }

      const payload = newSlots.map((slot) => ({
        user_id: userId,
        day_index: slot.dayIndex,
        time_of_day: slot.timeOfDay,
      }))

      const { error } = await supabase.from('user_weekly_slots').insert(payload)
      if (error) {
        weeklySlotsError.value = "Impossible d'enregistrer ton planning de semaine."
        // eslint-disable-next-line no-console
        console.error('Error saving weekly slots', error)
        return
      }

      slots.value = [...newSlots]
    } finally {
      isWeeklySlotsLoading.value = false
    }
  }

  watch(
    session,
    () => {
      void loadWeeklySlots()
    },
    { immediate: true },
  )

  return {
    slots,
    isWeeklySlotsLoading,
    weeklySlotsError,
    loadWeeklySlots,
    saveWeeklySlots,
  }
}
