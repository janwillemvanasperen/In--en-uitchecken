/**
 * Check if current time is within schedule time range
 * @param currentTime The current date/time
 * @param scheduleStart Time string like "10:00:00"
 * @param scheduleEnd Time string like "16:00:00"
 * @returns Object with validation result and message
 */
export function isWithinScheduleTime(
  currentTime: Date,
  scheduleStart: string,
  scheduleEnd: string
): { isWithin: boolean; message: string } {
  const now = currentTime.getTime()

  // Parse schedule start time
  const [startHour, startMin] = scheduleStart.split(':').map(Number)
  const scheduleStartTime = new Date(currentTime)
  scheduleStartTime.setHours(startHour, startMin, 0, 0)

  // Parse schedule end time
  const [endHour, endMin] = scheduleEnd.split(':').map(Number)
  const scheduleEndTime = new Date(currentTime)
  scheduleEndTime.setHours(endHour, endMin, 0, 0)

  // Check if too early
  if (now < scheduleStartTime.getTime()) {
    const diffMinutes = Math.round(
      (scheduleStartTime.getTime() - now) / (1000 * 60)
    )
    return {
      isWithin: false,
      message: `Je bent ${diffMinutes} minuten te vroeg. Rooster start om ${scheduleStart.slice(0, 5)}`,
    }
  }

  // Check if too late
  if (now > scheduleEndTime.getTime()) {
    const diffMinutes = Math.round(
      (now - scheduleEndTime.getTime()) / (1000 * 60)
    )
    return {
      isWithin: false,
      message: `Je bent ${diffMinutes} minuten te laat. Rooster eindigde om ${scheduleEnd.slice(0, 5)}`,
    }
  }

  // Within schedule
  return {
    isWithin: true,
    message: 'Je bent op tijd volgens je rooster',
  }
}
