/**
 * Get the Monday of the week for a given date
 */
export function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * Format duration in seconds to "Xu Ym Zs" format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours}u ${minutes}m ${secs}s`
}

/**
 * Format duration in seconds to "Xu Ym" format (without seconds)
 */
export function formatDurationHoursMinutes(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}u ${minutes}m`
}

/**
 * Calculate total hours between check-in and check-out
 * Returns 0 if check-out is null
 */
export function calculateHours(
  checkIn: string,
  checkOut: string | null
): number {
  if (!checkOut) return 0
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  return diff / (1000 * 60 * 60) // Convert milliseconds to hours
}

/**
 * Format date in Dutch locale
 * Example: "Maandag 5 februari 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format time in Dutch locale (HH:mm)
 * Example: "10:15"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}
