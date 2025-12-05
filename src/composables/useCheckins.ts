import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

interface CheckinRow {
  id: string
  created_at: string
  stress_level: number | null
  note: string | null
  question: string | null
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
        .select('id, created_at, stress_level, note, question')
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

  async function recordCheckin(stressLevel: number, note?: string, question?: string) {
    const user = session.value?.user
    if (!user) {
      return
    }

    const now = new Date()
    const dayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')}`

    isCheckinSaving.value = true
    checkinError.value = null

    try {
      const { error } = await supabase.from('wellbeing_checkins').insert({
        user_id: user.id,
        day: dayIso,
        stress_level: stressLevel,
        note: note ?? null,
        question: question ?? null,
      })

      if (error) {
        const msg = (error as { message?: string; code?: string }).message ?? ''
        const code = (error as { code?: string }).code ?? ''

        // Contrainte d'unicite : un check-in par jour.
        // Si on a deja un check-in pour aujourd'hui, on met simplement a jour la ligne existante.
        if (code === '23505' || msg.includes('wellbeing_checkins_user_day_unique')) {
          const { data: existingRows, error: selectError } = await supabase
            .from('wellbeing_checkins')
            .select('id')
            .eq('user_id', user.id)
            .eq('day', dayIso)
            .limit(1)

          if (!selectError && existingRows && existingRows.length) {
            const existing = existingRows[0] as { id: string }
            const { error: updateError } = await supabase
              .from('wellbeing_checkins')
              .update({
                stress_level: stressLevel,
                note: note ?? null,
                question: question ?? null,
              })
              .eq('id', existing.id)

            if (updateError) {
              // eslint-disable-next-line no-console
              console.error('Error updating existing checkin', updateError)
              checkinError.value = "Impossible d'enregistrer ton check-in."
              return
            }

            await loadTodayCheckin()
            await loadRecentCheckins()
            return
          }

          // Si on ne retrouve pas la ligne, on logue et on retombe sur le flux derreur standard.
          if (selectError) {
            // eslint-disable-next-line no-console
            console.error('Error selecting existing checkin after duplicate constraint', selectError)
          }
        }

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

  async function getMonthStressByDay(
    year: number,
    monthIndex: number,
  ): Promise<Record<string, { avg: number; count: number }>> {
    const user = session.value?.user

    if (!user) {
      return {}
    }

    const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0))

    const { data, error } = await supabase
      .from('wellbeing_checkins')
      .select('created_at, stress_level')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())

    if (error) {
      const msg = (error as { message?: string }).message ?? ''
      if (
        !msg.includes('relation "wellbeing_checkins" does not exist') &&
        !msg.includes('NetworkError when attempting to fetch resource')
      ) {
        // eslint-disable-next-line no-console
        console.error('Error loading month stress checkins', error)
      }
      return {}
    }

    const buckets = new Map<string, number[]>()

    for (const row of (data ?? []) as { created_at: string; stress_level: number | null }[]) {
      if (typeof row.stress_level !== 'number') continue
      const iso = row.created_at.slice(0, 10)
      const list = buckets.get(iso) ?? []
      list.push(row.stress_level)
      buckets.set(iso, list)
    }

    const result: Record<string, { avg: number; count: number }> = {}
    for (const [iso, values] of buckets.entries()) {
      if (!values.length) continue
      const sum = values.reduce((acc, value) => acc + value, 0)
      const avg = sum / values.length
      result[iso] = {
        avg: Math.round(avg * 10) / 10,
        count: values.length,
      }
    }

    return result
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

  const weeklyStressByDay = computed(() => {
    const buckets = new Map<string, number[]>()

    for (const row of recentCheckins.value) {
      if (typeof row.stress_level !== 'number') continue
      const iso = row.created_at.slice(0, 10)
      const list = buckets.get(iso) ?? []
      list.push(row.stress_level)
      buckets.set(iso, list)
    }

    const result: Record<string, { avg: number; count: number }> = {}

    for (const [iso, values] of buckets.entries()) {
      if (!values.length) continue
      const sum = values.reduce((acc, value) => acc + value, 0)
      const avg = sum / values.length
      result[iso] = {
        avg: Math.round(avg * 10) / 10,
        count: values.length,
      }
    }

    return result
  })

  return {
    todayCheckin,
    isCheckinLoading,
    isCheckinSaving,
    checkinError,
    recordCheckin,
    weeklyAverageStress,
    weeklyCheckinsCount,
    weeklyStressByDay,
    getMonthStressByDay,
  }
}
