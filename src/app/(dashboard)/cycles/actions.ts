'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyPermission } from '@/lib/auth-helpers'
import { revalidatePath } from 'next/cache'

export async function getCyclesAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!member) return []

    const { data: teams } = await supabase
      .from('teams')
      .select('id, name')
      .eq('organization_id', member.organization_id)

    const teamIds = teams?.map((t: any) => t.id) ?? []
    if (teamIds.length === 0) return []

    const { data: cycles, error } = await supabase
      .from('cycles')
      .select('*, team:teams(id, name), issues(*)')
      .in('team_id', teamIds)
      .order('starts_at', { ascending: false })

    if (error) throw error
    return cycles || []
  } catch (error) {
    console.error('Error fetching cycles:', error)
    return []
  }
}

export async function getTeamsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!member) return []

    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, name')
      .eq('organization_id', member.organization_id)

    if (error) throw error
    return teams || []
  } catch (error) {
    console.error('Error fetching teams:', error)
    return []
  }
}

export async function getProjectsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!member) return []

    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name')
      .eq('organization_id', member.organization_id)

    if (error) throw error
    return projects || []
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}


export async function createCycleAction({
  teamId,
  name,
  startsAt,
  endsAt,
}: {
  teamId: string
  name: string
  startsAt: string
  endsAt: string
}) {
  try {
    await verifyPermission('createCycle')
    const supabase = await createClient()

    const { data: cycle, error } = await supabase
      .from('cycles')
      .insert({
        team_id: teamId,
        name,
        starts_at: startsAt,
        ends_at: endsAt,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/cycles')
    return { success: true, cycle }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function rolloverCycleTasksAction({
  fromCycleId,
  toCycleId,
}: {
  fromCycleId: string
  toCycleId: string
}) {
  try {
    await verifyPermission('updateCycle')
    const supabase = await createClient()

    const { error } = await supabase.rpc('rollover_cycle_tasks', {
      from_cycle_id: fromCycleId,
      to_cycle_id: toCycleId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/cycles')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
