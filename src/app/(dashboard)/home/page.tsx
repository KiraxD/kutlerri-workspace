import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  CheckCircle2, Bell, Briefcase, Target, TrendingUp,
  Clock, ArrowRight, Zap, Users, Layers, Compass
} from 'lucide-react'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch recent tasks assigned to user
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select('id, identifier, title, status, priority, updated_at')
    .eq('assignee_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(5)

  // Fetch unread notifications count
  const { count: notifCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)
    .is('archived_at', null)

  // Fetch organization role
  const { data: orgMembers } = await supabase
    .from('organization_members')
    .select('role, organization:organizations(name, id)')
    .eq('user_id', user.id)
    .limit(1)
  
  const orgRole = orgMembers?.[0]?.role || null
  const organization = orgMembers?.[0]?.organization

  // Fetch team memberships with team roles
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_role, team:teams(id, name, identifier)')
    .eq('user_id', user.id)
  const teams = teamMembers?.map((tm: any) => tm.team) ?? []
  const teamRoles = teamMembers?.map((tm: any) => ({ team: tm.team.name, role: tm.team_role })) ?? []

  // Fetch recent projects
  const teamIds = teams.map((t: any) => t.id)
  let recentProjects: any[] = []
  if (teamIds.length > 0) {
    const { data } = await supabase
      .from('projects')
      .select('id, name, status, team:teams(name)')
      .in('team_id', teamIds)
      .order('created_at', { ascending: false })
      .limit(4)
    recentProjects = data ?? []
  }

  const name = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there'
  const hour = new Date().getUTCHours() + 5 // IST offset
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const statusColors: Record<string, string> = {
    'Todo': 'bg-gray-100 text-gray-600',
    'In Progress': 'bg-yellow-100 text-yellow-700',
    'Review': 'bg-blue-100 text-blue-700',
    'Done': 'bg-green-100 text-green-700',
    'Backlog': 'bg-gray-100 text-gray-500',
    'Blocked': 'bg-red-100 text-red-600',
    'Testing': 'bg-purple-100 text-purple-700',
    'Cancelled': 'bg-gray-100 text-gray-400',
    'Ready': 'bg-sky-100 text-sky-700',
  }

  const priorityDot: Record<string, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-400',
    medium: 'bg-yellow-400',
    low: 'bg-blue-400',
    no_priority: 'bg-gray-300',
  }

  return (
    <div className="flex flex-col bg-background">
      {/* Hero Header */}
      <div className="relative px-8 pt-10 pb-8 border-b border-border bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <p className="text-sm text-muted-foreground mb-1">{greeting},</p>
        <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground capitalize">
          {name} 👋
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">Here's what's happening in your workspace today.</p>

        {/* Roles Display */}
        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-3">Your Roles & Access</p>
          <div className="flex flex-wrap gap-3">
            {/* Organization Role */}
            {orgRole && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-full">
                <span className="text-xs font-semibold text-purple-300">Organization</span>
                <span className="px-2 py-0.5 bg-purple-500/40 rounded-full text-xs font-bold text-purple-100 capitalize">
                  {orgRole.replace(/_/g, ' ')}
                </span>
              </div>
            )}
            
            {/* Team Roles */}
            {teamRoles.length > 0 && (
              teamRoles.map((tr, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-full">
                  <span className="text-xs font-semibold text-blue-300">{tr.team}</span>
                  <span className="px-2 py-0.5 bg-blue-500/40 rounded-full text-xs font-bold text-blue-100 capitalize">
                    {tr.role.replace(/_/g, ' ')}
                  </span>
                </div>
              ))
            )}

            {/* No Role Message */}
            {!orgRole && teamRoles.length === 0 && (
              <div className="text-xs text-muted-foreground italic">
                Awaiting role assignment from administrator
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 mt-6 flex-wrap">
          <StatChip icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="My Tasks" value={recentTasks?.length ?? 0} href="/my-tasks" color="text-green-600" />
          <StatChip icon={<Bell className="w-3.5 h-3.5" />} label="Unread" value={notifCount ?? 0} href="/inbox" color="text-primary" />
          <StatChip icon={<Briefcase className="w-3.5 h-3.5" />} label="Projects" value={recentProjects.length} href="/projects" color="text-blue-600" />
          <StatChip icon={<Users className="w-3.5 h-3.5" />} label="Teams" value={teams.length} href="/teams" color="text-purple-600" />
        </div>
      </div>

      <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="My Tasks"
            icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
            href="/my-tasks"
            linkLabel="View all"
          >
            {!recentTasks || recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No tasks assigned to you yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentTasks.map((task: any) => (
                  <Link
                    key={task.id}
                    href={`/task/${task.identifier}`}
                    className="flex items-center gap-3 py-2.5 px-1 hover:bg-muted/40 rounded-md transition-colors group"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot[task.priority] ?? 'bg-gray-300'}`} />
                    <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">{task.identifier}</span>
                    <span className="flex-1 text-sm font-medium truncate group-hover:text-primary transition-colors">{task.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[task.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {task.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Recent Projects */}
          <SectionCard
            title="Recent Projects"
            icon={<Briefcase className="w-4 h-4 text-blue-500" />}
            href="/projects"
            linkLabel="View all"
          >
            {recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Briefcase className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No projects yet. Create your first team to get started.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {recentProjects.map((p: any) => (
                  <Link
                    key={p.id}
                    href="/projects"
                    className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-primary/30 hover:bg-muted/30 transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.team?.name}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize shrink-0 ml-2">{p.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Quick Actions
            </h3>
            <div className="space-y-1">
              <QuickAction href="/tasks/new" icon={<CheckCircle2 className="w-4 h-4" />} label="Create Task" />
              <QuickAction href="/initiatives" icon={<Compass className="w-4 h-4" />} label="View Initiatives" />
              <QuickAction href="/epics" icon={<Layers className="w-4 h-4" />} label="View Epics" />
              <QuickAction href="/vault" icon={<Target className="w-4 h-4" />} label="Open Vault" />
              <QuickAction href="/roadmap" icon={<TrendingUp className="w-4 h-4" />} label="View Roadmap" />
              <QuickAction href="/teams" icon={<Users className="w-4 h-4" />} label="Manage Teams" />
            </div>
          </div>

          {/* Teams */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              Your Teams
            </h3>
            {teams.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-3">No teams yet.</p>
                <Link
                  href="/teams"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Create your first team →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {teams.map((team: any) => (
                  <div key={team.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {team.identifier?.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{team.identifier}</p>
                    </div>
                  </div>
                ))}
                <Link href="/teams" className="flex items-center gap-1 text-xs text-primary hover:underline pt-1 pl-1">
                  Manage teams <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Recent Activity
            </h3>
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">Activity feed coming soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatChip({ icon, label, value, href, color }: { icon: React.ReactNode; label: string; value: number; href: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
    >
      <span className={color}>{icon}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </Link>
  )
}

function SectionCard({ title, icon, href, linkLabel, children }: {
  title: string; icon: React.ReactNode; href: string; linkLabel: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {icon} {title}
        </h3>
        <Link href={href} className="text-xs text-primary hover:underline flex items-center gap-1">
          {linkLabel} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 text-sm text-muted-foreground hover:text-foreground transition-colors group"
    >
      <span className="text-muted-foreground group-hover:text-primary transition-colors">{icon}</span>
      {label}
      <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}
