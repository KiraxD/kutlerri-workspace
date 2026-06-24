'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyPermission } from '@/lib/auth-helpers'

export async function createInitiativeAction({
  name,
  description,
  status,
}: {
  name: string
  description?: string
  status?: string
}) {
  try {
    const { orgId, userId } = await verifyPermission('createInitiative')

    const supabase = await createClient()

    const { data: initiative, error } = await supabase
      .from('initiatives')
      .insert({
        organization_id: orgId,
        name,
        description: description || null,
        status: status || 'Backlog',
        owner_id: userId,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, initiative }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
