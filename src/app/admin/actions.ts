// @ts-nocheck
'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { CreateUserInput, UpdateUserInput, CreateLocationInput, UpdateLocationInput } from '@/types'

// ==================== USER MANAGEMENT ====================

export async function createUser(data: CreateUserInput) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()

    // Create auth user with metadata - the handle_new_user trigger
    // automatically inserts into public.users using raw_user_meta_data
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
        role: data.role,
      },
    })

    // Set coach_id and roles if provided (trigger creates the user first, then we update)
    if (!authError && authData?.user) {
      const extraUpdate: Record<string, any> = {}
      if (data.coach_id) extraUpdate.coach_id = data.coach_id
      if (data.roles) extraUpdate.roles = data.roles
      if (Object.keys(extraUpdate).length > 0) {
        await adminClient
          .from('users')
          .update(extraUpdate)
          .eq('id', authData.user.id)
      }
    }

    if (authError) {
      return { error: `Account aanmaken mislukt: ${authError.message}` }
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Create user error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function updateUser(userId: string, data: UpdateUserInput) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()

    const updateData: Record<string, any> = {}
    if (data.full_name) updateData.full_name = data.full_name
    if (data.email) updateData.email = data.email
    if (data.role) updateData.role = data.role
    if (data.roles) updateData.roles = data.roles
    if (data.coach_id !== undefined) updateData.coach_id = data.coach_id || null
    if (data.class_code !== undefined) updateData.class_code = data.class_code || null
    if (data.cohort !== undefined) updateData.cohort = data.cohort || null
    if (data.phone_number !== undefined) updateData.phone_number = data.phone_number || null

    const { error } = await adminClient
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      return { error: `Gebruiker bijwerken mislukt: ${error.message}` }
    }

    // Update email in auth if changed
    if (data.email) {
      await adminClient.auth.admin.updateUserById(userId, { email: data.email })
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Update user error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function deleteUser(userId: string) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()

    // Delete from users table (cascades should handle related data)
    const { error: deleteError } = await adminClient
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      return { error: `Gebruiker verwijderen mislukt: ${deleteError.message}` }
    }

    // Delete auth user
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
    if (authError) {
      console.error('Auth user delete error:', authError)
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Delete user error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

// ==================== LOCATION MANAGEMENT ====================

export async function createLocation(data: CreateLocationInput) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const qrCode = crypto.randomUUID()

    const { error } = await supabase
      .from('locations')
      .insert({
        name: data.name,
        address: data.address || null,
        latitude: data.latitude,
        longitude: data.longitude,
        qr_code: qrCode,
      })

    if (error) {
      return { error: `Locatie aanmaken mislukt: ${error.message}` }
    }

    revalidatePath('/admin/locations')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Create location error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function updateLocation(id: string, data: UpdateLocationInput) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('locations')
      .update(data)
      .eq('id', id)

    if (error) {
      return { error: `Locatie bijwerken mislukt: ${error.message}` }
    }

    revalidatePath('/admin/locations')
    return { success: true }
  } catch (error) {
    console.error('Update location error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function deleteLocation(id: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: `Locatie verwijderen mislukt: ${error.message}` }
    }

    revalidatePath('/admin/locations')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Delete location error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

// ==================== SCHEDULE MANAGEMENT ====================

export async function approveSchedule(submissionGroup: string, adminNote?: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const updateData: Record<string, any> = { status: 'approved' }
    if (adminNote?.trim()) updateData.admin_note = adminNote.trim()

    const { error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('submission_group', submissionGroup)

    if (error) {
      return { error: `Rooster goedkeuren mislukt: ${error.message}` }
    }

    revalidatePath('/admin/schedules')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Approve schedule error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function rejectSchedule(submissionGroup: string, adminNote?: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const updateData: Record<string, any> = { status: 'rejected' }
    if (adminNote?.trim()) updateData.admin_note = adminNote.trim()

    // Get the affected schedules (to find student_id and push_request_id)
    const { data: schedules } = await supabase
      .from('schedules')
      .select('user_id, push_request_id')
      .eq('submission_group', submissionGroup)
      .limit(1)

    const { error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('submission_group', submissionGroup)

    if (error) {
      return { error: `Rooster afwijzen mislukt: ${error.message}` }
    }

    // Send in-app notification to student with rejection reason
    if (schedules && schedules.length > 0) {
      const { user_id, push_request_id } = schedules[0]
      const reason = adminNote?.trim()

      await adminClient.from('notifications').insert({
        user_id,
        type: 'schedule_rejected',
        title: 'Rooster afgekeurd',
        message: reason
          ? `Je ingediende rooster is afgekeurd. Reden: ${reason}`
          : 'Je ingediende rooster is afgekeurd. Dien een nieuw rooster in.',
        related_id: submissionGroup,
        read: false,
      })

      // Re-open the push request so the student sees the banner again
      if (push_request_id) {
        await adminClient
          .from('schedule_push_recipients')
          .update({ responded: false, responded_at: null })
          .eq('push_request_id', push_request_id)
          .eq('student_id', user_id)
      }
    }

    revalidatePath('/admin/schedules')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Reject schedule error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

// ==================== SCHEDULE PUSH ====================

export async function createSchedulePush(
  validFrom: string,
  validUntil: string,
  studentIds: string[],
  message?: string
) {
  try {
    const admin = await requireAdmin()
    const adminClient = createAdminClient()

    // Create the push request
    const { data: pushRequest, error: pushError } = await adminClient
      .from('schedule_push_requests')
      .insert({
        valid_from: validFrom,
        valid_until: validUntil,
        message: message?.trim() || null,
        created_by: admin.id,
      })
      .select('id')
      .single()

    if (pushError || !pushRequest) {
      return { error: `Push aanmaken mislukt: ${pushError?.message}` }
    }

    // Create recipient rows
    const recipients = studentIds.map((student_id) => ({
      push_request_id: pushRequest.id,
      student_id,
      responded: false,
    }))

    const { error: recipError } = await adminClient
      .from('schedule_push_recipients')
      .insert(recipients)

    if (recipError) {
      return { error: `Ontvangers opslaan mislukt: ${recipError.message}` }
    }

    // Send in-app notifications
    const periodLabel = `${new Date(validFrom).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })} t/m ${new Date(validUntil).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`
    const notifications = studentIds.map((student_id) => ({
      user_id: student_id,
      type: 'system',
      title: 'Vul je rooster in',
      message: message?.trim()
        ? `${message.trim()} — periode: ${periodLabel}`
        : `Je kunt nu je rooster indienen voor de periode ${periodLabel}.`,
      related_id: pushRequest.id,
      read: false,
    }))

    await adminClient.from('notifications').insert(notifications)

    revalidatePath('/admin/schedule-push')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Schedule push error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

// ==================== LEAVE REQUEST MANAGEMENT ====================

export async function approveLeaveRequest(id: string, adminNote?: string) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const updateData: Record<string, any> = {
      status: 'approved',
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    }
    if (adminNote?.trim()) updateData.admin_note = adminNote.trim()

    const { error } = await supabase
      .from('leave_requests')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return { error: `Verlof goedkeuren mislukt: ${error.message}` }
    }

    revalidatePath('/admin/leave-requests')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Approve leave error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function rejectLeaveRequest(id: string, adminNote?: string) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const updateData: Record<string, any> = {
      status: 'rejected',
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    }
    if (adminNote?.trim()) updateData.admin_note = adminNote.trim()

    const { error } = await supabase
      .from('leave_requests')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return { error: `Verlof afwijzen mislukt: ${error.message}` }
    }

    revalidatePath('/admin/leave-requests')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Reject leave error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

// ==================== COACH MANAGEMENT ====================

export async function createCoach(name: string) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('coaches')
      .insert({ name: name.trim() })

    if (error) {
      if (error.code === '23505') return { error: 'Een coach met deze naam bestaat al' }
      return { error: `Coach aanmaken mislukt: ${error.message}` }
    }

    revalidatePath('/admin/coaches')
    revalidatePath('/admin/users')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Create coach error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function updateCoach(id: string, data: { name?: string; active?: boolean; user_id?: string | null }) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()

    const updateData: Record<string, any> = {}
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.active !== undefined) updateData.active = data.active
    if ('user_id' in data) updateData.user_id = data.user_id || null

    const { error } = await adminClient
      .from('coaches')
      .update(updateData)
      .eq('id', id)

    if (error) {
      if (error.code === '23505') return { error: 'Een coach met deze naam bestaat al' }
      return { error: `Coach bijwerken mislukt: ${error.message}` }
    }

    revalidatePath('/admin/coaches')
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Update coach error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function deleteCoach(id: string) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('coaches')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: `Coach verwijderen mislukt: ${error.message}` }
    }

    revalidatePath('/admin/coaches')
    revalidatePath('/admin/users')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Delete coach error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

// ==================== NOTE LABELS ====================

export async function createNoteLabel(name: string, color: string, sortOrder: number) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('note_labels')
      .insert({ name: name.trim(), color, sort_order: sortOrder })
    if (error) {
      if (error.code === '23505') return { error: 'Een label met deze naam bestaat al' }
      return { error: error.message }
    }
    revalidatePath('/admin/note-labels')
    return { success: true }
  } catch (error) {
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function updateNoteLabel(
  id: string,
  data: { name?: string; color?: string; active?: boolean; sort_order?: number }
) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()
    const { error } = await adminClient.from('note_labels').update(data).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/note-labels')
    revalidatePath('/coach/notes')
    return { success: true }
  } catch (error) {
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function deleteNoteLabel(id: string) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()
    const { error } = await adminClient.from('note_labels').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/note-labels')
    return { success: true }
  } catch (error) {
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

// ==================== DEVELOPMENT GOALS ====================

export async function upsertStudentGoalPhases(
  studentId: string,
  phases: { goal_number: number; phase: number }[]
) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const { goal_number, phase } of phases) {
      updateData[`goal_${goal_number}_phase`] = phase
    }

    const { error } = await adminClient
      .from('student_development_goals')
      .upsert({ student_id: studentId, ...updateData }, { onConflict: 'student_id' })

    if (error) return { error: `Doelen bijwerken mislukt: ${error.message}` }

    revalidatePath('/admin/development-goals')
    revalidatePath('/coach/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Upsert student goals error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

export async function upsertGoalName(
  goalNumber: number,
  goalName: string,
  description?: string
) {
  try {
    await requireAdmin()
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('development_goal_names')
      .upsert({ goal_number: goalNumber, goal_name: goalName.trim(), description: description?.trim() || null }, { onConflict: 'goal_number' })

    if (error) return { error: `Doelnaam bijwerken mislukt: ${error.message}` }

    revalidatePath('/admin/development-goals')
    revalidatePath('/coach/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Upsert goal name error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

// ==================== SETTINGS ====================

export async function updateSetting(key: string, value: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('settings')
      .update({ value })
      .eq('key', key)

    if (error) {
      return { error: `Instelling bijwerken mislukt: ${error.message}` }
    }

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    console.error('Update setting error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}
