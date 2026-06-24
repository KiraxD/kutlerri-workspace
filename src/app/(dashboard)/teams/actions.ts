'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { verifyPermission } from '@/lib/auth-helpers'

export async function createTeamAndOrg(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  try {
    await verifyPermission('createOrganization')
  } catch {
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

  await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0],
      phone_number: user.user_metadata?.phone_number ?? null,
    })
    .select()
    .single()

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: orgName,
      slug: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000),
    })
    .select()
    .single()

  if (orgError) throw new Error(orgError.message)

  await supabase.from('organization_members').insert({
    organization_id: org.id,
    user_id: user.id,
    role: 'super_admin',
  })

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      organization_id: org.id,
      name: teamName,
      identifier: teamIdentifier.toUpperCase(),
    })
    .select()
    .single()

  if (teamError) throw new Error(teamError.message)

  await supabase.from('team_members').insert({
    team_id: team.id,
    user_id: user.id,
    role: 'team_lead',
  })

  revalidatePath('/teams')
  return team
}

export async function getTeamsAction() {
  try {
    const { orgId } = await verifyPermission('manageTeams')

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
    const { orgId } = await verifyPermission('manageUserRoles')

    const supabase = await createClient()

    const { data: employees } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)

    if (!employees) {
      return { success: true, employees: [] }
    }

    const userIds = employees.map((employee) => employee.user_id)
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
    await verifyPermission('manageTeams')

    const supabase = await createClient()

    const { error } = await supabase.from('team_members').insert({
      team_id: teamId,
      user_id: employeeId,
      role: teamRole,
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
    await verifyPermission('manageTeams')

    const supabase = await createClient()

    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
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
    await verifyPermission('manageTeams')

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
