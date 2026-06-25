'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { verifyPermission } from '@/lib/auth-helpers'
import { createNotification } from '@/lib/notification-helper'

export async function createTask(formData: FormData) {
  const { userId, orgId } = await verifyPermission('createTask')

  const supabase = await createClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const team_id = formData.get('team_id') as string
  const status = (formData.get('status') as string) || 'Todo'
  const priority = (formData.get('priority') as string) || 'no_priority'
  const assignee_id = (formData.get('assignee_id') as string) || null

  if (!title || !team_id) {
    throw new Error('Title and Team are required')
  }

  // Verify user is a member of the team
  const { data: teamMember, error: memberError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('team_id', team_id)
    .eq('user_id', userId)
    .single()

  if (memberError || !teamMember) {
    throw new Error('You are not a member of this team')
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      team_id,
      status,
      priority,
      creator_id: userId,
      assignee_id,
    })
    .select('id, identifier, title')
    .single()

  if (error) {
    console.error('Error creating task:', error)
    console.error('Error details:', error.message, error.code)
    throw new Error(`Failed to create task: ${error.message}`)
  }

  if (!task || !task.identifier) {
    console.error('Task created but no identifier returned:', task)
    throw new Error('Task created but identifier not generated')
  }

  // Create notification for assignee if assigned
  if (assignee_id && assignee_id !== userId) {
    await createNotification({
      userId: assignee_id,
      organizationId: orgId,
      type: 'task_assigned',
      actorId: userId,
      taskId: task.id,
    })
  }

  redirect(`/task/${task.identifier}`)
}

export async function assignTaskAction({
  taskId,
  assigneeId,
}: {
  taskId: string
  assigneeId: string
}) {
  try {
    const { userId, orgId } = await verifyPermission('assignTask')

    const supabase = await createClient()

    // Get task to find team_id
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('team_id')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return { success: false, error: 'Task not found' }
    }

    // Verify hierarchical assignment permissions
    const { canAssignTask } = await import('@/lib/task-assignment-helpers')
    const { allowed, reason } = await canAssignTask(userId, orgId, task.team_id, assigneeId)

    if (!allowed) {
      return { success: false, error: reason || 'You do not have permission to assign this task' }
    }

    const { error } = await supabase
      .from('tasks')
      .update({ assignee_id: assigneeId })
      .eq('id', taskId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Create notification for assignee
    if (assigneeId !== userId) {
      await createNotification({
        userId: assigneeId,
        organizationId: orgId,
        type: 'task_assigned',
        actorId: userId,
        taskId,
      })
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function unassignTaskAction({ taskId }: { taskId: string }) {
  try {
    await verifyPermission('assignTask')

    const supabase = await createClient()

    const { error } = await supabase
      .from('tasks')
      .update({ assignee_id: null })
      .eq('id', taskId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get list of users that can be assigned a task
 * Based on hierarchical permissions
 */
export async function getTaskAssignees(teamId: string) {
  try {
    const { userId, orgId } = await verifyPermission('assignTask')
    const { getAssignableUsers } = await import('@/lib/task-assignment-helpers')
    
    return await getAssignableUsers(userId, orgId, teamId)
  } catch (error: any) {
    return []
  }
}

export async function updateTaskAction({
  id,
  title,
  description,
  status,
  priority,
  estimate,
}: {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  estimate?: number | null
}) {
  try {
    const { userId } = await verifyPermission('updateTask')
    const supabase = await createClient()

    const { error } = await supabase
      .from('tasks')
      .update({
        title,
        description: description || null,
        status: status as any,
        priority: priority as any,
        estimate: estimate || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteTaskAction(id: string) {
  try {
    await verifyPermission('deleteTask')
    const supabase = await createClient()

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

