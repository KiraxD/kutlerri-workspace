import Link from 'next/link'
import { Task } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Circle,
  CircleDashed,
  CheckCircle2,
  Eye,
  TestTube,
  XCircle,
} from 'lucide-react'

export function TaskList({ tasks }: { tasks: Task[] | null }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">No tasks assigned to you yet.</p>
        <p className="text-xs mt-1 opacity-60">Tasks assigned to you will appear here.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col border-y border-border divide-y divide-border text-sm">
      {tasks.map((task) => (
        <TaskListItem key={task.id} task={task} />
      ))}
    </div>
  )
}

function TaskListItem({ task }: { task: Task }) {
  return (
    <Link
      href={`/task/${task.identifier}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-2 w-28 shrink-0">
        <PriorityIcon priority={task.priority} />
        <span className="text-muted-foreground font-mono text-xs uppercase">{task.identifier}</span>
      </div>

      <div className="flex items-center gap-2 w-36 shrink-0">
        <StatusIcon status={task.status} />
        <span className="text-muted-foreground text-xs">{getStatusLabel(task.status)}</span>
      </div>

      <div className="flex-1 min-w-0 font-medium truncate">{task.title}</div>

      <div className="flex items-center gap-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.estimate && (
          <Badge variant="outline" className="font-mono text-xs">
            {task.estimate}
          </Badge>
        )}
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">U</AvatarFallback>
        </Avatar>
      </div>
    </Link>
  )
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
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

  return map[status] || status
}

function PriorityIcon({ priority }: { priority: Task['priority'] }) {
  switch (priority) {
    case 'urgent':
      return <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
    case 'high':
      return <ArrowUp className="w-4 h-4 text-orange-500 shrink-0" />
    case 'medium':
      return <ArrowRight className="w-4 h-4 text-yellow-500 shrink-0" />
    case 'low':
      return <ArrowDown className="w-4 h-4 text-blue-500 shrink-0" />
    default:
      return <div className="w-4 h-4 flex items-center justify-center text-muted-foreground/40 shrink-0">-</div>
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'Backlog':
    case 'backlog':
      return <CircleDashed className="w-4 h-4 text-muted-foreground shrink-0" />
    case 'Ready':
      return <Circle className="w-4 h-4 text-sky-400 shrink-0" />
    case 'Todo':
    case 'todo':
      return <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
    case 'In Progress':
    case 'in_progress':
      return <Circle className="w-4 h-4 text-yellow-500 shrink-0" />
    case 'Review':
    case 'in_review':
      return <Eye className="w-4 h-4 text-blue-500 shrink-0" />
    case 'Testing':
      return <TestTube className="w-4 h-4 text-purple-500 shrink-0" />
    case 'Blocked':
      return <XCircle className="w-4 h-4 text-red-500 shrink-0" />
    case 'Done':
    case 'done':
      return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
    case 'Cancelled':
    case 'canceled':
      return <XCircle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
    default:
      return <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
  }
}