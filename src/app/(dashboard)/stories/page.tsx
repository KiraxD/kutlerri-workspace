import { createClient } from '@/lib/supabase/server'
import { BookOpen, Plus, ArrowRight, Layers, Calendar, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { STATUS_DOT, STATUS_STYLES, STATUS_ORDER } from '@/lib/types'

const PRIORITY_ICON: Record<string, string> = {
  None: '—',
  Low: '↓',
  Medium: '↔',
  High: '↑',
  Urgent: '⚡',
}
const PRIORITY_COLOR: Record<string, string> = {
  None: 'text-gray-400',
  Low: 'text-blue-500',
  Medium: 'text-yellow-600',
  High: 'text-orange-500',
  Urgent: 'text-red-600',
}

export default async function StoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: orgMembers } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
  const orgIds = orgMembers?.map((m: any) => m.organization_id) ?? []

  let stories: any[] = []
  if (orgIds.length > 0) {
    const { data } = await supabase
      .from('stories')
      .select(
        '*, epic:epics(id, name, initiative:initiatives(id, name)), owner:profiles!owner_id(id, full_name, email), assignee:profiles!assignee_id(id, full_name, email)'
      )
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })
    stories = data ?? []
  }

  // Group by status
  const grouped: Record<string, any[]> = {}
  stories.forEach((s) => {
    const status = s.status ?? 'Backlog'
    if (!grouped[status]) grouped[status] = []
    grouped[status].push(s)
  })
  const sortedGroups = STATUS_ORDER.filter((s) => grouped[s]?.length > 0)

  const inProgress = grouped['In Progress']?.length ?? 0
  const done = grouped['Done']?.length ?? 0

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-gradient-to-r from-emerald-50 to-background">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading">Stories</h1>
            <p className="text-xs text-muted-foreground">User & business requirements — children of Epics</p>
          </div>
        </div>
        <Link href="/stories/new">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> New Story
          </Button>
        </Link>
      </div>

      {/* Stats bar */}
      {stories.length > 0 && (
        <div className="flex gap-6 px-8 py-3 border-b border-border/60 bg-muted/20 text-sm">
          <span className="text-muted-foreground">
            Total: <strong className="text-foreground">{stories.length}</strong>
          </span>
          <span className="text-muted-foreground">
            In Progress: <strong className="text-yellow-600">{inProgress}</strong>
          </span>
          <span className="text-muted-foreground">
            Done: <strong className="text-green-600">{done}</strong>
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-8">
        {stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[420px]">
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-emerald-400 opacity-60" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No stories yet</h2>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-6">
              Stories capture user or business requirements and live inside Epics. They contain Tasks which are
              broken into Sub Tasks.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              {[
                { icon: <Layers className="w-5 h-5 text-blue-500" />, label: 'Under Epics' },
                { icon: <Target className="w-5 h-5 text-emerald-500" />, label: 'Contains Tasks' },
                { icon: <Calendar className="w-5 h-5 text-violet-500" />, label: 'Track Dates' },
              ].map((f) => (
                <div key={f.label} className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex justify-center mb-2">{f.icon}</div>
                  <p className="text-xs text-muted-foreground font-medium">{f.label}</p>
                </div>
              ))}
            </div>
            <Link href="/stories/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Create Story
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedGroups.map((status) => (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                  <h2 className="text-sm font-semibold text-foreground">{status}</h2>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {grouped[status].length}
                  </span>
                </div>
                <div className="space-y-2">
                  {grouped[status].map((story: any) => (
                    <StoryRow key={story.id} story={story} />
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

function StoryRow({ story }: { story: any }) {
  const priority = story.priority ?? 'None'
  const progress = story.progress ?? 0

  return (
    <Link href={`/stories/${story.id}`}>
      <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer group">
        {/* Priority indicator */}
        <span className={`text-sm font-bold shrink-0 w-5 text-center ${PRIORITY_COLOR[priority]}`}>
          {PRIORITY_ICON[priority]}
        </span>

        {/* Status dot */}
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[story.status] ?? 'bg-gray-300'}`} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate group-hover:text-emerald-600 transition-colors">
            {story.name}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            {story.epic && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {story.epic.name}
              </span>
            )}
            {story.description && (
              <span className="text-xs text-muted-foreground truncate max-w-xs">{story.description}</span>
            )}
          </div>
          {/* Progress bar */}
          {progress > 0 && (
            <div className="mt-2 w-48 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Right metadata */}
        <div className="flex items-center gap-3 shrink-0">
          {story.due_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(story.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
          {story.owner && (
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
              {(story.owner.full_name || story.owner.email || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[story.status] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {story.status}
          </span>
          {progress > 0 && (
            <span className="text-xs text-muted-foreground">{progress}%</span>
          )}
          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  )
}
