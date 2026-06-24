'use server'

import { verifyPermission } from '@/lib/auth-helpers'
import { createClient } from '@/lib/supabase/server'

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
  const { orgId } = await verifyPermission('createProject')
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

  const { data: project, error } = await supabase
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
