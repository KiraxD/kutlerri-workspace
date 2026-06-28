import { createClient } from '@/lib/supabase/server'
import { getCyclesAction, getTeamsAction, getProjectsAction } from './actions'
import { CyclesClient } from './CyclesClient'

export default async function CyclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch cycles, teams, and projects in parallel
  const [cycles, teams, projects] = await Promise.all([
    getCyclesAction(),
    getTeamsAction(),
    getProjectsAction()
  ])

  // Fetch user's role in the organization
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const userRole = member?.role || 'employee'

  return (
    <CyclesClient
      initialCycles={cycles}
      teams={teams}
      projects={projects}
      userRole={userRole}
    />
  )
}

