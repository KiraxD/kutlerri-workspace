'use server'

import { createClient } from '@/lib/supabase/server'

export async function initializeSystemAction(email: string) {
  try {
    const supabase = await createClient()

    // 1. Check if system is already initialized
    const { data: existingMembers } = await supabase
      .from('organization_members')
      .select('id')
      .limit(1)

    if (existingMembers && existingMembers.length > 0) {
      return { success: false, error: 'System already initialized' }
    }

    // 2. Check if user exists in Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      return { success: false, error: 'Failed to list users' }
    }

    const user = authUsers.users.find((u) => u.email === email)
    if (!user) {
      return { success: false, error: `User with email ${email} not found. Please sign up first.` }
    }

    // 3. Create Organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: email.split('@')[0] + "'s Organization",
        slug: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000),
      })
      .select()
      .single()

    if (orgError || !org) {
      return { success: false, error: 'Failed to create organization' }
    }

    // 4. Ensure profile exists
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || email.split('@')[0],
    })

    // 5. Add user to organization as super_admin
    const { error: memberError } = await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'super_admin',
    })

    if (memberError) {
      return { success: false, error: 'Failed to assign super_admin role' }
    }

    // 6. Create default team
    const { data: team } = await supabase
      .from('teams')
      .insert({
        organization_id: org.id,
        name: 'Default Team',
        identifier: 'DEFAULT',
      })
      .select()
      .single()

    // 7. Add user to default team
    if (team) {
      await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: user.id,
        team_role: 'team_lead',
      })
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' }
  }
}
