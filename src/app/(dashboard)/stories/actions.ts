'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyPermission } from '@/lib/auth-helpers'
import { createBulkNotifications } from '@/lib/notification-helper'
import { revalidatePath } from 'next/cache'

export async function createStoryAction({
  name,
  description,
  status,
  priority,
  epicId,
  assigneeId,
  startDate,
  dueDate,
  estimate,
}: {
  name: string
  description?: string
  status?: string
  priority?: string
  epicId?: string
  assigneeId?: string
  startDate?: string
  dueDate?: string
  estimate?: number
}) {
  try {
    const { orgId, userId } = await verifyPermission('createStory')
    const supabase = await createClient()

    const { data: story, error } = await supabase
      .from('stories')
      .insert({
        organization_id: orgId,
        name,
        description: description || null,
        status: (status as any) || 'Backlog',
        priority: (priority as any) || 'None',
        epic_id: epicId || null,
        owner_id: userId,
        assignee_id: assigneeId || null,
        start_date: startDate || null,
        due_date: dueDate || null,
        estimate: estimate || null,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    // Notify org members
    if (story?.id) {
      try {
        const { data: members } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', orgId)
          .neq('user_id', userId)

        if (members && members.length > 0) {
          await createBulkNotifications(
            members.map((m: any) => ({
              type: 'story_created' as any,
              actorId: userId,
              userId: m.user_id,
              organizationId: orgId,
            }))
          )
        }
      } catch (err) {
        console.error('Failed to create story notifications:', err)
      }
    }

    revalidatePath('/stories')
    return { success: true, story }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateStoryAction({
  id,
  name,
  description,
  status,
  priority,
  epicId,
  assigneeId,
  startDate,
  dueDate,
  estimate,
}: {
  id: string
  name?: string
  description?: string
  status?: string
  priority?: string
  epicId?: string | null
  assigneeId?: string | null
  startDate?: string | null
  dueDate?: string | null
  estimate?: number | null
}) {
  try {
    await verifyPermission('updateStory')
    const supabase = await createClient()

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (status !== undefined) updates.status = status
    if (priority !== undefined) updates.priority = priority
    if (epicId !== undefined) updates.epic_id = epicId
    if (assigneeId !== undefined) updates.assignee_id = assigneeId
    if (startDate !== undefined) updates.start_date = startDate
    if (dueDate !== undefined) updates.due_date = dueDate
    if (estimate !== undefined) updates.estimate = estimate

    const { data: story, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/stories')
    revalidatePath(`/stories/${id}`)
    return { success: true, story }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteStoryAction(id: string) {
  try {
    await verifyPermission('deleteStory')
    const supabase = await createClient()

    const { error } = await supabase.from('stories').delete().eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/stories')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
