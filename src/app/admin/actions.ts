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

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    })

    if (authError) {
      return { error: `Account aanmaken mislukt: ${authError.message}` }
    }

    // Insert into users table
    const { error: insertError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      })

    if (insertError) {
      // Rollback: delete auth user
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: `Gebruiker opslaan mislukt: ${insertError.message}` }
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

    const updateData: Record<string, string> = {}
    if (data.full_name) updateData.full_name = data.full_name
    if (data.email) updateData.email = data.email
    if (data.role) updateData.role = data.role

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

export async function approveSchedule(submissionGroup: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('schedules')
      .update({ status: 'approved' })
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

export async function rejectSchedule(submissionGroup: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('schedules')
      .update({ status: 'rejected' })
      .eq('submission_group', submissionGroup)

    if (error) {
      return { error: `Rooster afwijzen mislukt: ${error.message}` }
    }

    revalidatePath('/admin/schedules')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Reject schedule error:', error)
    return { error: 'Er is een onverwachte fout opgetreden' }
  }
}

// ==================== LEAVE REQUEST MANAGEMENT ====================

export async function approveLeaveRequest(id: string) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
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

export async function rejectLeaveRequest(id: string) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
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
