import { createClient } from '@/lib/supabase/server'
import { LayoutGrid } from 'lucide-react'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Find all projects for the teams the user belongs to
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)

  const teamIds = teamMembers?.map(tm => tm.team_id) || []

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*, team:teams(*)')
    .in('team_id', teamIds)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <LayoutGrid className="w-5 h-5" />
          Projects
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {error ? (
          <div className="text-red-500">Failed to load projects.</div>
        ) : !projects || projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed border-border rounded-lg">
            <LayoutGrid className="w-10 h-10 mb-4 opacity-20" />
            <p>No projects found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: any) => (
              <div key={project.id} className="border border-border rounded-lg p-5 hover:bg-muted/30 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold group-hover:text-foreground">{project.name}</h3>
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
