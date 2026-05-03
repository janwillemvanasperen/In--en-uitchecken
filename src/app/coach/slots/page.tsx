// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { SlotsManager } from '@/components/coach/slots-manager'
import { createSlot, deleteSlot } from './actions'

export const dynamic = 'force-dynamic'

export default async function CoachSlotsPage() {
  await requireCoach()
  const adminClient = createAdminClient()

  const today = new Date().toISOString().split('T')[0]

  const [{ data: upcomingSlots }, { data: pastSlots }, { data: bookings }] = await Promise.all([
    adminClient
      .from('progress_meeting_slots')
      .select('*, users!progress_meeting_slots_created_by_fkey(full_name)')
      .eq('active', true)
      .gte('date', today)
      .order('date')
      .order('start_time'),
    adminClient
      .from('progress_meeting_slots')
      .select('*, users!progress_meeting_slots_created_by_fkey(full_name)')
      .eq('active', true)
      .lt('date', today)
      .order('date', { ascending: false })
      .order('start_time')
      .limit(20),
    adminClient
      .from('phase_review_requests')
      .select('slot_id, status, student_id, goal_number, phase, users!phase_review_requests_student_id_fkey(full_name)')
      .neq('status', 'cancelled'),
  ])

  // Count bookings per slot
  const bookingsBySlot: Record<string, any[]> = {}
  for (const b of bookings || []) {
    if (!bookingsBySlot[b.slot_id]) bookingsBySlot[b.slot_id] = []
    bookingsBySlot[b.slot_id].push(b)
  }

  const slotsWithBookings = (upcomingSlots || []).map((s) => ({
    ...s,
    bookings: bookingsBySlot[s.id] || [],
  }))

  const pastWithBookings = (pastSlots || []).map((s) => ({
    ...s,
    bookings: bookingsBySlot[s.id] || [],
  }))

  return (
    <SlotsManager
      upcomingSlots={slotsWithBookings}
      pastSlots={pastWithBookings}
      onCreate={createSlot}
      onDelete={deleteSlot}
    />
  )
}
