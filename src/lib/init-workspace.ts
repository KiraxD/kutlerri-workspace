import { createAdminClient } from '@/lib/supabase/admin'

export async function initializeUserWorkspace(userId: string, email: string, fullName: string, phoneNumber: string | null) {
  const adminSupabase = createAdminClient()
  
  // Check if user already has membership
  const { data: currentMemberships } = await adminSupabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)

  if (currentMemberships && currentMemberships.length > 0) {
    return
  }

  // Fetch all organizations to see if one exists
  const { data: orgs } = await adminSupabase
    .from('organizations')
    .select('id, name')
    .limit(1)

  // Create profile first
  await adminSupabase.from('profiles').upsert({
    id: userId,
    email: email,
    full_name: fullName,
    phone_number: phoneNumber,
  })

  let org

  if (orgs && orgs.length > 0) {
    // Organization already exists
    org = orgs[0]
  } else {
    // No organization exists - create one (first user)
    const { data: newOrg, error: orgError } = await adminSupabase
      .from('organizations')
      .insert({
        name: 'Kutlerri Workspace',
        slug: 'kutlerri-workspace',
      })
      .select()
      .single()

    if (orgError || !newOrg) {
      throw new Error(orgError?.message || 'Failed to create organization')
    }

    org = newOrg

    // Add first user as super_admin
    const { error: memberError } = await adminSupabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: userId,
      role: 'super_admin',
    })

    if (memberError) {
      throw new Error(memberError.message)
    }

    // Create default team
    const { data: team, error: teamError } = await adminSupabase
      .from('teams')
      .insert({
        organization_id: org.id,
        name: 'Default Team',
        identifier: 'KT',
      })
      .select()
      .single()

    if (teamError) {
      throw new Error(teamError.message)
    }

    // Add first user to default team as team_lead
    if (team) {
      const { error: teamMemberError } = await adminSupabase.from('team_members').insert({
        team_id: team.id,
        user_id: userId,
        role: 'team_lead',
      })

      if (teamMemberError) {
        throw new Error(teamMemberError.message)
      }
    }
  }
}
