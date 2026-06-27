'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyPermission } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'

export async function updateInitiativeDatesAction({
  id,
  startDate,
  targetDate,
}: {
  id: string
  startDate: string | null
  targetDate: string | null
}) {
  try {
    await verifyPermission('updateInitiative')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('initiatives')
      .update({
        start_date: startDate,
        target_date: targetDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    revalidatePath('/roadmap')
    return { success: true, initiative: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateEpicDatesAction({
  id,
  startDate,
  targetDate,
}: {
  id: string
  startDate: string | null
  targetDate: string | null
}) {
  try {
    await verifyPermission('updateEpic')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('epics')
      .update({
        start_date: startDate,
        target_date: targetDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    revalidatePath('/roadmap')
    return { success: true, epic: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
