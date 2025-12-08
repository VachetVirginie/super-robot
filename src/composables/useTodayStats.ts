import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'
import { WORKOUT_TEMPLATES } from '../workoutCatalog'

interface RawSession {
  id: number
  performed_at: string
  duration_minutes: number | null
  kind: string | null
  template_key: string | null
}

export interface RecordSessionOptions {
  durationMinutes?: number | null
  kind?: string | null
  templateKey?: string | null
}

export interface LatestSessionDetail {
  id: number
  dateLabel: string
  kindLabel: string | null
  durationLabel: string | null
  templateKey: string | null
  templateName: string | null
  fullLabel: string
}

export function useTodayStats(session: Ref<Session | null>) {
  const weeklySessions = ref<number | null>(null)
  const perWeekGoal = ref<number | null>(null)
  const currentGoalId = ref<number | null>(null)
  const isSavingSession = ref(false)
  const latestSessions = ref<RawSession[]>([])
  const weekSessionDates = ref<string[]>([])
  const weeklyMinutes = ref<number | null>(null)
  const weeklyActiveDays = ref<number | null>(null)
  const weeklyByKind = ref<Record<string, { sessions: number; minutes: number }>>({})
  const weeklyMovementByDay = ref<Record<string, { duration: number; count: number }>>({})

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

  const latestSessionsDetail = computed<LatestSessionDetail[]>(() => {
    const kindLabels: Record<string, string> = {
      cardio: 'Cardio leger',
      strength: 'Renfo',
      mobility: 'Mobilite',
      mixed: 'Mixte',
      jump: 'Corde à sauter',
      stretch: 'Flexibilite',
      yoga: 'Yoga',
      rowing: 'Rameur',
      other: 'Autre',
    }

    return latestSessions.value.map((sessionItem) => {
      const date = new Date(sessionItem.performed_at)
      const dateLabel = date
        .toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          timeZone: 'Europe/Paris',
        })
        .replace('.', '')

      const minutes =
        typeof sessionItem.duration_minutes === 'number' && sessionItem.duration_minutes > 0
          ? sessionItem.duration_minutes
          : null
      const durationLabel = minutes !== null ? `${minutes} min` : null

      const kindKey = sessionItem.kind ?? 'other'
      const kindLabel = kindLabels[kindKey] ?? null

      const templateKey = sessionItem.template_key
      const template =
        templateKey != null
          ? WORKOUT_TEMPLATES.find((tpl) => tpl.key === templateKey) ?? null
          : null
      const templateName = template?.name ?? null

      const parts: string[] = [dateLabel]

      if (templateName) {
        parts.push(templateName)
      } else if (kindLabel) {
        parts.push(kindLabel)
      }

      if (!templateName && durationLabel) {
        parts.push(durationLabel)
      }

      const fullLabel = parts.join(' · ')

      return {
        id: sessionItem.id,
        dateLabel,
        kindLabel,
        durationLabel,
        templateKey,
        templateName,
        fullLabel,
      }
    })
  })

  const latestSessionsDisplay = computed(() =>
    latestSessionsDetail.value.map((item) => item.fullLabel),
  )

  async function ensureUserData(userId: string) {
    const user = session.value?.user

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle()

    if (!user) {
      return
    }

    const emailLocalPart =
      typeof user.email === 'string' ? user.email.split('@')[0] ?? '' : ''
    const cleanedLocalPart = emailLocalPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    const idSuffix = user.id.replace(/-/g, '').slice(0, 4)
    const base = cleanedLocalPart || 'athlete'
    const generatedUsername = `${base}-${idSuffix || '0000'}`

    const hasUsername = (profile as { username?: string | null } | null)?.username

    if (!profile) {
      await supabase.from('profiles').insert({
        id: userId,
        display_name: user.email ?? null,
        username: generatedUsername,
      })
    } else if (!hasUsername) {
      await supabase
        .from('profiles')
        .update({ username: generatedUsername })
        .eq('id', userId)
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
      .select('id, performed_at, duration_minutes, kind, template_key')
      .eq('user_id', userId)
      .gte('performed_at', startOfWeek.toISOString())
      .order('performed_at', { ascending: false })

    const allSessions = (sessionsData ?? []) as RawSession[]

    weeklySessions.value = allSessions.length
    latestSessions.value = allSessions.slice(0, 3)

    const movementByDay: Record<string, { duration: number; count: number }> = {}

    weekSessionDates.value = allSessions.map((sessionItem) => {
      const d = new Date(sessionItem.performed_at)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const dayNum = String(d.getDate()).padStart(2, '0')
      const iso = `${year}-${month}-${dayNum}`

      const minutes =
        typeof sessionItem.duration_minutes === 'number' &&
        sessionItem.duration_minutes > 0
          ? sessionItem.duration_minutes
          : 0

      const entry = movementByDay[iso] ?? { duration: 0, count: 0 }
      entry.duration += minutes
      entry.count += 1
      movementByDay[iso] = entry

      return iso
    })

    weeklyMovementByDay.value = movementByDay

    const uniqueDates = Array.from(new Set(weekSessionDates.value))

    weeklyActiveDays.value = uniqueDates.length

    let totalMinutes = 0

    const byKindMap = new Map<string, { sessions: number; minutes: number }>()

    for (const sessionItem of allSessions) {
      const minutes =
        typeof sessionItem.duration_minutes === 'number' && sessionItem.duration_minutes > 0
          ? sessionItem.duration_minutes
          : 0

      if (minutes > 0) {
        totalMinutes += minutes
      }

      const kindKey = sessionItem.kind ?? 'other'

      const existing = byKindMap.get(kindKey) ?? { sessions: 0, minutes: 0 }

      existing.sessions += 1

      if (minutes > 0) {
        existing.minutes += minutes
      }

      byKindMap.set(kindKey, existing)
    }

    weeklyMinutes.value = totalMinutes

    const byKind: Record<string, { sessions: number; minutes: number }> = {}

    for (const [kindKey, agg] of byKindMap.entries()) {
      byKind[kindKey] = agg
    }

    weeklyByKind.value = byKind

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
    weeklyMinutes.value = null
    weeklyActiveDays.value = null
    weeklyByKind.value = {}
    weeklyMovementByDay.value = {}
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

  async function recordSession(options?: RecordSessionOptions) {
    const user = session.value?.user
    if (!user) {
      return
    }

    isSavingSession.value = true
    const userId = user.id

    try {
      const payload: {
        user_id: string
        duration_minutes?: number | null
        kind?: string | null
        template_key?: string | null
      } = {
        user_id: userId,
      }

      if (typeof options?.durationMinutes === 'number') {
        payload.duration_minutes = options.durationMinutes
      }

      if (options?.kind) {
        payload.kind = options.kind
      }

      if (options?.templateKey) {
        payload.template_key = options.templateKey
      }

      const { error } = await supabase.from('sessions').insert(payload)

      if (!error) {
        await loadTodayData(userId)
      }
    } finally {
      isSavingSession.value = false
    }
  }

  async function recordSessionForDate(isoDate: string) {
    const user = session.value?.user
    if (!user) {
      return
    }

    const [yearStr, monthStr, dayStr] = isoDate.split('-')
    const year = Number(yearStr)
    const monthIndex = Number(monthStr) - 1
    const day = Number(dayStr)

    if (Number.isNaN(year) || Number.isNaN(monthIndex) || Number.isNaN(day)) {
      return
    }

    // On positionne la séance à midi heure locale pour éviter les effets de fuseau
    const localDate = new Date(year, monthIndex, day, 12, 0, 0, 0)
    const performedAt = localDate.toISOString()

    const userId = user.id
    isSavingSession.value = true

    try {
      const { error } = await supabase.from('sessions').insert({
        user_id: userId,
        performed_at: performedAt,
      })

      if (!error) {
        await loadTodayData(userId)
      } else {
        const msg = (error as { message?: string }).message ?? ''
        if (!msg.includes('NetworkError when attempting to fetch resource')) {
          // eslint-disable-next-line no-console
          console.error('Error inserting session for specific date', error)
        }
      }
    } finally {
      isSavingSession.value = false
    }
  }

  async function removeSessionForDate(isoDate: string) {
    const user = session.value?.user
    if (!user) {
      return
    }

    // Si aucune séance n'est connue pour ce jour dans le cache, on ne fait rien
    if (!weekSessionDates.value.includes(isoDate)) {
      return
    }

    const [yearStr, monthStr, dayStr] = isoDate.split('-')
    const year = Number(yearStr)
    const monthIndex = Number(monthStr) - 1
    const day = Number(dayStr)

    if (Number.isNaN(year) || Number.isNaN(monthIndex) || Number.isNaN(day)) {
      return
    }

    const start = new Date(year, monthIndex, day, 0, 0, 0, 0)
    const end = new Date(year, monthIndex, day + 1, 0, 0, 0, 0)

    const userId = user.id
    isSavingSession.value = true

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, performed_at')
        .eq('user_id', userId)
        .gte('performed_at', start.toISOString())
        .lt('performed_at', end.toISOString())
        .order('performed_at', { ascending: false })
        .limit(1)

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (!msg.includes('NetworkError when attempting to fetch resource')) {
          // eslint-disable-next-line no-console
          console.error('Error loading sessions for specific date', error)
        }
        return
      }

      const sessionIdToDelete = data?.[0]?.id
      if (!sessionIdToDelete) {
        return
      }

      const { error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionIdToDelete)

      if (deleteError) {
        const msg = (deleteError as { message?: string }).message ?? ''
        if (!msg.includes('NetworkError when attempting to fetch resource')) {
          // eslint-disable-next-line no-console
          console.error('Error deleting session for specific date', deleteError)
        }
        return
      }

      await loadTodayData(userId)
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
    { immediate: true },
  )

  return {
    weeklySessions,
    perWeekGoal,
    currentGoalId,
    isSavingSession,
    latestSessions,
    weekSessionDates,
    weeklyMinutes,
    weeklyActiveDays,
    weeklyByKind,
     weeklyMovementByDay,
    weeklyProgressPercent,
    weeklyStatusLabel,
    latestSessionsDisplay,
    latestSessionsDetail,
    recordSession,
    removeLastSession,
    recordSessionForDate,
    removeSessionForDate,
    changeGoal,
    getMonthSessionDates,
  }
}
