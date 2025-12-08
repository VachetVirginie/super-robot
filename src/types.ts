export interface WellbeingExercise {
  key: string
  title: string
  description: string
  durationMinutes: number
  audioUrl: string
}

export interface CalendarCell {
  key: string
  date: number | null
  isToday: boolean
  hasSession: boolean
  iso?: string | null
  hasCheckin?: boolean
  hasMorning?: boolean
  stressLevel?: number | null
}

export interface TodaySection {
  key: string
  title: string
  subtitle: string
  progress: number
}
