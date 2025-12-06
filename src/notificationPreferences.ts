import { supabase } from './supabaseClient'

export type NotificationSlotInput = {
  id: string
  label: string
  description: string
  time: string
  enabled: boolean
}

export async function saveNotificationPreferences(slots: NotificationSlotInput[]) {
  const { data, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    // eslint-disable-next-line no-console
    console.error('Error getting session in saveNotificationPreferences', sessionError)
  }

  const user = data.session?.user
  if (!user) {
    throw new Error('USER_NOT_AUTHENTICATED')
  }

  const byId: Record<string, NotificationSlotInput> = {}
  for (const slot of slots) {
    byId[slot.id] = slot
  }

  const morning = byId.morning
  const midday = byId.midday
  const evening = byId.evening

  const payload = {
    user_id: user.id,
    morning_enabled: morning?.enabled ?? false,
    morning_time: morning?.time ?? '08:00',
    midday_enabled: midday?.enabled ?? false,
    midday_time: midday?.time ?? '12:00',
    evening_enabled: evening?.enabled ?? false,
    evening_time: evening?.time ?? '21:30',
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Error saving notification_preferences', error)
    throw error
  }
}
