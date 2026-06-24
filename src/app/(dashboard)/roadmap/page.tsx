import { createClient } from '@/lib/supabase/server'
import { Route, Compass, Layers, CalendarDays, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { STATUS_DOT, STATUS_STYLES } from '@/lib/types'

const PRIORITY_DOT: Record<string, string> = {
  None: 'bg-gray-300',
  Low: 'bg-blue-400',
  Medium: 'bg-yellow-400',
  High: 'bg-orange-400',
  Urgent: 'bg-red-500',
}

export default async function RoadmapPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: orgMembers } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
  const orgIds = orgMembers?.map((om: any) => om.organization_id) ?? []

  let initiatives: any[] = []
  if (orgIds.length > 0) {
    const { data } = await supabase
      .from('initiatives')
      .select('id, name, description, status, priority, progress, target_date, start_date, owner:profiles!owner_id(id, full_name, email)')
      .in('organization_id', orgIds)
      .order('target_date', { ascending: true, nullsFirst: false })
    initiatives = data ?? []

    // Fetch epics for each initiative
    if (initiatives.length > 0) {
      const initIds = initiatives.map((i: any) => i.id)
      const { data: epicsData } = await supabase
        .from('epics')
        .select('id, name, status, priority, progress, target_date, initiative_id, owner:profiles!owner_id(id, full_name, email)')
        .in('initiative_id', initIds)
        .order('target_date', { ascending: true, nullsFirst: false })

      const epicsByInit: Record<string, any[]> = {}
      ;(epicsData ?? []).forEach((e: any) => {
        if (!epicsByInit[e.initiative_id]) epicsByInit[e.initiative_id] = []
        epicsByInit[e.initiative_id].push(e)
      })

      initiatives = initiatives.map((init: any) => ({
        ...init,
        epics: epicsByInit[init.id] ?? [],
      }))
    }
  }

  const totalInitiatives = initiatives.length
  const totalEpics = initiatives.reduce((sum: number, i: any) => sum + (i.epics?.length ?? 0), 0)

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-gradient-to-r from-violet-50 to-background">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
            <Route className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Roadmap</h1>
            <p className="text-xs text-muted-foreground">Initiative → Epic hierarchy with target dates</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{totalInitiatives}</strong> initiatives
          </span>
          <span>
            <strong className="text-foreground">{totalEpics}</strong> epics
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        {initiatives.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[420px]">
            <div className="w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center mb-6">
              <Route className="w-10 h-10 text-violet-400 opacity-60" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No roadmap data yet</h2>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-6">
              Create Initiatives and link Epics to them to see the roadmap timeline here.
            </p>
            <div className="flex gap-3">
              <Link href="/initiatives" className="text-sm font-medium text-violet-600 hover:text-violet-700 underline underline-offset-4">
                View Initiatives →
              </Link>
              <Link href="/epics" className="text-sm font-medium text-blue-600 hover:text-blue-700 underline underline-offset-4">
                View Epics →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {initiatives.map((initiative: any) => {
              const progress = initiative.progress ?? 0
              return (
                <div key={initiative.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                  {/* Initiative row */}
                  <Link href={`/initiatives/${initiative.id}`}>
                    <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-violet-50/60 to-transparent hover:from-violet-100/70 transition-all group border-b border-border/60">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <Compass className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold group-hover:text-violet-700 transition-colors truncate">
                            {initiative.name}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLES[initiative.status] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {initiative.status ?? 'Backlog'}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                        {initiative.owner && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">
                              {(initiative.owner.full_name || initiative.owner.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="hidden lg:inline">{initiative.owner.full_name || initiative.owner.email}</span>
                          </div>
                        )}
                        {initiative.target_date ? (
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {new Date(initiative.target_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">No target date</span>
                        )}
                        <span className="text-muted-foreground/60">{initiative.epics?.length ?? 0} epics</span>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </div>
                  </Link>

                  {/* Epics nested */}
                  {initiative.epics?.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {initiative.epics.map((epic: any) => {
                        const epicProgress = epic.progress ?? 0
                        return (
                          <Link key={epic.id} href={`/epics/${epic.id}`}>
                            <div className="flex items-center gap-4 px-6 py-3 pl-14 hover:bg-blue-50/40 transition-all group">
                              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                                <Layers className="w-3 h-3 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm font-medium group-hover:text-blue-600 transition-colors truncate">
                                    {epic.name}
                                  </p>
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLES[epic.status] ?? 'bg-gray-100 text-gray-500'}`}
                                  >
                                    {epic.status ?? 'Backlog'}
                                  </span>
                                </div>
                                {epicProgress > 0 && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-400 rounded-full"
                                        style={{ width: `${epicProgress}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{epicProgress}%</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                                {epic.owner && (
                                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                                    {(epic.owner.full_name || epic.owner.email || '?').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                {epic.target_date ? (
                                  <div className="flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3" />
                                    {new Date(epic.target_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/40">No date</span>
                                )}
                                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="px-14 py-3 text-xs text-muted-foreground italic">No epics linked yet</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
