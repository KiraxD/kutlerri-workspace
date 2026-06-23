'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { verifyPermission } from '@/lib/auth-helpers'

export async function createTeamAndOrg(formData: FormData) {
  // This action allows creating a new org/team (for first-time setup)
  // Only super_admin/admin can typically do this, but allow first org creation
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Check if user already has permission to create org/team
  try {
    await verifyPermission('createOrganization')
  } catch {
    // If not, check if this is their first organization
    const { data: existingOrgs } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
    
    if (existingOrgs && existingOrgs.length > 0) {
      throw new Error('Permission denied: Only admins can create organizations')
    }
  }

  const orgName = formData.get('orgName') as string
  const teamName = formData.get('teamName') as string
  const teamIdentifier = formData.get('teamIdentifier') as string

  // 1. Ensure profile exists
  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email!,
    full_name: user.email?.split('@')[0],
  }).select().single()

  // 2. Create Organization
  const { data: org, error: orgError } = await supabase.from('organizations').insert({
    name: orgName,
    slug: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000),
  }).select().single()

  if (orgError) throw new Error(orgError.message)

  // 3. Add to Organization Members as super_admin for first org
  await supabase.from('organization_members').insert({
    organization_id: org.id,
    user_id: user.id,
    role: 'super_admin',
  })

  // 4. Create Team
  const { data: team, error: teamError } = await supabase.from('teams').insert({
    organization_id: org.id,
    name: teamName,
    identifier: teamIdentifier.toUpperCase(),
  }).select().single()

  if (teamError) throw new Error(teamError.message)

  // 5. Add to Team Members
  await supabase.from('team_members').insert({
    team_id: team.id,
    user_id: user.id,
  })

  revalidatePath('/teams')
  return team
}

export async function getTeamsAction() {
  try {
    const { userId, orgId } = await verifyPermission('manageTeams')

    const supabase = await createClient()

    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, name, description')
      .eq('organization_id', orgId)

    if (error) {
      return { success: false, error: error.message, teams: [] }
    }

    return { success: true, teams: teams || [] }
  } catch (error: any) {
    return { success: false, error: error.message, teams: [] }
  }
}

export async function getEmployeesForTeamAction() {
  try {
    const { userId, orgId } = await verifyPermission('manageUserRoles')

    const supabase = await createClient()

    const { data: employees } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)

    if (!employees) {
      return { success: true, employees: [] }
    }

    const userIds = employees.map((e) => e.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)

    return { success: true, employees: profiles || [] }
  } catch (error: any) {
    return { success: false, error: error.message, employees: [] }
  }
}

export async function addTeamMemberAction({
  teamId,
  employeeId,
  teamRole,
}: {
  teamId: string
  employeeId: string
  teamRole: 'team_lead' | 'senior_member' | 'member' | 'guest'
}) {
  try {
    const { userId, orgId } = await verifyPermission('manageTeams')

    const supabase = await createClient()

    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: employeeId,
        team_role: teamRole,
      })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/teams')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateTeamMemberRoleAction({
  teamId,
  memberId,
  newRole,
}: {
  teamId: string
  memberId: string
  newRole: 'team_lead' | 'senior_member' | 'member' | 'guest'
}) {
  try {
    const { userId, orgId } = await verifyPermission('manageTeams')

    const supabase = await createClient()

    const { error } = await supabase
      .from('team_members')
      .update({ team_role: newRole })
      .eq('team_id', teamId)
      .eq('user_id', memberId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/teams')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function removeTeamMemberAction({
  teamId,
  memberId,
}: {
  teamId: string
  memberId: string
}) {
  try {
    const { userId, orgId } = await verifyPermission('manageTeams')

    const supabase = await createClient()

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', memberId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/teams')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
