import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

interface CheckinRow {
  id: string
  created_at: string
  stress_level: number | null
  note: string | null
}

export function useCheckins(session: Ref<Session | null>) {
  const todayCheckin = ref<CheckinRow | null>(null)
  const isCheckinLoading = ref(false)
  const isCheckinSaving = ref(false)
  const checkinError = ref<string | null>(null)
  const recentCheckins = ref<CheckinRow[]>([])

  async function loadTodayCheckin() {
    const user = session.value?.user

    if (!user) {
      todayCheckin.value = null
      checkinError.value = null
      return
    }

    isCheckinLoading.value = true
    checkinError.value = null

    try {
      const now = new Date()
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('wellbeing_checkins')
        .select('id, created_at, stress_level, note')
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (!msg.includes('relation "wellbeing_checkins" does not exist') &&
            !msg.includes('NetworkError when attempting to fetch resource')) {
          // eslint-disable-next-line no-console
          console.error('Error loading today checkin', error)
        }
        if (msg.includes('relation "wellbeing_checkins" does not exist')) {
          todayCheckin.value = null
          return
        }
        checkinError.value = 'Impossible de charger ton check-in du jour.'
        return
      }

      const row = (data?.[0] as CheckinRow | undefined) ?? null
      todayCheckin.value = row
    } finally {
      isCheckinLoading.value = false
    }
  }

  async function loadRecentCheckins() {
    const user = session.value?.user

    if (!user) {
      recentCheckins.value = []
      return
    }

    try {
      const now = new Date()
      const start = new Date(now)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('wellbeing_checkins')
        .select('id, created_at, stress_level, note')
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', now.toISOString())
        .order('created_at', { ascending: true })

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (
          !msg.includes('relation "wellbeing_checkins" does not exist') &&
          !msg.includes('NetworkError when attempting to fetch resource')
        ) {
          // eslint-disable-next-line no-console
          console.error('Error loading recent checkins', error)
        }
        if (msg.includes('relation "wellbeing_checkins" does not exist')) {
          recentCheckins.value = []
          return
        }
        return
      }

      recentCheckins.value = (data ?? []) as CheckinRow[]
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unexpected error in loadRecentCheckins', error)
    }
  }

  async function recordCheckin(stressLevel: number, note?: string) {
    const user = session.value?.user
    if (!user) {
      return
    }

    isCheckinSaving.value = true
    checkinError.value = null

    try {
      const { error } = await supabase.from('wellbeing_checkins').insert({
        user_id: user.id,
        stress_level: stressLevel,
        note: note ?? null,
      })

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (!msg.includes('NetworkError when attempting to fetch resource')) {
          // eslint-disable-next-line no-console
          console.error('Error inserting checkin', error)
        }
        checkinError.value = "Impossible d'enregistrer ton check-in."
        return
      }

      await loadTodayCheckin()
      await loadRecentCheckins()
    } finally {
      isCheckinSaving.value = false
    }
  }

  watch(
    session,
    () => {
      void loadTodayCheckin()
      void loadRecentCheckins()
    },
    { immediate: true },
  )

  const weeklyAverageStress = computed(() => {
    const levels = recentCheckins.value
      .map((c) => c.stress_level)
      .filter((v): v is number => typeof v === 'number')

    if (!levels.length) {
      return null
    }

    const sum = levels.reduce((acc, value) => acc + value, 0)
    const avg = sum / levels.length
    return Math.round(avg * 10) / 10
  })

  const weeklyCheckinsCount = computed(() => recentCheckins.value.length)

  return {
    todayCheckin,
    isCheckinLoading,
    isCheckinSaving,
    checkinError,
    recordCheckin,
    weeklyAverageStress,
    weeklyCheckinsCount,
  }
}
