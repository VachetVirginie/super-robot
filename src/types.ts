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
}

export interface TodaySection {
  key: string
  title: string
  subtitle: string
  progress: number
}
