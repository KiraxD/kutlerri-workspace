'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTeamAndOrg(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
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

  // 3. Add to Organization Members
  await supabase.from('organization_members').insert({
    organization_id: org.id,
    user_id: user.id,
    role: 'owner',
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
