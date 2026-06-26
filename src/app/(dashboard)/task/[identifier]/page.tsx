import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { TaskAssignmentDisplay } from '@/components/task-assignment-display'
import { HierarchyBreadcrumb, HierarchyLevel } from '@/components/hierarchy-breadcrumb'
import { SubTasksSection } from '@/components/SubTasksSection'
import { TaskAcceptanceCard } from '@/components/task-acceptance-card'
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

import { EditDeleteControls } from '@/components/EditDeleteControls'
import { TaskStatusCheckbox } from '@/components/task-status-checkbox'

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
      assignee_ids,
      acceptance_status,
      created_at,
      updated_at,
      team:team_id(id, name, identifier, organization_id),
      creator:creator_id(id, email, full_name),
      assignee:assignee_id(id, email, full_name),
      project:project_id(id, name)
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

  // Fetch current user and pending notification details for acceptance display
  const { data: { user } } = await supabase.auth.getUser()
  const assigneeIds: string[] = (task as any).assignee_ids || (task.assignee_id ? [task.assignee_id] : [])
  const isAssignee = user && assigneeIds.includes(user.id)
  const isPending = (task as any).acceptance_status === 'pending'

  let notificationId = ""
  if (user && isAssignee && isPending) {
    const { data: notif } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('task_id', task.id)
      .eq('type', 'task_acceptance_required')
      .is('archived_at', null)
      .limit(1)
      .maybeSingle()
    if (notif) {
      notificationId = notif.id
    }
  }

  // Fetch profiles for all assignees
  let assignees: any[] = []
  if (assigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', assigneeIds)
    if (profiles) {
      assignees = profiles
    }
  }

  const creator: any = Array.isArray(task.creator) ? task.creator[0] : task.creator

  // Fetch sub-tasks for this task
  const { data: subTasksRaw } = await supabase
    .from('sub_tasks')
    .select('id, name, status, completed_at, assignee:assignee_id(id, full_name, email)')
    .eq('task_id', task.id)
    .order('created_at', { ascending: true })

  const subTasks = (subTasksRaw as any[])?.map(st => ({
    ...st,
    title: st.name, // Map database column name to UI property title
    assignee: Array.isArray(st.assignee) ? st.assignee[0] : st.assignee
  })) ?? []

  // Get story_id if the task has one (for cache revalidation)
  const storyId: string | undefined = (task as any).story_id ?? undefined

  return (
    <div className="flex flex-col h-full bg-background">
      <HierarchyBreadcrumb
        items={[
          { label: 'Organization', href: '/home' },
          ...(task.project_id ? [
            { label: (task.project as any)?.name || 'Project', href: `/projects/${task.project_id}?tab=tasks` }
          ] : [
            { label: (task.team as any)?.name || 'Team', href: `/teams` },
            { label: 'Tasks', href: '/my-tasks' }
          ]),
          { label: task.identifier, current: true },
        ]}
      />

      <div className="flex items-center gap-2 px-6 py-3 border-b border-border text-sm text-muted-foreground bg-gradient-to-r from-muted/50 to-background">
        <HierarchyLevel level="task" />
        <div className="flex-1" />
        <EditDeleteControls
          entityId={task.id}
          entityType="task"
          initialData={{
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            estimate: task.estimate,
          }}
          redirectOnDelete={task.project_id ? `/projects/${task.project_id}?tab=tasks` : "/my-tasks"}
        />
        <div className="h-4 w-px bg-border mx-2" />
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
            {isAssignee && isPending && (
              <div className="mb-6">
                <TaskAcceptanceCard
                  taskId={task.id}
                  taskIdentifier={task.identifier}
                  taskTitle={task.title}
                  assignedBy={creator?.full_name || creator?.email || 'Someone'}
                  notificationId={notificationId}
                />
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <TaskStatusCheckbox taskId={task.id} initialStatus={task.status} />
              <h1 className={`text-2xl font-semibold text-foreground ${(task.status === 'done' || task.status === 'Done') ? 'line-through text-muted-foreground/60' : ''}`}>
                {task.title}
              </h1>
            </div>

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
            <TaskAssignmentDisplay
              taskId={task.id}
              teamId={task.team_id}
              currentAssignees={assignees}
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