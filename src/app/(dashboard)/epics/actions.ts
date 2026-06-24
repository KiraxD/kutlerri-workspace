'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyPermission } from '@/lib/auth-helpers'

export async function createEpicAction({
  name,
  description,
  status,
  initiativeId,
}: {
  name: string
  description?: string
  status?: string
  initiativeId?: string
}) {
  try {
    const { orgId, userId } = await verifyPermission('createEpic')

    const supabase = await createClient()

    const { data: epic, error } = await supabase
      .from('epics')
      .insert({
        organization_id: orgId,
        name,
        description: description || null,
        status: status || 'Backlog',
        owner_id: userId,
        initiative_id: initiativeId || null,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, epic }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
