import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ProjectDetailClient from './ProjectDetailClient'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Get project details
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      team:teams(id, name, identifier, organization_id)
    `)
    .eq('id', id)
    .single()

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p>Project not found</p>
          <Link href="/projects">
            <Button variant="link" className="mt-2">Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Get team members
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('user_id, role')
    .eq('team_id', project.team_id)

  // Get profile information for team members
  let members: any[] = []
  if (teamMembers && teamMembers.length > 0) {
    const userIds = teamMembers.map((tm) => tm.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)

    if (profiles) {
      const profileMap = new Map(profiles.map((p) => [p.id, p]))
      members = teamMembers.map((tm) => ({
        ...tm,
        profile: profileMap.get(tm.user_id),
      }))
    }
  }

  // Fetch Initiatives for this project
  const { data: initiatives } = await supabase
    .from('initiatives')
    .select('*, owner:profiles!owner_id(id, full_name, email, avatar_url)')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  // Fetch Epics for this project
  const { data: epics } = await supabase
    .from('epics')
    .select('*, owner:profiles!owner_id(id, full_name, email), initiative:initiatives(id, name)')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  // Fetch Stories linked to those Epics
  let stories: any[] = []
  if (epics && epics.length > 0) {
    const epicIds = epics.map((e) => e.id)
    const { data: storyData } = await supabase
      .from('stories')
      .select('*, epic:epics(id, name, initiative:initiatives(id, name))')
      .in('epic_id', epicIds)
      .order('created_at', { ascending: false })
    stories = storyData ?? []
  }

  // Fetch Tasks for the project's team
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, creator:profiles!creator_id(id, full_name, email), assignee:profiles!assignee_id(id, full_name, email)')
    .eq('team_id', project.team_id)
    .order('created_at', { ascending: false })

  return (
    <ProjectDetailClient
      project={project}
      members={members}
      initiatives={initiatives ?? []}
      epics={epics ?? []}
      stories={stories}
      tasks={tasks ?? []}
    />
  )
}
