'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyPermission } from '@/lib/auth-helpers'
import { createBulkNotifications } from '@/lib/notification-helper'

export async function createEpicAction({
  name,
  description,
  status,
  initiativeId,
  projectId,
}: {
  name: string
  description?: string
  status?: string
  initiativeId?: string
  projectId?: string
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
        project_id: projectId || null,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Notify org members about new epic
    if (epic?.id) {
      try {
        const supabaseAdmin = await createClient()
        const { data: members } = await supabaseAdmin
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', orgId)
          .neq('user_id', userId)

        if (members && members.length > 0) {
          await createBulkNotifications(
            members.map((m) => ({
              type: 'epic_created',
              actorId: userId,
              userId: m.user_id,
              organizationId: orgId,
            }))
          )
        }
      } catch (err) {
        console.error('Failed to create epic notifications:', err)
      }
    }

    return { success: true, epic }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateEpicAction({
  id,
  name,
  description,
  status,
  priority,
}: {
  id: string
  name: string
  description?: string | null
  status?: string
  priority?: string
}) {
  try {
    await verifyPermission('createEpic')
    const supabase = await createClient()

    const { error } = await supabase
      .from('epics')
      .update({
        name,
        description: description || null,
        status: (status as any) || 'Backlog',
        priority: (priority as any) || 'None',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteEpicAction(id: string) {
  try {
    await verifyPermission('createEpic')
    const supabase = await createClient()

    const { error } = await supabase
      .from('epics')
      .delete()
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
