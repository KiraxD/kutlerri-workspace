import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen, ArrowLeft, Layers, Compass, Calendar, Target,
  CheckCircle2, Circle, Clock, AlertTriangle, CheckCheck,
} from 'lucide-react'
import { STATUS_DOT, STATUS_STYLES } from '@/lib/types'

const PRIORITY_LABEL: Record<string, { icon: string; color: string }> = {
  None:   { icon: '—',  color: 'text-gray-400' },
  Low:    { icon: '↓',  color: 'text-blue-500' },
  Medium: { icon: '↔', color: 'text-yellow-600' },
  High:   { icon: '↑',  color: 'text-orange-500' },
  Urgent: { icon: '⚡', color: 'text-red-600' },
}

const TASK_STATUS_ICON: Record<string, React.ReactNode> = {
  Done: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  Cancelled: <CheckCircle2 className="w-4 h-4 text-gray-300" />,
  Blocked: <AlertTriangle className="w-4 h-4 text-red-500" />,
  'In Progress': <Clock className="w-4 h-4 text-yellow-500" />,
}

export default async function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: story, error } = await supabase
    .from('stories')
    .select(
      '*, epic:epics(id, name, initiative:initiatives(id, name)), owner:profiles!owner_id(id, full_name, email), assignee:profiles!assignee_id(id, full_name, email)'
    )
    .eq('id', id)
    .single()

  if (error || !story) notFound()

  // Fetch tasks belonging to this story
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, assignee:profiles!assignee_id(id, full_name, email), progress')
    .eq('story_id', id)
    .order('created_at', { ascending: false })

  const taskList = tasks ?? []
  const totalTasks = taskList.length
  const doneTasks = taskList.filter((t: any) => t.status === 'Done').length
  const progress = story.progress ?? (totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0)

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Header */}
      <div className="px-8 py-5 border-b border-border bg-gradient-to-r from-emerald-50 to-background">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/stories">
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          </Link>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {story.epic?.initiative && (
              <>
                <Link href="/initiatives" className="hover:text-foreground transition-colors flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  {story.epic.initiative.name}
                </Link>
                <span>→</span>
              </>
            )}
            {story.epic && (
              <>
                <Link href={`/epics/${story.epic.id}`} className="hover:text-foreground transition-colors flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {story.epic.name}
                </Link>
                <span>→</span>
              </>
            )}
            <span className="text-foreground font-medium flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-emerald-600" />
              {story.name}
            </span>
          </nav>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[story.status] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {story.status ?? 'Backlog'}
              </span>
              {story.priority && story.priority !== 'None' && (
                <span className={`text-xs font-semibold ${PRIORITY_LABEL[story.priority]?.color}`}>
                  {PRIORITY_LABEL[story.priority]?.icon} {story.priority}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{story.name}</h1>
            {story.description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{story.description}</p>
            )}
          </div>

          {/* Meta sidebar */}
          <div className="ml-8 shrink-0 space-y-3 text-xs">
            {story.owner && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-foreground font-medium w-16">Owner</span>
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                  {(story.owner.full_name || story.owner.email || '?').charAt(0).toUpperCase()}
                </div>
                <span>{story.owner.full_name || story.owner.email}</span>
              </div>
            )}
            {story.assignee && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-foreground font-medium w-16">Assignee</span>
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                  {(story.assignee.full_name || story.assignee.email || '?').charAt(0).toUpperCase()}
                </div>
                <span>{story.assignee.full_name || story.assignee.email}</span>
              </div>
            )}
            {story.due_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-foreground font-medium w-16">Due</span>
                <Calendar className="w-3 h-3" />
                <span>{new Date(story.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
            {story.estimate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-foreground font-medium w-16">Estimate</span>
                <span>{story.estimate} pts</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{doneTasks} of {totalTasks} tasks done</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Tasks</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{totalTasks}</span>
        </div>

        {taskList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-xl text-muted-foreground">
            <Target className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm font-medium">No tasks yet</p>
            <p className="text-xs opacity-60 mt-1">Create tasks and link them to this story via story_id</p>
          </div>
        ) : (
          <div className="space-y-2">
            {taskList.map((task: any) => {
              const taskProgress = task.progress ?? 0
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-emerald-200 hover:shadow-sm transition-all group"
                >
                  {TASK_STATUS_ICON[task.status] ?? <Circle className="w-4 h-4 text-gray-300" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    {taskProgress > 0 && (
                      <div className="mt-1 h-1 w-32 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${taskProgress}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.assignee && (
                      <div className="w-5 h-5 rounded-full bg-muted text-foreground flex items-center justify-center text-[10px] font-bold">
                        {(task.assignee.full_name || task.assignee.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status] ?? 'bg-gray-100 text-gray-500'}`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
