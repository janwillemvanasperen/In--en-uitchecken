'use server'

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { isWithinRadius } from '@/lib/geolocation'
import type { CheckInInput, LeaveRequestInput, Location } from '@/types'
import type { Database } from '@/lib/supabase/database.types'

export async function checkIn(data: CheckInInput) {
  try {
    const user = await requireStudent()
    const supabase = await createClient()

    // Verify location exists
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', data.locationId)
      .single()

    if (locationError || !locationData) {
      return { error: 'Locatie niet gevonden' }
    }

    const location = locationData as Location

    // Validate QR code if provided
    if (data.qrCode) {
      if (location.qr_code !== data.qrCode) {
        return { error: 'Ongeldige QR code voor deze locatie' }
      }
    }

    // Validate GPS distance if coordinates provided
    if (data.userLat && data.userLng) {
      const withinRadius = isWithinRadius(
        data.userLat,
        data.userLng,
        Number(location.latitude),
        Number(location.longitude),
        500
      )

      if (!withinRadius) {
        return { error: 'Je bent te ver van de locatie (maximaal 500 meter)' }
      }
    }

    // Check for existing active check-in
    const { data: existingCheckIn } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .is('check_out_time', null)
      .single()

    if (existingCheckIn) {
      return { error: 'Je bent al ingecheckt. Check eerst uit voordat je opnieuw incheckt.' }
    }

    // Create check-in
    const checkInData: Database['public']['Tables']['check_ins']['Insert'] = {
      user_id: user.id,
      location_id: data.locationId,
      check_in_time: new Date().toISOString(),
      expected_start: data.expectedStart,
      expected_end: data.expectedEnd,
    }

    const { data: checkIn, error: checkInError } = await supabase
      .from('check_ins')
      .insert([checkInData])
      .select()
      .single()

    if (checkInError) {
      console.error('Check-in error:', checkInError)
      return { error: 'Check-in mislukt. Probeer het opnieuw.' }
    }

    // Revalidate pages that show check-in data
    revalidatePath('/student/dashboard')
    revalidatePath('/student/check-in')

    return { success: true, checkIn }
  } catch (error) {
    console.error('Check-in error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function checkOut() {
  try {
    const user = await requireStudent()
    const supabase = await createClient()

    // Find active check-in
    const { data: activeCheckIn, error: findError } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single()

    if (findError || !activeCheckIn) {
      return { error: 'Geen actieve check-in gevonden. Check eerst in voordat je uitcheckt.' }
    }

    // Update with check-out time
    const { error: updateError } = await supabase
      .from('check_ins')
      .update({ check_out_time: new Date().toISOString() })
      .eq('id', activeCheckIn.id)

    if (updateError) {
      console.error('Check-out error:', updateError)
      return { error: 'Check-out mislukt. Probeer het opnieuw.' }
    }

    // Revalidate pages
    revalidatePath('/student/dashboard')
    revalidatePath('/student/check-in')
    revalidatePath('/student/history')

    return { success: true }
  } catch (error) {
    console.error('Check-out error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function submitLeaveRequest(data: LeaveRequestInput) {
  try {
    const user = await requireStudent()
    const supabase = await createClient()

    // Validate date is not in the past
    const requestDate = new Date(data.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (requestDate < today) {
      return { error: 'Datum kan niet in het verleden liggen' }
    }

    // Insert leave request
    const leaveRequestData: Database['public']['Tables']['leave_requests']['Insert'] = {
      user_id: user.id,
      date: data.date,
      reason: data.reason,
      description: data.description,
      status: 'pending',
    }

    const { error: insertError } = await supabase
      .from('leave_requests')
      .insert([leaveRequestData])

    if (insertError) {
      console.error('Leave request error:', insertError)
      return { error: 'Verlofaanvraag mislukt. Probeer het opnieuw.' }
    }

    // Revalidate leave requests page
    revalidatePath('/student/leave-requests')

    return { success: true }
  } catch (error) {
    console.error('Leave request error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}
