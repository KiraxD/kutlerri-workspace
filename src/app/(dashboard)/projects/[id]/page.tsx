import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Briefcase, Users, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-500',
  planned: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  paused: 'bg-orange-100 text-orange-600',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-400',
}

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-gradient-to-r from-blue-50 to-background">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading">{project.name}</h1>
              <p className="text-xs text-muted-foreground">{project.team?.name}</p>
            </div>
          </div>
        </div>
        <Badge className="capitalize">{project.status?.replace('_', ' ')}</Badge>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left column - Project Details */}
          <div className="col-span-2 space-y-6">
            {/* Description */}
            {project.description && (
              <div className="border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </h3>
                <p className="text-sm text-foreground">{project.description}</p>
              </div>
            )}

            {/* Project Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge className="capitalize">{project.status?.replace('_', ' ')}</Badge>
              </div>
              <div className="border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Target Date
                </p>
                <p className="text-sm font-medium">{formatDate(project.target_date)}</p>
              </div>
              <div className="border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm font-medium">{formatDate(project.created_at)}</p>
              </div>
              <div className="border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Team</p>
                <p className="text-sm font-medium">{project.team?.name}</p>
              </div>
            </div>
          </div>

          {/* Right column - Team Members */}
          <div className="col-span-1">
            <div className="border border-border rounded-xl p-6 sticky top-8">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team Members ({members.length})
              </h3>
              <div className="space-y-3">
                {members.length > 0 ? (
                  members.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={undefined} />
                        <AvatarFallback>
                          {member.profile?.full_name?.slice(0, 2).toUpperCase() ||
                            member.profile?.email?.slice(0, 2).toUpperCase() ||
                            'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.profile?.full_name || member.profile?.email}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {member.role?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No members yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
