'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function initializeSystemAction() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user || !user.email) {
      return { success: false, error: 'Please sign in before initializing your workspace.' }
    }

    const userName = user.user_metadata?.full_name || user.email.split('@')[0]

    const { data: currentMemberships } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)

    if (currentMemberships && currentMemberships.length > 0) {
      redirect('/home')
    }

    // Use admin client to check if ANY organization exists (bypass RLS)
    const adminSupabase = createAdminClient()
    
    // Fetch all organizations
    const { data: orgs } = await adminSupabase
      .from('organizations')
      .select('id, name')
      .limit(1)

    // Create profile first
    await adminSupabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: userName,
      phone_number: user.user_metadata?.phone_number ?? null,
    })

    let org

    if (orgs && orgs.length > 0) {
      // Organization already exists - add user to it
      org = orgs[0]
      
      // Add user to existing organization as 'employee'
      const { error: memberError } = await adminSupabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'employee',
      })

      if (memberError) {
        return { success: false, error: memberError.message }
      }

      // Add user to default team
      const { data: defaultTeam } = await adminSupabase
        .from('teams')
        .select('id')
        .eq('organization_id', org.id)
        .limit(1)
        .single()

      if (defaultTeam) {
        await adminSupabase.from('team_members').insert({
          team_id: defaultTeam.id,
          user_id: user.id,
          role: 'member',
        })
      }
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
        return { success: false, error: orgError?.message || 'Failed to create organization' }
      }

      org = newOrg

      // Add first user as super_admin
      const { error: memberError } = await adminSupabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'super_admin',
      })

      if (memberError) {
        return { success: false, error: memberError.message }
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
        return { success: false, error: teamError.message }
      }

      // Add first user to default team as team_lead
      if (team) {
        const { error: teamMemberError } = await adminSupabase.from('team_members').insert({
          team_id: team.id,
          user_id: user.id,
          role: 'team_lead',
        })

        if (teamMemberError) {
          return { success: false, error: teamMemberError.message }
        }
      }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' }
  }
}
