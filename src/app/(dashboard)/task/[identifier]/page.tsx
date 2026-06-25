import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { TaskAssignmentDisplay } from '@/components/task-assignment-display'
import { HierarchyBreadcrumb, HierarchyLevel } from '@/components/hierarchy-breadcrumb'
import { SubTasksSection } from '@/components/SubTasksSection'
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Circle,
  CircleDashed,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  TestTube,
  XCircle,
} from 'lucide-react'

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ identifier: string }>
}) {
  const { identifier } = await params
  const supabase = await createClient()

  // Fetch the task with basic related data (no complex relationships that may cause schema cache issues)
  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      id,
      identifier,
      title,
      description,
      status,
      priority,
      estimate,
      team_id,
      project_id,
      cycle_id,
      story_id,
      creator_id,
      assignee_id,
      created_at,
      updated_at,
      team:team_id(id, name, identifier, organization_id),
      creator:creator_id(id, email, full_name),
      assignee:assignee_id(id, email, full_name)
    `)
    .eq('identifier', identifier)
    .single()

  if (error) {
    console.error('Task fetch error:', error)
    return <div className="flex items-center justify-center h-full text-muted-foreground">Error loading task: {error.message}</div>
  }

  if (!task) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Task not found</div>
  }

  // Fetch sub-tasks for this task
  const { data: subTasksRaw } = await supabase
    .from('sub_tasks')
    .select('id, title, status, completed_at, assignee:assignee_id(id, full_name, email)')
    .eq('task_id', task.id)
    .order('created_at', { ascending: true })

  const subTasks = subTasksRaw ?? []

  // Get story_id if the task has one (for cache revalidation)
  const storyId: string | undefined = (task as any).story_id ?? undefined

  return (
    <div className="flex flex-col h-full bg-background">
      <HierarchyBreadcrumb
        items={[
          { label: 'Organization', href: '/home' },
          { label: (task.team as any)?.name || 'Team', href: `/teams` },
          { label: 'Tasks', href: '/my-tasks' },
          { label: task.identifier, current: true },
        ]}
      />

      <div className="flex items-center gap-2 px-6 py-3 border-b border-border text-sm text-muted-foreground bg-gradient-to-r from-muted/50 to-background">
        <HierarchyLevel level="task" />
        <div className="flex-1" />
        <span className="font-medium hover:text-foreground cursor-pointer">{(task.team as any)?.identifier}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="font-mono uppercase">{task.identifier}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2">
          <Copy className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold mb-4 text-foreground">{task.title}</h1>

            <div className="prose prose-sm dark:prose-invert max-w-none mb-8 text-foreground/90">
              {task.description ? (
                <p className="whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-muted-foreground italic">No description provided.</p>
              )}
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="font-semibold mb-4">Activity</h3>
              <div className="text-sm text-muted-foreground">No activity yet.</div>
            </div>
          </div>
        </div>

        <aside className="w-[300px] border-l border-border bg-muted/10 flex flex-col p-4 gap-6 overflow-y-auto">
          <div className="space-y-4 p-3 bg-gradient-to-br from-blue-50/30 to-background border border-blue-200/30 rounded-lg">
            <h3 className="text-xs font-semibold uppercase text-blue-700 tracking-wider">👤 Assign Task</h3>

            <TaskAssignmentDisplay
              taskId={task.id}
              teamId={task.team_id}
              currentAssigneeId={task.assignee_id}
              currentAssigneeName={(task.assignee as any)?.full_name}
              currentAssigneeEmail={(task.assignee as any)?.email}
            />

            <p className="text-xs text-muted-foreground italic">
              Super Admin/Admin can assign to anyone. Managers can assign to team members only.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Properties</h3>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground w-24">Status</span>
                <div className="flex items-center gap-2 flex-1 justify-start">
                  <StatusIcon status={task.status} />
                  <span>{getStatusLabel(task.status)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground w-24">Priority</span>
                <div className="flex items-center gap-2 flex-1 justify-start">
                  <PriorityIcon priority={task.priority} />
                  <span className="capitalize">{task.priority.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground w-24">Estimate</span>
                <div className="flex items-center gap-2 flex-1 justify-start">
                  {task.estimate ? (
                    <Badge variant="outline" className="font-mono">
                      {task.estimate}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Sub Tasks</h3>
            <SubTasksSection
              taskId={task.id}
              initialSubTasks={subTasks}
              storyId={storyId}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Backlog: 'Backlog',
    Ready: 'Ready',
    Todo: 'Todo',
    'In Progress': 'In Progress',
    Review: 'Review',
    Testing: 'Testing',
    Blocked: 'Blocked',
    Done: 'Done',
    Cancelled: 'Cancelled',
    backlog: 'Backlog',
    todo: 'Todo',
    in_progress: 'In Progress',
    in_review: 'Review',
    done: 'Done',
    canceled: 'Cancelled',
  }

  return labels[status] || status
}

function PriorityIcon({ priority }: { priority: string }) {
  switch (priority) {
    case 'urgent':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    case 'high':
      return <ArrowUp className="w-4 h-4 text-orange-500" />
    case 'medium':
      return <ArrowRight className="w-4 h-4 text-yellow-500" />
    case 'low':
      return <ArrowDown className="w-4 h-4 text-blue-500" />
    default:
      return <div className="w-4 h-4 flex items-center justify-center text-muted-foreground/50">-</div>
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'Backlog':
    case 'backlog':
      return <CircleDashed className="w-4 h-4 text-muted-foreground" />
    case 'Ready':
      return <Circle className="w-4 h-4 text-sky-400" />
    case 'Todo':
    case 'todo':
      return <Circle className="w-4 h-4 text-muted-foreground" />
    case 'In Progress':
    case 'in_progress':
      return <Circle className="w-4 h-4 text-yellow-500" />
    case 'Review':
    case 'in_review':
      return <Eye className="w-4 h-4 text-blue-500" />
    case 'Testing':
      return <TestTube className="w-4 h-4 text-purple-500" />
    case 'Blocked':
      return <XCircle className="w-4 h-4 text-red-500" />
    case 'Done':
    case 'done':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case 'Cancelled':
    case 'canceled':
      return <XCircle className="w-4 h-4 text-muted-foreground/60" />
    default:
      return <Circle className="w-4 h-4 text-muted-foreground" />
  }
}