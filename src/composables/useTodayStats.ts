import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

interface RawSession {
  id: number
  performed_at: string
}

export function useTodayStats(session: Ref<Session | null>) {
  const weeklySessions = ref<number | null>(null)
  const perWeekGoal = ref<number | null>(null)
  const currentGoalId = ref<number | null>(null)
  const isSavingSession = ref(false)
  const latestSessions = ref<RawSession[]>([])
  const weekSessionDates = ref<string[]>([])

  const weeklyProgressPercent = computed(() => {
    if (
      perWeekGoal.value === null ||
      perWeekGoal.value <= 0 ||
      weeklySessions.value === null
    ) {
      return 0
    }
    const ratio = weeklySessions.value / perWeekGoal.value
    return Math.max(0, Math.min(100, Math.round(ratio * 100)))
  })

  const weeklyStatusLabel = computed(() => {
    if (perWeekGoal.value === null || weeklySessions.value === null) {
      return 'Definis un objectif pour cette semaine.'
    }
    if (weeklySessions.value >= perWeekGoal.value) {
      return 'Objectif hebdomadaire atteint.'
    }
    const remaining = perWeekGoal.value - weeklySessions.value
    if (remaining === 1) {
      return "Plus qu'une seance pour atteindre ton objectif."
    }
    return `Plus que ${remaining} seances pour atteindre ton objectif.`
  })

  const latestSessionsDisplay = computed(() =>
    latestSessions.value.map((sessionItem) => {
      const date = new Date(sessionItem.performed_at)
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
      })
    })
  )

  async function ensureUserData(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!profile) {
      await supabase.from('profiles').insert({
        id: userId,
        display_name: session.value?.user?.email ?? null,
      })
    }

    const { data: settings } = await supabase
      .from('notification_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!settings) {
      await supabase.from('notification_settings').insert({
        user_id: userId,
        max_per_day: 3,
      })
    }
  }

  async function loadTodayData(userId: string) {
    const now = new Date()
    const day = now.getDay()
    const diff = (day === 0 ? -6 : 1) - day
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() + diff)
    startOfWeek.setHours(0, 0, 0, 0)

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('id, performed_at')
      .eq('user_id', userId)
      .gte('performed_at', startOfWeek.toISOString())
      .order('performed_at', { ascending: false })

    const allSessions = (sessionsData ?? []) as RawSession[]

    weeklySessions.value = allSessions.length
    latestSessions.value = allSessions.slice(0, 3)

    weekSessionDates.value = allSessions.map(
      (sessionItem) => sessionItem.performed_at.slice(0, 10),
    )

    const { data: goalsData, error: goalError } = await supabase
      .from('goals')
      .select('id, per_week_sessions')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1)

    if (goalError) {
      const msg = (goalError as { message?: string }).message ?? ''
      if (!msg.includes('NetworkError when attempting to fetch resource')) {
        // Simple runtime signal to debug why the weekly goal is not restored
        // eslint-disable-next-line no-console
        console.error('Error loading weekly goal', goalError)
      }
    }

    const goalRow = goalsData?.[0]

    currentGoalId.value = goalRow?.id ?? null
    perWeekGoal.value = goalRow?.per_week_sessions ?? null
  }

  function resetTodayData() {
    weeklySessions.value = null
    perWeekGoal.value = null
    currentGoalId.value = null
    latestSessions.value = []
    weekSessionDates.value = []
  }

  async function syncForCurrentUser() {
    const user = session.value?.user

    if (!user) {
      resetTodayData()
      return
    }

    const userId = user.id
    await ensureUserData(userId)
    await loadTodayData(userId)
  }

  async function recordSession() {
    const user = session.value?.user
    if (!user) {
      return
    }

    isSavingSession.value = true
    const userId = user.id

    try {
      const { error } = await supabase.from('sessions').insert({
        user_id: userId,
      })

      if (!error) {
        await loadTodayData(userId)
      }
    } finally {
      isSavingSession.value = false
    }
  }

  async function removeLastSession() {
    const user = session.value?.user
    if (!user) {
      return
    }

    if (!weeklySessions.value || weeklySessions.value <= 0) {
      return
    }

    const userId = user.id
    let sessionIdToDelete = latestSessions.value[0]?.id

    if (!sessionIdToDelete) {
      const { data } = await supabase
        .from('sessions')
        .select('id, performed_at')
        .eq('user_id', userId)
        .order('performed_at', { ascending: false })
        .limit(1)

      sessionIdToDelete = data?.[0]?.id
    }

    if (!sessionIdToDelete) {
      return
    }

    isSavingSession.value = true

    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionIdToDelete)

      if (!error) {
        await loadTodayData(userId)
      }
    } finally {
      isSavingSession.value = false
    }
  }

  async function changeGoal(delta: number) {
    const user = session.value?.user
    if (!user) {
      return
    }

    const current = perWeekGoal.value ?? 0
    const next = Math.min(14, Math.max(1, current + delta || 1))
    const userId = user.id

    if (currentGoalId.value) {
      const { error } = await supabase
        .from('goals')
        .update({ per_week_sessions: next })
        .eq('id', currentGoalId.value)

      if (!error) {
        perWeekGoal.value = next
      } else {
        // eslint-disable-next-line no-console
        console.error('Error updating weekly goal', error)
      }
      return
    }

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        per_week_sessions: next,
        is_active: true,
      })
      .select('id')
      .single()

    if (!error && data) {
      currentGoalId.value = data.id
      perWeekGoal.value = next
    } else if (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating weekly goal', error)
    }
  }

  async function getMonthSessionDates(
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
      .from('sessions')
      .select('performed_at')
      .eq('user_id', user.id)
      .gte('performed_at', start.toISOString())
      .lt('performed_at', end.toISOString())

    if (error) {
      const msg = (error as { message?: string }).message ?? ''
      if (!msg.includes('NetworkError when attempting to fetch resource')) {
        // eslint-disable-next-line no-console
        console.error('Error loading month sessions', error)
      }
      return []
    }

    return (data ?? []).map(
      (row: { performed_at: string }) => row.performed_at.slice(0, 10),
    )
  }

  watch(
    session,
    () => {
      void syncForCurrentUser()
    },
    { immediate: true }
  )

  return {
    weeklySessions,
    perWeekGoal,
    currentGoalId,
    isSavingSession,
    latestSessionsDisplay,
    weeklyProgressPercent,
    weeklyStatusLabel,
    weekSessionDates,
    getMonthSessionDates,
    recordSession,
    changeGoal,
    removeLastSession,
  }
}
