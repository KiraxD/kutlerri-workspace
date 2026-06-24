import { createClient } from '@/lib/supabase/server'
import { Layers, Plus, ArrowRight, Target, Compass, Calendar, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  Backlog: 'bg-gray-100 text-gray-500',
  Ready: 'bg-sky-100 text-sky-700',
  Todo: 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Review: 'bg-blue-100 text-blue-700',
  Testing: 'bg-purple-100 text-purple-700',
  Blocked: 'bg-red-100 text-red-600',
  Done: 'bg-green-100 text-green-700',
  Cancelled: 'bg-gray-100 text-gray-400',
}

const STATUS_DOT: Record<string, string> = {
  Backlog: 'bg-gray-300',
  Ready: 'bg-sky-400',
  Todo: 'bg-gray-400',
  'In Progress': 'bg-yellow-400',
  Review: 'bg-blue-400',
  Testing: 'bg-purple-400',
  Blocked: 'bg-red-500',
  Done: 'bg-green-500',
  Cancelled: 'bg-gray-200',
}

export default async function EpicsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: orgMembers } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id)
  const orgIds = orgMembers?.map((organizationMember: any) => organizationMember.organization_id) ?? []

  let epics: any[] = []
  if (orgIds.length > 0) {
    const { data } = await supabase
      .from('epics')
      .select('*, initiative:initiatives(id, name), owner:profiles!owner_id(id, full_name, email)')
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })
    epics = data ?? []
  }

  const taskCounts: Record<string, number> = {}
  if (epics.length > 0) {
    const epicIds = epics.map((epic: any) => epic.id)
    const { data: tasks } = await supabase.from('tasks').select('epic_id').in('epic_id', epicIds)
    tasks?.forEach((task: any) => {
      if (task.epic_id) taskCounts[task.epic_id] = (taskCounts[task.epic_id] || 0) + 1
    })
  }

  const grouped: Record<string, any[]> = {}
  const order = ['In Progress', 'Review', 'Todo', 'Ready', 'Backlog', 'Blocked', 'Testing', 'Done', 'Cancelled']
  epics.forEach((epic) => {
    const status = epic.status ?? 'Backlog'
    if (!grouped[status]) grouped[status] = []
    grouped[status].push(epic)
  })
  const sortedGroups = order.filter((status) => grouped[status]?.length > 0)

  return (
    <div className="flex flex-col bg-background">
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-gradient-to-r from-blue-50 to-background">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading">Epics</h1>
            <p className="text-xs text-muted-foreground">Large bodies of work spanning multiple tasks</p>
          </div>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> New Epic
        </Button>
      </div>

      {epics.length > 0 && (
        <div className="flex gap-6 px-8 py-3 border-b border-border/60 bg-muted/20 text-sm">
          <span className="text-muted-foreground">
            Total: <strong className="text-foreground">{epics.length}</strong>
          </span>
          <span className="text-muted-foreground">
            In Progress: <strong className="text-yellow-600">{grouped['In Progress']?.length ?? 0}</strong>
          </span>
          <span className="text-muted-foreground">
            Done: <strong className="text-green-600">{grouped.Done?.length ?? 0}</strong>
          </span>
          <span className="text-muted-foreground">
            Total Tasks: <strong className="text-foreground">{Object.values(taskCounts).reduce((left, right) => left + right, 0)}</strong>
          </span>
        </div>
      )}

      <div className="flex-1 p-8">
        {epics.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <Layers className="w-10 h-10 text-blue-400 opacity-60" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No epics yet</h2>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-6">
              Epics group related tasks into large bodies of work. They roll up into Initiatives to give you a full strategic view.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              {[
                { icon: <GitBranch className="w-5 h-5 text-blue-500" />, label: 'Links to Tasks' },
                { icon: <Compass className="w-5 h-5 text-violet-500" />, label: 'Under Initiatives' },
                { icon: <Target className="w-5 h-5 text-green-500" />, label: 'Track Progress' },
              ].map((feature) => (
                <div key={feature.label} className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex justify-center mb-2">{feature.icon}</div>
                  <p className="text-xs text-muted-foreground font-medium">{feature.label}</p>
                </div>
              ))}
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Create Epic
            </Button>
          </div>
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
                  {grouped[status].map((epic: any) => (
                    <EpicRow key={epic.id} epic={epic} taskCount={taskCounts[epic.id] ?? 0} />
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

function EpicRow({ epic, taskCount }: { epic: any; taskCount: number }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[epic.status] ?? 'bg-gray-300'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate group-hover:text-blue-600 transition-colors">{epic.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {epic.initiative && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Compass className="w-3 h-3" />
              {epic.initiative.name}
            </span>
          )}
          {epic.description && <span className="text-xs text-muted-foreground truncate">{epic.description}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {taskCount > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            {taskCount} tasks
          </span>
        )}
        {epic.target_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(epic.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
        {epic.owner && (
          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
            {(epic.owner.full_name || epic.owner.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[epic.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {epic.status}
        </span>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  )
}