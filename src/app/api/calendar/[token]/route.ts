// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/server'
import { type NextRequest } from 'next/server'

// ─── ICS helpers ─────────────────────────────────────────────────────────────

function escapeIcs(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n|\r/g, '\\n')
}

function toIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

function toIcsDateTime(dateStr: string, timeStr: string): string {
  const date = dateStr.replace(/-/g, '')
  const parts = timeStr.split(':')
  const hh = (parts[0] ?? '00').padStart(2, '0')
  const mm = (parts[1] ?? '00').padStart(2, '0')
  return `${date}T${hh}${mm}00`
}

function nextDayStr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function nowUtc(): string {
  return new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
}

function generateIcs(userName: string, events: any[], slots: any[]): string {
  const stamp = nowUtc()
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//In- en Uitchecken//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Agenda ${escapeIcs(userName)}`,
    'X-WR-TIMEZONE:Europe/Amsterdam',
    // Minimal Amsterdam timezone definition
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Amsterdam',
    'BEGIN:DAYLIGHT',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'END:STANDARD',
    'END:VTIMEZONE',
  ]

  for (const ev of events) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:event-${ev.id}@in-en-uitchecken`)
    lines.push(`DTSTAMP:${stamp}`)

    if (ev.all_day || !ev.start_time) {
      lines.push(`DTSTART;VALUE=DATE:${toIcsDate(ev.event_date)}`)
      lines.push(`DTEND;VALUE=DATE:${toIcsDate(nextDayStr(ev.event_date))}`)
    } else {
      lines.push(
        `DTSTART;TZID=Europe/Amsterdam:${toIcsDateTime(ev.event_date, ev.start_time)}`
      )
      if (ev.end_time) {
        lines.push(
          `DTEND;TZID=Europe/Amsterdam:${toIcsDateTime(ev.event_date, ev.end_time)}`
        )
      } else {
        // Fallback: 1 hour duration
        const [h, m] = ev.start_time.split(':').map(Number)
        const endH = String(Math.min(h + 1, 23)).padStart(2, '0')
        const endM = String(m).padStart(2, '0')
        lines.push(
          `DTEND;TZID=Europe/Amsterdam:${toIcsDateTime(ev.event_date, `${endH}:${endM}`)}`
        )
      }
    }

    lines.push(`SUMMARY:${escapeIcs(ev.title)}`)
    if (ev.description) {
      lines.push(`DESCRIPTION:${escapeIcs(ev.description)}`)
    }
    lines.push('END:VEVENT')
  }

  for (const slot of slots) {
    const title = slot.meeting_cycles?.title ?? 'Gesprek'
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:slot-${slot.id}@in-en-uitchecken`)
    lines.push(`DTSTAMP:${stamp}`)
    lines.push(
      `DTSTART;TZID=Europe/Amsterdam:${toIcsDateTime(slot.slot_date, slot.start_time)}`
    )
    lines.push(
      `DTEND;TZID=Europe/Amsterdam:${toIcsDateTime(slot.slot_date, slot.end_time)}`
    )
    lines.push(`SUMMARY:${escapeIcs(title)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const adminSupabase = createAdminClient()

  // Look up user by iCal token
  const { data: userRecord } = await adminSupabase
    .from('users')
    .select('id, full_name, coach_id')
    .eq('ical_token', params.token)
    .single()

  if (!userRecord) {
    return new Response('Not found', { status: 404 })
  }

  const userId = userRecord.id
  const coachEntityId = userRecord.coach_id ?? null

  // Resolve coach's auth user ID
  let coachAuthUserId: string | null = null
  if (coachEntityId) {
    const { data: coachRecord } = await adminSupabase
      .from('coaches')
      .select('user_id')
      .eq('id', coachEntityId)
      .single()
    coachAuthUserId = coachRecord?.user_id ?? null
  }

  // Fetch calendar events (same logic as student calendar page)
  let events: any[] = []
  if (coachAuthUserId) {
    const { data } = await adminSupabase
      .from('calendar_events')
      .select('id, title, description, event_date, all_day, start_time, end_time, variant, target_student_ids')
      .or(
        `and(variant.eq.shared,student_id.eq.${userId}),` +
        `and(variant.eq.coach,created_by.eq.${coachAuthUserId})`
      )
      .order('event_date', { ascending: true })
    events = (data ?? []).filter((e: any) => {
      if (e.variant !== 'coach') return true
      const targets = e.target_student_ids
      return targets == null || targets.includes(userId)
    })
  } else {
    const { data } = await adminSupabase
      .from('calendar_events')
      .select('id, title, description, event_date, all_day, start_time, end_time')
      .eq('variant', 'shared')
      .eq('student_id', userId)
      .order('event_date', { ascending: true })
    events = data ?? []
  }

  // Fetch booked meeting slots
  const { data: myBookings } = await adminSupabase
    .from('meeting_bookings')
    .select('slot_id')
    .eq('student_id', userId)

  const mySlotIds = (myBookings ?? []).map((b: any) => b.slot_id)

  let bookedSlots: any[] = []
  if (mySlotIds.length > 0) {
    const { data } = await adminSupabase
      .from('meeting_slots')
      .select('id, slot_date, start_time, end_time, meeting_cycles(title)')
      .in('id', mySlotIds)
      .order('slot_date', { ascending: true })
    bookedSlots = data ?? []
  }

  const icsContent = generateIcs(userRecord.full_name, events, bookedSlots)

  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="agenda.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
