'use server'

import { verifyPermission } from '@/lib/auth-helpers'
import { createClient } from '@/lib/supabase/server'
import { createBulkNotifications } from '@/lib/notification-helper'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createProjectAction({
  teamId,
  name,
  description,
  status,
  targetDate,
}: {
  teamId: string
  name: string
  description?: string
  status?: string
  targetDate?: string
}) {
  const { orgId, userId } = await verifyPermission('createProject')
  const supabase = await createClient()

  // Verify the team belongs to the user's organization
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('organization_id')
    .eq('id', teamId)
    .single()

  if (teamError || !team || team.organization_id !== orgId) {
    return { success: false, error: 'Team not found or unauthorized' }
  }

  // Verify user is actually a team member
  const { data: isMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single()

  if (!isMember) {
    return { success: false, error: 'You must be a team member to create projects' }
  }

  // Use admin client to insert project (permission already verified above)
  const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data: project, error } = await adminSupabase
    .from('projects')
    .insert({
      team_id: teamId,
      name,
      description: description || null,
      status: status || 'planned',
      target_date: targetDate ? new Date(targetDate).toISOString() : null,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // Notify team members about new project
  if (project?.id) {
    try {
      const supabaseAdmin = await createClient()
      const { data: members } = await supabaseAdmin
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .neq('user_id', userId)

      if (members && members.length > 0) {
        await createBulkNotifications(
          members.map((m) => ({
            type: 'project_created',
            actorId: userId,
            userId: m.user_id,
            organizationId: orgId,
          }))
        )
      }
    } catch (err) {
      console.error('Failed to create project notifications:', err)
    }
  }

  return { success: true, project }
}

export async function getTeamsAction() {
  const { userId, orgId } = await verifyPermission('createProject')
  const supabase = await createClient()

  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .eq('organization_id', orgId)
    .order('name')

  if (error) return { success: false, error: error.message }
  return { success: true, teams: teams ?? [] }
}
