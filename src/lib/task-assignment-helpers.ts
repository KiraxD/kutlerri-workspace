'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLE_HIERARCHY, type OrgRole } from '@/lib/permissions'

/**
 * Get assignable users based on actor's role and organizational hierarchy
 * 
 * Hierarchy Logic:
 * - super_admin: Can assign to any user in their organization
 * - admin: Can assign to any user in their organization
 * - manager: Can assign to team members only
 * - employee/viewer: Cannot assign tasks
 */
export async function getAssignableUsers(
  actorId: string,
  orgId: string,
  teamId?: string
) {
  try {
    const supabase = await createClient()

    // Get actor's role
    const { data: actorMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', actorId)
      .single()

    const actorRole = actorMembership?.role as OrgRole | null

    if (!actorRole || ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY['manager']) {
      // Only manager and above can assign
      return []
    }

    let users: any[] = []

    if (actorRole === 'super_admin' || actorRole === 'admin') {
      // Can assign to any org member
      const { data } = await supabase
        .from('organization_members')
        .select('profiles!user_id(id, full_name, email)')
        .eq('organization_id', orgId)
        .order('profiles.full_name', { ascending: true })

      users = data?.map((om: any) => om.profiles).filter(Boolean) || []
    } else if (actorRole === 'manager' && teamId) {
      // Can only assign to team members
      const { data } = await supabase
        .from('team_members')
        .select('profiles!user_id(id, full_name, email)')
        .eq('team_id', teamId)
        .order('profiles.full_name', { ascending: true })

      users = data?.map((tm: any) => tm.profiles).filter(Boolean) || []
    }

    return users
  } catch (error: any) {
    console.error('Error getting assignable users:', error.message)
    return []
  }
}

/**
 * Verify if actor can assign task to assignee
 * 
 * Hierarchy Rules:
 * - super_admin/admin: Can assign to anyone in org
 * - manager: Can assign to team members only
 * - employee/viewer: Cannot assign
 */
export async function canAssignTask(
  actorId: string,
  orgId: string,
  teamId: string,
  assigneeId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const supabase = await createClient()

    // Get actor's role
    const { data: actorMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', actorId)
      .single()

    const actorRole = actorMembership?.role as OrgRole | null

    if (!actorRole) {
      return { allowed: false, reason: 'Actor is not an organization member' }
    }

    // Check if actor has permission to assign
    if (ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY['manager']) {
      return { allowed: false, reason: `${actorRole} role cannot assign tasks` }
    }

    // super_admin and admin can assign to anyone in org
    if (actorRole === 'super_admin' || actorRole === 'admin') {
      const { data: assigneeMembership } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgId)
        .eq('user_id', assigneeId)
        .single()

      if (!assigneeMembership) {
        return { allowed: false, reason: 'Assignee is not an organization member' }
      }

      return { allowed: true }
    }

    // manager can only assign to team members
    if (actorRole === 'manager') {
      // First check if assignee is in the same team
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', assigneeId)
        .single()

      if (!teamMember) {
        return {
          allowed: false,
          reason: 'Managers can only assign tasks to their team members',
        }
      }

      // Also verify manager is in the same team
      const { data: actorTeamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', actorId)
        .single()

      if (!actorTeamMember) {
        return {
          allowed: false,
          reason: 'You are not a member of this team',
        }
      }

      return { allowed: true }
    }

    return { allowed: false, reason: 'Insufficient permissions' }
  } catch (error: any) {
    console.error('Error checking task assignment permission:', error.message)
    return { allowed: false, reason: 'Permission check failed' }
  }
}

/**
 * Get team members for a specific team
 * Used for task assignment dropdowns
 */
export async function getTeamMembers(teamId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('team_members')
      .select('profiles!user_id(id, full_name, email)')
      .eq('team_id', teamId)
      .order('profiles.full_name', { ascending: true })

    if (error) throw error

    return data?.map((tm: any) => tm.profiles).filter(Boolean) || []
  } catch (error: any) {
    console.error('Error getting team members:', error.message)
    return []
  }
}

/**
 * Get organization members for a specific organization
 * Used for admin-level task assignment
 */
export async function getOrgMembers(orgId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('organization_members')
      .select('profiles!user_id(id, full_name, email), role')
      .eq('organization_id', orgId)
      .order('profiles.full_name', { ascending: true })

    if (error) throw error

    return (
      data?.map((om: any) => ({
        ...om.profiles,
        orgRole: om.role,
      })) || []
    ).filter((m: any) => m.id)
  } catch (error: any) {
    console.error('Error getting organization members:', error.message)
    return []
  }
}

/**
 * Get users assignable by actor in a given context
 * Considers role hierarchy and team membership
 */
export async function getContextualAssignees(
  actorId: string,
  orgId: string,
  teamId: string
) {
  try {
    // First get assignable users based on hierarchy
    return await getAssignableUsers(actorId, orgId, teamId)
  } catch (error: any) {
    console.error('Error getting contextual assignees:', error.message)
    return []
  }
}
