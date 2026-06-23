import { createClient } from '@/lib/supabase/server'
import { LayoutGrid, Plus } from 'lucide-react'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Find all teams the user belongs to
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)

  const teamIds = teamMembers?.map(tm => tm.team_id) ?? []

  // Only query projects if user is in at least one team
  let projects: any[] = []
  if (teamIds.length > 0) {
    const { data, error } = await supabase
      .from('projects')
      .select('*, team:teams(*)')
      .in('team_id', teamIds)
      .order('created_at', { ascending: false })
    if (!error && data) projects = data
    if (error) console.error('Error loading projects:', error.message)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <LayoutGrid className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold">Projects</h1>
        {projects.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {projects.length}
          </span>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed border-border rounded-lg">
            <LayoutGrid className="w-10 h-10 mb-4 opacity-20" />
            <p className="text-sm font-medium">No projects yet</p>
            <p className="text-xs mt-1 opacity-60">Projects will appear here once created by your team.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: any) => (
              <div key={project.id} className="border border-border rounded-lg p-5 hover:bg-muted/30 hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{project.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>
                <div className="text-xs text-muted-foreground font-medium">
                  Team: {project.team?.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
