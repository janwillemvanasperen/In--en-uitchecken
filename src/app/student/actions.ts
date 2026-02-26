// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { isWithinRadius } from '@/lib/geolocation'
import type { CheckInInput, LeaveRequestInput, Location, ScheduleSubmissionInput, PushSubscriptionInput } from '@/types'
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

    // Create check-in - convert time strings to full timestamps for today
    const today = new Date().toISOString().split('T')[0]
    const checkInData: Database['public']['Tables']['check_ins']['Insert'] = {
      user_id: user.id,
      location_id: data.locationId,
      check_in_time: new Date().toISOString(),
      expected_start: `${today}T${data.expectedStart}`,
      expected_end: `${today}T${data.expectedEnd}`,
    }

    // @ts-ignore - Supabase SSR type inference issue in production build
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
    // @ts-ignore - Supabase SSR type inference issue in production build
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

    // Validate times if provided
    if (data.start_time && data.end_time && data.start_time >= data.end_time) {
      return { error: 'Eindtijd moet na starttijd liggen' }
    }

    // Insert leave request
    const leaveRequestData: Database['public']['Tables']['leave_requests']['Insert'] = {
      user_id: user.id,
      date: data.date,
      reason: data.reason,
      description: data.description || null,
      status: 'pending',
      start_time: data.start_time || null,
      end_time: data.end_time || null,
    }

    // @ts-ignore - Supabase SSR type inference issue in production build
    const { error: insertError } = await supabase
      .from('leave_requests')
      .insert([leaveRequestData])

    if (insertError) {
      console.error('Leave request error:', insertError)
      return { error: `Verlofaanvraag mislukt: ${insertError.message}` }
    }

    // Revalidate leave requests page
    revalidatePath('/student/leave-requests')

    return { success: true }
  } catch (error) {
    console.error('Leave request error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function submitSchedule(data: ScheduleSubmissionInput) {
  try {
    const user = await requireStudent()
    const supabase = await createClient()

    const activeEntries = data.entries.filter(e => e.active)

    // Validate at least one active day
    if (activeEntries.length === 0) {
      return { error: 'Selecteer minimaal één dag' }
    }

    // Validate each entry: start < end
    for (const entry of activeEntries) {
      if (entry.start_time >= entry.end_time) {
        const dayNames: Record<number, string> = {
          1: 'Maandag', 2: 'Dinsdag', 3: 'Woensdag', 4: 'Donderdag',
          5: 'Vrijdag', 6: 'Zaterdag', 7: 'Zondag'
        }
        return { error: `${dayNames[entry.day_of_week]}: eindtijd moet na starttijd liggen` }
      }
    }

    // Calculate total hours
    const totalHours = activeEntries.reduce((sum, entry) => {
      const [sh, sm] = entry.start_time.split(':').map(Number)
      const [eh, em] = entry.end_time.split(':').map(Number)
      return sum + (eh + em / 60) - (sh + sm / 60)
    }, 0)

    // Fetch minimum hours setting
    const { data: minHoursSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'minimum_hours_per_week')
      .single()

    const minimumHours = minHoursSetting ? Number(minHoursSetting.value) : 16

    if (totalHours < minimumHours) {
      return { error: `Minimaal ${minimumHours} uur per week vereist. Je hebt nu ${totalHours.toFixed(1)} uur.` }
    }

    // Check no existing pending schedule
    const { data: existingPending } = await supabase
      .from('schedules')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .limit(1)

    if (existingPending && existingPending.length > 0) {
      return { error: 'Je hebt al een rooster in afwachting. Bewerk of verwijder dat eerst.' }
    }

    // Fetch period weeks setting
    const { data: periodSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'schedule_approval_period_weeks')
      .single()

    const periodWeeks = periodSetting ? Number(periodSetting.value) : 6

    // Calculate validity period
    const today = new Date()
    const validFrom = today.toISOString().split('T')[0]
    const validUntilDate = new Date(today)
    validUntilDate.setDate(validUntilDate.getDate() + periodWeeks * 7)
    const validUntil = validUntilDate.toISOString().split('T')[0]

    // Generate submission group
    const submissionGroup = crypto.randomUUID()

    // Insert schedule entries
    const scheduleRows = activeEntries.map(entry => ({
      user_id: user.id,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      status: 'pending' as const,
      valid_from: validFrom,
      valid_until: validUntil,
      submission_group: submissionGroup,
    }))

    // @ts-ignore - Supabase SSR type inference issue
    const { error: insertError } = await supabase
      .from('schedules')
      .insert(scheduleRows)

    if (insertError) {
      console.error('Schedule submit error:', insertError)
      return { error: 'Rooster indienen mislukt. Probeer het opnieuw.' }
    }

    revalidatePath('/student/schedule')
    revalidatePath('/student/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Schedule submit error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function updatePendingSchedule(data: ScheduleSubmissionInput) {
  try {
    const user = await requireStudent()
    const supabase = await createClient()

    const activeEntries = data.entries.filter(e => e.active)

    if (activeEntries.length === 0) {
      return { error: 'Selecteer minimaal één dag' }
    }

    for (const entry of activeEntries) {
      if (entry.start_time >= entry.end_time) {
        const dayNames: Record<number, string> = {
          1: 'Maandag', 2: 'Dinsdag', 3: 'Woensdag', 4: 'Donderdag',
          5: 'Vrijdag', 6: 'Zaterdag', 7: 'Zondag'
        }
        return { error: `${dayNames[entry.day_of_week]}: eindtijd moet na starttijd liggen` }
      }
    }

    const totalHours = activeEntries.reduce((sum, entry) => {
      const [sh, sm] = entry.start_time.split(':').map(Number)
      const [eh, em] = entry.end_time.split(':').map(Number)
      return sum + (eh + em / 60) - (sh + sm / 60)
    }, 0)

    const { data: minHoursSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'minimum_hours_per_week')
      .single()

    const minimumHours = minHoursSetting ? Number(minHoursSetting.value) : 16

    if (totalHours < minimumHours) {
      return { error: `Minimaal ${minimumHours} uur per week vereist. Je hebt nu ${totalHours.toFixed(1)} uur.` }
    }

    // Get existing pending entries to preserve submission_group and validity
    const { data: existingPending } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (!existingPending || existingPending.length === 0) {
      return { error: 'Geen pending rooster gevonden om te bewerken' }
    }

    const submissionGroup = (existingPending[0] as any).submission_group || crypto.randomUUID()
    const validFrom = (existingPending[0] as any).valid_from
    const validUntil = (existingPending[0] as any).valid_until

    // Delete existing pending entries
    // @ts-ignore
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (deleteError) {
      console.error('Schedule delete error:', deleteError)
      return { error: 'Rooster bijwerken mislukt. Probeer het opnieuw.' }
    }

    // Insert new entries
    const scheduleRows = activeEntries.map(entry => ({
      user_id: user.id,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      status: 'pending' as const,
      valid_from: validFrom,
      valid_until: validUntil,
      submission_group: submissionGroup,
    }))

    // @ts-ignore
    const { error: insertError } = await supabase
      .from('schedules')
      .insert(scheduleRows)

    if (insertError) {
      console.error('Schedule update error:', insertError)
      return { error: 'Rooster bijwerken mislukt. Probeer het opnieuw.' }
    }

    revalidatePath('/student/schedule')
    revalidatePath('/student/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Schedule update error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function deletePendingSchedule() {
  try {
    const user = await requireStudent()
    const supabase = await createClient()

    // @ts-ignore
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (deleteError) {
      console.error('Schedule delete error:', deleteError)
      return { error: 'Rooster verwijderen mislukt. Probeer het opnieuw.' }
    }

    revalidatePath('/student/schedule')
    revalidatePath('/student/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Schedule delete error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function savePushSubscription(data: PushSubscriptionInput) {
  try {
    const user = await requireStudent()
    const supabase = await createClient()

    // @ts-ignore
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
        },
        { onConflict: 'endpoint' }
      )

    if (error) {
      console.error('Push subscription error:', error)
      return { error: 'Meldingen inschakelen mislukt' }
    }

    return { success: true }
  } catch (error) {
    console.error('Push subscription error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    const user = await requireStudent()
    const supabase = await createClient()

    // @ts-ignore
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      return { error: 'Melding markeren mislukt' }
    }

    revalidatePath('/student')
    return { success: true }
  } catch (error) {
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function markAllNotificationsRead() {
  try {
    const user = await requireStudent()
    const supabase = await createClient()

    // @ts-ignore
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      return { error: 'Meldingen markeren mislukt' }
    }

    revalidatePath('/student')
    return { success: true }
  } catch (error) {
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function uploadProfilePhoto(formData: FormData) {
  try {
    const user = await requireStudent()
    const supabase = await createClient()

    const file = formData.get('photo') as File
    if (!file || file.size === 0) {
      return { error: 'Geen bestand geselecteerd' }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { error: 'Alleen afbeeldingen zijn toegestaan' }
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      return { error: 'Bestand is te groot (max 2MB)' }
    }

    const fileExt = file.name.split('.').pop() || 'jpg'
    const filePath = `${user.id}/profile.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: 'Upload mislukt. Probeer het opnieuw.' }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    // Update user profile
    // @ts-ignore
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_photo_url: urlData.publicUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return { error: 'Profiel bijwerken mislukt' }
    }

    revalidatePath('/student')
    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function deletePushSubscription(endpoint: string) {
  try {
    const user = await requireStudent()
    const supabase = await createClient()

    // @ts-ignore
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    if (error) {
      console.error('Push unsubscribe error:', error)
      return { error: 'Meldingen uitschakelen mislukt' }
    }

    return { success: true }
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}
