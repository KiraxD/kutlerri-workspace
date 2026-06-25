'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyPermission } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'

export async function createTaskForStory({
  storyId,
  title,
  description,
  status,
  priority,
  teamId,
  assigneeId,
}: {
  storyId: string
  title: string
  description?: string
  status?: string
  priority?: string
  teamId?: string
  assigneeId?: string
}) {
  try {
    const { orgId, userId } = await verifyPermission('createStory')
    const supabase = await createClient()

    // Resolve team if not provided — pick the org's first team
    let resolvedTeamId = teamId
    if (!resolvedTeamId) {
      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('organization_id', orgId)
        .limit(1)
      resolvedTeamId = teams?.[0]?.id
    }

    if (!resolvedTeamId) return { success: false, error: 'No team found for this organization.' }

    // Generate next identifier
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', resolvedTeamId)

    const { data: team } = await supabase
      .from('teams')
      .select('identifier')
      .eq('id', resolvedTeamId)
      .single()

    const identifier = `${team?.identifier ?? 'T'}-${(count ?? 0) + 1}`

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description: description || null,
        status: (status as any) || 'Todo',
        priority: (priority as any) || 'no_priority',
        story_id: storyId,
        team_id: resolvedTeamId,
        creator_id: userId,
        assignee_id: assigneeId || null,
        identifier,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath(`/stories/${storyId}`)
    return { success: true, task }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createSubTask({
  taskId,
  title,
  storyId,
  assigneeId,
}: {
  taskId: string
  title: string
  storyId?: string
  assigneeId?: string | null
}) {
  try {
    const { userId } = await verifyPermission('createStory')
    const supabase = await createClient()

    const { data: subtask, error } = await supabase
      .from('sub_tasks')
      .insert({
        task_id: taskId,
        name: title,
        assignee_id: assigneeId || null,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    const formattedSubtask = subtask ? {
      ...subtask,
      title: subtask.name
    } : null

    revalidatePath(`/task`)
    if (storyId) revalidatePath(`/stories/${storyId}`)
    return { success: true, subtask: formattedSubtask }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleSubTask({
  subTaskId,
  completed,
  taskId,
  storyId,
}: {
  subTaskId: string
  completed: boolean
  taskId?: string
  storyId?: string
}) {
  try {
    await verifyPermission('createStory')
    const supabase = await createClient()

    const { error } = await supabase
      .from('sub_tasks')
      .update({
        status: completed ? ('Done' as any) : ('Todo' as any),
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', subTaskId)

    if (error) return { success: false, error: error.message }

    revalidatePath(`/task`)
    if (storyId) revalidatePath(`/stories/${storyId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
