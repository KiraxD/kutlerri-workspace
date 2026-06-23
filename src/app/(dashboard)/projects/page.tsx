import { createClient } from '@/lib/supabase/server'
import { Briefcase, Plus, ArrowRight, GitBranch, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-500',
  planned: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  paused: 'bg-orange-100 text-orange-600',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-400',
}

const STATUS_DOT: Record<string, string> = {
  backlog: 'bg-gray-300',
  planned: 'bg-sky-400',
  in_progress: 'bg-yellow-400',
  paused: 'bg-orange-400',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-200',
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)

  const teamIds = teamMembers?.map(tm => tm.team_id) ?? []

  let projects: any[] = []
  if (teamIds.length > 0) {
    const { data } = await supabase
      .from('projects')
      .select('*, team:teams(id, name, identifier)')
      .in('team_id', teamIds)
      .order('created_at', { ascending: false })
    projects = data ?? []
  }

  // Group by status
  const grouped: Record<string, any[]> = {}
  const order = ['in_progress', 'planned', 'backlog', 'paused', 'completed', 'cancelled']
  projects.forEach(p => {
    const s = p.status ?? 'backlog'
    if (!grouped[s]) grouped[s] = []
    grouped[s].push(p)
  })
  const sortedGroups = order.filter(s => grouped[s]?.length > 0)

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-gradient-to-r from-blue-50 to-background">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading">Projects</h1>
            <p className="text-xs text-muted-foreground">All projects across your teams</p>
          </div>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {/* Stats */}
      {projects.length > 0 && (
        <div className="flex gap-6 px-8 py-3 border-b border-border/60 bg-muted/20 text-sm">
          <span className="text-muted-foreground">Total: <strong className="text-foreground">{projects.length}</strong></span>
          <span className="text-muted-foreground">Active: <strong className="text-yellow-600">{grouped['in_progress']?.length ?? 0}</strong></span>
          <span className="text-muted-foreground">Completed: <strong className="text-green-600">{grouped['completed']?.length ?? 0}</strong></span>
        </div>
      )}

      <div className="flex-1 p-8">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <Briefcase className="w-10 h-10 text-blue-400 opacity-60" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
              Projects organize your team's work. Create a team first, then create your first project.
            </p>
            {teamIds.length === 0 ? (
              <Link href="/teams"><Button>Create a Team First</Button></Link>
            ) : (
              <Button className="gap-2"><Plus className="w-4 h-4" /> New Project</Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {sortedGroups.map(status => (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                  <h2 className="text-sm font-semibold text-foreground capitalize">{status.replace('_', ' ')}</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{grouped[status].length}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[status].map((project: any) => (
                    <div key={project.id} className="border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group bg-card">
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {project.team?.identifier?.slice(0, 2) || 'PR'}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[project.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {project.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{project.name}</h3>
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                        {project.description || 'No description provided.'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{project.team?.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
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
