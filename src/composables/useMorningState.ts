import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

interface MorningStateRow {
  id: string
  day_date: string
  created_at: string
  mood_level: number | null
  energy_level: number | null
  priorities: string[] | null
  sleep_bed_time: string | null
  sleep_wake_time: string | null
}

export function useMorningState(session: Ref<Session | null>) {
  const todayMorningState = ref<MorningStateRow | null>(null)
  const isMorningStateLoading = ref(false)
  const isMorningStateSaving = ref(false)
  const morningStateError = ref<string | null>(null)
  const recentMorningStates = ref<MorningStateRow[]>([])

  async function loadTodayMorningState() {
    const user = session.value?.user

    if (!user) {
      todayMorningState.value = null
      morningStateError.value = null
      return
    }

    isMorningStateLoading.value = true
    morningStateError.value = null

    try {
      const now = new Date()
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('morning_states')
        .select('id, day_date, created_at, mood_level, energy_level, priorities, sleep_bed_time, sleep_wake_time')
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (
          !msg.includes('relation "morning_states" does not exist') &&
          !msg.includes('NetworkError when attempting to fetch resource')
        ) {
          // eslint-disable-next-line no-console
          console.error('Error loading today morning state', error)
        }
        if (msg.includes('relation "morning_states" does not exist')) {
          todayMorningState.value = null
          return
        }
        morningStateError.value = 'Impossible de charger ton etat du matin.'
        return
      }

      const row = (data?.[0] as MorningStateRow | undefined) ?? null
      todayMorningState.value = row
    } finally {
      isMorningStateLoading.value = false
    }
  }

  async function loadRecentMorningStates() {
    const user = session.value?.user

    if (!user) {
      recentMorningStates.value = []
      return
    }

    try {
      const now = new Date()
      const day = now.getDay()
      const diff = (day === 0 ? -6 : 1) - day
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() + diff)
      startOfWeek.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('morning_states')
        .select('id, day_date, created_at, mood_level, energy_level, priorities, sleep_bed_time, sleep_wake_time')
        .eq('user_id', user.id)
        .gte('created_at', startOfWeek.toISOString())
        .lte('created_at', now.toISOString())
        .order('created_at', { ascending: true })

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (
          !msg.includes('relation "morning_states" does not exist') &&
          !msg.includes('NetworkError when attempting to fetch resource')
        ) {
          // eslint-disable-next-line no-console
          console.error('Error loading recent morning states', error)
        }
        if (msg.includes('relation "morning_states" does not exist')) {
          recentMorningStates.value = []
          return
        }
        return
      }

      recentMorningStates.value = (data ?? []) as MorningStateRow[]
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Unexpected error in loadRecentMorningStates', error)
    }
  }

  async function saveMorningState(options: {
    moodLevel: number | null
    energyLevel: number | null
    priorities: string[]
    sleepBedTime: string | null
    sleepWakeTime: string | null
  }) {
    const user = session.value?.user
    if (!user) {
      return
    }

    isMorningStateSaving.value = true
    morningStateError.value = null

    try {
      const payload: {
        user_id: string
        day_date?: string
        mood_level?: number | null
        energy_level?: number | null
        priorities?: string[] | null
        sleep_bed_time?: string | null
        sleep_wake_time?: string | null
      } = {
        user_id: user.id,
      }

      // On enregistre aussi la date du jour pour respecter la contrainte NOT NULL sur day_date.
      const todayIso = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
      payload.day_date = todayIso

      if (typeof options.moodLevel === 'number') {
        payload.mood_level = options.moodLevel
      } else {
        payload.mood_level = null
      }

      if (typeof options.energyLevel === 'number') {
        // On mappe 0–4 -> 1–5 pour rester coherent avec les niveaux de stress
        payload.energy_level = options.energyLevel + 1
      } else {
        payload.energy_level = null
      }

      if (options.priorities && options.priorities.length) {
        payload.priorities = options.priorities
      } else {
        payload.priorities = null
      }

      if (options.sleepBedTime) {
        payload.sleep_bed_time = options.sleepBedTime
      } else {
        payload.sleep_bed_time = null
      }

      if (options.sleepWakeTime) {
        payload.sleep_wake_time = options.sleepWakeTime
      } else {
        payload.sleep_wake_time = null
      }

      const { error } = await supabase
        .from('morning_states')
        .upsert(payload, { onConflict: 'user_id,day_date' })

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (!msg.includes('NetworkError when attempting to fetch resource')) {
          // eslint-disable-next-line no-console
          console.error('Error inserting morning state', error)
        }
        morningStateError.value = "Impossible d'enregistrer ton etat du matin."
        return
      }

      await loadTodayMorningState()
      await loadRecentMorningStates()
    } finally {
      isMorningStateSaving.value = false
    }
  }

  watch(
    session,
    () => {
      void loadTodayMorningState()
      void loadRecentMorningStates()
    },
    { immediate: true },
  )

  const weeklyAverageMorningMood = computed(() => {
    const levels = recentMorningStates.value
      .map((row) => row.mood_level)
      .filter((v): v is number => typeof v === 'number')

    if (!levels.length) {
      return null
    }

    const sum = levels.reduce((acc, value) => acc + value, 0)
    const avg = sum / levels.length
    return Math.round(avg * 10) / 10
  })

  const weeklyAverageMorningEnergy = computed(() => {
    const levels = recentMorningStates.value
      .map((row) => row.energy_level)
      .filter((v): v is number => typeof v === 'number')

    if (!levels.length) {
      return null
    }

    const sum = levels.reduce((acc, value) => acc + value, 0)
    const avg = sum / levels.length
    return Math.round(avg * 10) / 10
  })

  const weeklyMorningPriorities = computed(() => {
    const counts = new Map<string, number>()

    for (const row of recentMorningStates.value) {
      const list = row.priorities ?? []
      for (const key of list) {
        const prev = counts.get(key) ?? 0
        counts.set(key, prev + 1)
      }
    }

    const entries: { key: string; count: number }[] = []
    for (const [key, count] of counts.entries()) {
      if (count > 0) {
        entries.push({ key, count })
      }
    }

    return entries.sort((a, b) => b.count - a.count).slice(0, 3)
  })

  const weeklyAverageSleepBedTime = computed(() => {
    const times = recentMorningStates.value
      .map((row) => row.sleep_bed_time)
      .filter((value): value is string => typeof value === 'string' && value.length >= 4)

    if (!times.length) {
      return null as string | null
    }

    const toMinutes = (value: string) => {
      const [hourStr, minuteStr] = value.slice(0, 5).split(':')
      const hour = Number(hourStr)
      const minute = Number(minuteStr)
      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return null as number | null
      }
      return hour * 60 + minute
    }

    const minutesList = times
      .map(toMinutes)
      .filter((value): value is number => value !== null)

    if (!minutesList.length) {
      return null as string | null
    }

    const sum = minutesList.reduce((acc, value) => acc + value, 0)
    const avg = Math.round(sum / minutesList.length)

    const hours = Math.floor(avg / 60)
    const minutes = avg % 60
    const h = String(hours).padStart(2, '0')
    const m = String(minutes).padStart(2, '0')
    return `${h}:${m}`
  })

  const weeklyAverageSleepDurationMinutes = computed(() => {
    const rows = recentMorningStates.value

    const toMinutes = (value: string | null) => {
      if (typeof value !== 'string' || value.length < 4) return null as number | null
      const [hourStr, minuteStr] = value.slice(0, 5).split(':')
      const hour = Number(hourStr)
      const minute = Number(minuteStr)
      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return null as number | null
      }
      return hour * 60 + minute
    }

    let total = 0
    let count = 0

    for (const row of rows) {
      const bed = toMinutes(row.sleep_bed_time)
      const wake = toMinutes(row.sleep_wake_time)
      if (bed == null || wake == null) continue

      let duration = wake - bed
      if (duration <= 0) {
        duration = 24 * 60 - bed + wake
      }

      total += duration
      count += 1
    }

    if (
      !count &&
      weeklyAverageSleepBedTime.value &&
      weeklyAverageSleepWakeTime.value
    ) {
      const bed = toMinutes(weeklyAverageSleepBedTime.value)
      const wake = toMinutes(weeklyAverageSleepWakeTime.value)
      if (bed != null && wake != null) {
        let duration = wake - bed
        if (duration <= 0) {
          duration = 24 * 60 - bed + wake
        }
        total = duration
        count = 1
      }
    }

    if (count < 2) {
      return null as number | null
    }

    const avgMinutes = Math.round(total / count)
    return avgMinutes
  })

  const weeklyAverageSleepWakeTime = computed(() => {
    const times = recentMorningStates.value
      .map((row) => row.sleep_wake_time)
      .filter((value): value is string => typeof value === 'string' && value.length >= 4)

    if (!times.length) {
      return null as string | null
    }

    const toMinutes = (value: string) => {
      const [hourStr, minuteStr] = value.slice(0, 5).split(':')
      const hour = Number(hourStr)
      const minute = Number(minuteStr)
      if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return null as number | null
      }
      return hour * 60 + minute
    }

    const minutesList = times
      .map(toMinutes)
      .filter((value): value is number => value !== null)

    if (!minutesList.length) {
      return null as string | null
    }

    const sum = minutesList.reduce((acc, value) => acc + value, 0)
    const avg = Math.round(sum / minutesList.length)

    const hours = Math.floor(avg / 60)
    const minutes = avg % 60
    const h = String(hours).padStart(2, '0')
    const m = String(minutes).padStart(2, '0')
    return `${h}:${m}`
  })

  async function getMonthMorningDates(
    year: number,
    monthIndex: number,
  ): Promise<string[]> {
    const user = session.value?.user

    if (!user) {
      return []
    }

    const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0))

    const { data, error } = await supabase
      .from('morning_states')
      .select('day_date, created_at')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())

    if (error) {
      const msg = (error as { message?: string }).message ?? ''
      if (
        !msg.includes('relation "morning_states" does not exist') &&
        !msg.includes('NetworkError when attempting to fetch resource')
      ) {
        // eslint-disable-next-line no-console
        console.error('Error loading month morning states', error)
      }
      return []
    }

    const dates = new Set<string>()

    for (const row of (data ?? []) as { day_date?: string | null; created_at: string }[]) {
      const dayDate =
        typeof row.day_date === 'string' && row.day_date.length >= 10
          ? row.day_date.slice(0, 10)
          : row.created_at.slice(0, 10)
      dates.add(dayDate)
    }

    return Array.from(dates)
  }

  return {
    todayMorningState,
    isMorningStateLoading,
    isMorningStateSaving,
    morningStateError,
    loadTodayMorningState,
    saveMorningState,
    weeklyAverageMorningMood,
    weeklyAverageMorningEnergy,
    weeklyMorningPriorities,
    weeklyAverageSleepBedTime,
    weeklyAverageSleepWakeTime,
    weeklyAverageSleepDurationMinutes,
    recentMorningStates,
    getMonthMorningDates,
  }
}
