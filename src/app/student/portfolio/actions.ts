// @ts-nocheck
'use server'

import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addPortfolioItem(data: {
  goal_number: number
  title: string
  description?: string
  link_url?: string
}): Promise<{ error?: string }> {
  const user = await requireStudent()
  const supabase = await createClient()

  if (!data.title.trim()) return { error: 'Titel is verplicht' }
  if (!data.description?.trim() && !data.link_url?.trim()) {
    return { error: 'Voeg een reflectie of link toe' }
  }

  const { error } = await supabase.from('portfolio_items').insert({
    student_id: user.id,
    goal_number: data.goal_number,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    link_url: data.link_url?.trim() || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/student/portfolio')
  revalidatePath('/student/dashboard')
  return {}
}

export async function deletePortfolioItem(itemId: string): Promise<{ error?: string }> {
  const user = await requireStudent()
  const supabase = await createClient()

  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', itemId)
    .eq('student_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/student/portfolio')
  revalidatePath('/student/dashboard')
  return {}
}
