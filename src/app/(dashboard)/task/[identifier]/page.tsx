import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { TaskAssignmentDisplay } from '@/components/task-assignment-display'
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

  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      *,
      creator:profiles!creator_id(*),
      assignee:profiles!assignee_id(*),
      team:teams(*),
      relations_out:task_relations!task_relations_task_id_fkey(
        relation_type,
        related_task:tasks!task_relations_related_task_id_fkey(identifier, title, status)
      ),
      relations_in:task_relations!task_relations_related_task_id_fkey(
        relation_type,
        task:tasks!task_relations_task_id_fkey(identifier, title, status)
      )
    `)
    .eq('identifier', identifier)
    .single()

  if (error || !task) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Task not found</div>
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border text-sm text-muted-foreground">
        <span className="font-medium hover:text-foreground cursor-pointer">{task.team?.identifier}</span>
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

              <TaskAssignmentDisplay
                taskId={task.id}
                teamId={task.team_id}
                currentAssigneeId={task.assignee_id}
                currentAssigneeName={task.assignee?.full_name}
                currentAssigneeEmail={task.assignee?.email}
              />

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
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Relations</h3>
            <div className="text-sm flex flex-col gap-2">
              {(!task.relations_out || task.relations_out.length === 0) &&
              (!task.relations_in || task.relations_in.length === 0) ? (
                <div className="text-muted-foreground">No relations added.</div>
              ) : (
                <>
                  {task.relations_out?.map((relation: any, index: number) => (
                    <div
                      key={`out-${index}`}
                      className="flex flex-col border border-border p-2 rounded-md bg-background"
                    >
                      <span className="text-xs text-muted-foreground capitalize mb-1">
                        {relation.relation_type.replace('_', ' ')}
                      </span>
                      <a
                        href={`/task/${relation.related_task.identifier}`}
                        className="font-medium hover:underline text-foreground truncate"
                      >
                        {relation.related_task.identifier}{' '}
                        <span className="text-muted-foreground font-normal">{relation.related_task.title}</span>
                      </a>
                    </div>
                  ))}
                  {task.relations_in?.map((relation: any, index: number) => (
                    <div
                      key={`in-${index}`}
                      className="flex flex-col border border-border p-2 rounded-md bg-background"
                    >
                      <span className="text-xs text-muted-foreground capitalize mb-1">
                        {relation.relation_type === 'blocks'
                          ? 'blocked by'
                          : relation.relation_type === 'parent'
                            ? 'child'
                            : relation.relation_type === 'child'
                              ? 'parent'
                              : `is ${relation.relation_type.replace('_', ' ')} of`}
                      </span>
                      <a
                        href={`/task/${relation.task.identifier}`}
                        className="font-medium hover:underline text-foreground truncate"
                      >
                        {relation.task.identifier}{' '}
                        <span className="text-muted-foreground font-normal">{relation.task.title}</span>
                      </a>
                    </div>
                  ))}
                </>
              )}
            </div>
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