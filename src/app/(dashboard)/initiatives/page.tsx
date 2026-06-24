import { createClient } from '@/lib/supabase/server'
import { Compass, Plus, Target, ArrowRight, TrendingUp, Calendar, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { STATUS_STYLES, STATUS_DOT } from '@/lib/types'


export default async function InitiativesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: orgMembers } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id)
  const orgIds = orgMembers?.map((organizationMember: any) => organizationMember.organization_id) ?? []

  let initiatives: any[] = []
  if (orgIds.length > 0) {
    const { data } = await supabase
      .from('initiatives')
      .select('*, owner:profiles!owner_id(id, full_name, email, avatar_url), epics(id)')
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })
    initiatives = data ?? []
  }

  const grouped: Record<string, any[]> = {}
  const order = ['In Progress', 'Review', 'Todo', 'Ready', 'Backlog', 'Blocked', 'Testing', 'Done', 'Cancelled']
  initiatives.forEach((initiative) => {
    const status = initiative.status ?? 'Backlog'
    if (!grouped[status]) grouped[status] = []
    grouped[status].push(initiative)
  })
  const sortedGroups = order.filter((status) => grouped[status]?.length > 0)

  return (
    <div className="flex flex-col bg-background">
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-gradient-to-r from-violet-50 to-background">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
            <Compass className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading">Initiatives</h1>
            <p className="text-xs text-muted-foreground">Strategic goals that drive epics and tasks</p>
          </div>
        </div>
        <Link href="/initiatives/new">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> New Initiative
          </Button>
        </Link>
      </div>

      {initiatives.length > 0 && (
        <div className="flex gap-6 px-8 py-3 border-b border-border/60 bg-muted/20 text-sm">
          <span className="text-muted-foreground">
            Total: <strong className="text-foreground">{initiatives.length}</strong>
          </span>
          <span className="text-muted-foreground">
            In Progress: <strong className="text-yellow-600">{grouped['In Progress']?.length ?? 0}</strong>
          </span>
          <span className="text-muted-foreground">
            Done: <strong className="text-green-600">{grouped.Done?.length ?? 0}</strong>
          </span>
          <span className="text-muted-foreground">
            Blocked: <strong className="text-red-600">{grouped.Blocked?.length ?? 0}</strong>
          </span>
        </div>
      )}

      <div className="flex-1 p-8">
        {initiatives.length === 0 ? (
          <EmptyState
            icon={<Compass className="w-10 h-10 text-violet-400 opacity-60" />}
            title="No initiatives yet"
            description="Initiatives are high-level strategic goals. They contain epics, which contain tasks. Start by creating your first initiative."
            features={[
              { icon: <Target className="w-5 h-5 text-violet-500" />, label: 'Strategic Goals' },
              { icon: <TrendingUp className="w-5 h-5 text-blue-500" />, label: 'Progress Tracking' },
              { icon: <ArrowRight className="w-5 h-5 text-green-500" />, label: 'Linked to Epics' },
            ]}
            action={
              <Link href="/initiatives/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Create Initiative
                </Button>
              </Link>
            }
            prereq={null}
          />
        ) : (
          <div className="space-y-8">
            {sortedGroups.map((status) => (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                  <h2 className="text-sm font-semibold text-foreground">{status}</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{grouped[status].length}</span>
                </div>
                <div className="space-y-2">
                  {grouped[status].map((initiative: any) => (
                    <InitiativeRow key={initiative.id} initiative={initiative} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InitiativeRow({ initiative }: { initiative: any }) {
  const progress = initiative.progress ?? 0
  const epicCount = initiative.epics?.length ?? 0
  return (
    <Link href={`/initiatives/${initiative.id}`}>
      <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-violet-400/50 hover:shadow-sm transition-all cursor-pointer group">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[initiative.status] ?? 'bg-gray-300'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate group-hover:text-violet-600 transition-colors">{initiative.name}</p>
          {initiative.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{initiative.description}</p>}
          {progress > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{progress}%</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {epicCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Layers className="w-3 h-3" />
              {epicCount} epic{epicCount !== 1 ? 's' : ''}
            </div>
          )}
          {initiative.target_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(initiative.target_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          )}
          {initiative.owner && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">
                {(initiative.owner.full_name || initiative.owner.email || '?').charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block">{initiative.owner.full_name?.split(' ')[0] || 'Owner'}</span>
            </div>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[initiative.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {initiative.status}
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ icon, title, description, features, action, prereq }: any) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">{icon}</div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground text-sm text-center max-w-md mb-6">{description}</p>
      {features && (
        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
          {features.map((feature: any) => (
            <div key={feature.label} className="p-4 rounded-xl border border-border bg-muted/20">
              <div className="flex justify-center mb-2">{feature.icon}</div>
              <p className="text-xs text-muted-foreground font-medium">{feature.label}</p>
            </div>
          ))}
        </div>
      )}
      {prereq ?? action}
    </div>
  )
}