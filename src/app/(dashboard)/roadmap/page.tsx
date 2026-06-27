import { createClient } from '@/lib/supabase/server'
import { RoadmapClient } from './RoadmapClient'

export default async function RoadmapPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: orgMembers } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
  
  const orgIds = orgMembers?.map((om: any) => om.organization_id) ?? []
  const userRole = orgMembers?.[0]?.role || 'employee'

  let initiatives: any[] = []
  let independentEpics: any[] = []

  if (orgIds.length > 0) {
    const { data } = await supabase
      .from('initiatives')
      .select('id, name, description, status, priority, progress, target_date, start_date, owner:profiles!owner_id(id, full_name, email)')
      .in('organization_id', orgIds)
      .order('target_date', { ascending: true, nullsFirst: false })
    initiatives = data ?? []

    // Fetch all epics for the organization to list unassigned ones as well
    const { data: epicsData } = await supabase
      .from('epics')
      .select('id, name, status, priority, progress, target_date, start_date, initiative_id, owner:profiles!owner_id(id, full_name, email)')
      .in('organization_id', orgIds)
      .order('target_date', { ascending: true, nullsFirst: false })

    const allEpics = epicsData ?? []
    const epicsByInit: Record<string, any[]> = {}
    const unlinked: any[] = []

    allEpics.forEach((e: any) => {
      if (e.initiative_id) {
        if (!epicsByInit[e.initiative_id]) epicsByInit[e.initiative_id] = []
        epicsByInit[e.initiative_id].push(e)
      } else {
        unlinked.push(e)
      }
    })

    initiatives = initiatives.map((init: any) => ({
      ...init,
      epics: epicsByInit[init.id] ?? [],
    }))

    independentEpics = unlinked
  }

  return (
    <RoadmapClient
      initialInitiatives={initiatives}
      initialIndependentEpics={independentEpics}
      userRole={userRole}
    />
  )
}
