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
  const project_id = (formData.get('project_id') as string) || null

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
      assignee_ids: assignee_id ? [assignee_id] : [],
      project_id: project_id || null,
      acceptance_status: assignee_id && assignee_id !== userId ? 'pending' : 'accepted',
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

  // Send acceptance-required notification to assignee
  if (assignee_id && assignee_id !== userId) {
    await createNotification({
      userId: assignee_id,
      organizationId: orgId,
      type: 'task_acceptance_required',
      actorId: userId,
      taskId: task.id,
    })
  }

  redirect(`/task/${task.identifier}`)
}

export async function assignTaskAction({
  taskId,
  assigneeId,
  assigneeIds,
}: {
  taskId: string
  assigneeId?: string | null
  assigneeIds?: string[]
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

    const finalIds = assigneeIds || (assigneeId ? [assigneeId] : [])
    const primaryId = assigneeId !== undefined ? assigneeId : (finalIds.length > 0 ? finalIds[0] : null)

    // Verify hierarchical assignment permissions for all assignees
    const { canAssignTask } = await import('@/lib/task-assignment-helpers')
    for (const id of finalIds) {
      const { allowed, reason } = await canAssignTask(userId, orgId, task.team_id, id)
      if (!allowed) {
        return { success: false, error: reason || `You do not have permission to assign user ${id}` }
      }
    }

    const { error } = await supabase
      .from('tasks')
      .update({ 
        assignee_id: primaryId, 
        assignee_ids: finalIds,
        acceptance_status: primaryId && primaryId !== userId ? 'pending' : 'accepted' 
      })
      .eq('id', taskId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Send acceptance-required notification to all assignees who are not the creator
    for (const id of finalIds) {
      if (id !== userId) {
        await createNotification({
          userId: id,
          organizationId: orgId,
          type: 'task_acceptance_required',
          actorId: userId,
          taskId,
        })
      }
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


/**
 * Assignee accepts or declines a task assignment.
 * - 'accepted': sets acceptance_status = 'accepted', notifies creator
 * - 'declined': unassigns the task (assignee_id = null), notifies creator
 */
export async function respondToTaskAssignmentAction({
  taskId,
  response,
  notificationId,
}: {
  taskId: string
  response: 'accepted' | 'declined'
  notificationId?: string
}) {
  try {
    const { userId, orgId } = await verifyPermission('updateTask')
    const supabase = await createClient()

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, identifier, creator_id, assignee_id')
      .eq('id', taskId)
      .single()

    if (taskError || !task) return { success: false, error: 'Task not found' }
    if (task.assignee_id !== userId) return { success: false, error: 'You are not the assignee of this task' }

    if (response === 'accepted') {
      const { error } = await supabase
        .from('tasks')
        .update({ acceptance_status: 'accepted' })
        .eq('id', taskId)
      if (error) return { success: false, error: error.message }

      if (task.creator_id && task.creator_id !== userId) {
        await createNotification({
          userId: task.creator_id,
          organizationId: orgId,
          type: 'task_assignment_accepted',
          actorId: userId,
          taskId,
        })
      }
    } else {
      const { error } = await supabase
        .from('tasks')
        .update({ assignee_id: null, acceptance_status: 'accepted' })
        .eq('id', taskId)
      if (error) return { success: false, error: error.message }

      if (task.creator_id && task.creator_id !== userId) {
        await createNotification({
          userId: task.creator_id,
          organizationId: orgId,
          type: 'task_assignment_declined',
          actorId: userId,
          taskId,
        })
      }
    }

    if (notificationId) {
      await supabase
        .from('notifications')
        .update({ archived_at: new Date().toISOString(), read_at: new Date().toISOString() })
        .eq('id', notificationId)
    } else {
      await supabase
        .from('notifications')
        .update({ archived_at: new Date().toISOString(), read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('task_id', taskId)
        .eq('type', 'task_acceptance_required')
        .is('archived_at', null)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateTaskStatusAction({
  id,
  status,
}: {
  id: string
  status: string
}) {
  try {
    const { userId } = await verifyPermission('updateTask')
    const supabase = await createClient()

    const { error } = await supabase
      .from('tasks')
      .update({
        status: status as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
