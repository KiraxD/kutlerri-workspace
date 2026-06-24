'use server'

import { createClient } from '@/lib/supabase/server'

export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'task_completed'
  | 'team_created'
  | 'team_member_added'
  | 'task_comment'
  | 'task_mentioned'

export async function createNotification({
  userId,
  organizationId,
  type,
  actorId,
  taskId,
}: {
  userId: string
  organizationId: string
  type: NotificationType
  actorId?: string
  taskId?: string
}) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      organization_id: organizationId,
      actor_id: actorId || null,
      task_id: taskId || null,
      type,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error creating notification:', error)
      return null
    }

    return { success: true }
  } catch (error) {
    console.error('Error in createNotification:', error)
    return null
  }
}

export async function createBulkNotifications(
  notifications: Array<{
    userId: string
    organizationId: string
    type: NotificationType
    actorId?: string
    taskId?: string
  }>
) {
  try {
    const supabase = await createClient()

    const formattedNotifications = notifications.map((n) => ({
      user_id: n.userId,
      organization_id: n.organizationId,
      actor_id: n.actorId || null,
      task_id: n.taskId || null,
      type: n.type,
      created_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('notifications').insert(formattedNotifications)

    if (error) {
      console.error('Error creating bulk notifications:', error)
      return null
    }

    return { success: true }
  } catch (error) {
    console.error('Error in createBulkNotifications:', error)
    return null
  }
}
