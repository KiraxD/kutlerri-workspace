'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

    const { data: existingMembers } = await supabase
      .from('organization_members')
      .select('organization_id')
      .limit(1)

    if (existingMembers && existingMembers.length > 0) {
      return {
        success: false,
        error: 'A workspace already exists. Ask an administrator to add your account to the organization.',
      }
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: `${userName}'s Workspace`,
        slug:
          user.email
            .split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000),
      })
      .select()
      .single()

    if (orgError || !org) {
      return { success: false, error: orgError?.message || 'Failed to create organization' }
    }

    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: userName,
      phone_number: user.user_metadata?.phone_number ?? null,
    })

    const { error: memberError } = await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'super_admin',
    })

    if (memberError) {
      return { success: false, error: memberError.message }
    }

    const { data: team, error: teamError } = await supabase
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

    if (team) {
      const { error: teamMemberError } = await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: user.id,
        role: 'team_lead',
      })

      if (teamMemberError) {
        return { success: false, error: teamMemberError.message }
      }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'An error occurred' }
  }
}
