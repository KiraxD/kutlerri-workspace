'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Check,
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
    <div className="flex flex-col border-y border-border divide-y divide-border text-sm bg-card rounded-xl overflow-hidden">
      {tasks.map((task) => (
        <TaskListItem key={task.id} task={task} />
      ))}
    </div>
  )
}

function TaskListItem({ task }: { task: Task }) {
  const router = useRouter()
  const [status, setStatus] = useState<string>(task.status)
  const [toggling, setToggling] = useState(false)
  const isCompleted = status.toLowerCase() === 'done'

  async function handleToggleCompletion(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (toggling) return

    try {
      setToggling(true)
      const newStatus = isCompleted ? 'Todo' : 'Done'
      setStatus(newStatus)

      const { updateTaskStatusAction } = await import('@/app/(dashboard)/tasks/new/actions')
      const result = await updateTaskStatusAction({ id: task.id, status: newStatus })

      if (!result.success) {
        // Revert status on error
        setStatus(task.status)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      setStatus(task.status)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors group">
      <button
        onClick={handleToggleCompletion}
        disabled={toggling}
        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
          isCompleted 
            ? 'bg-green-500/20 border-green-500 text-green-500 hover:bg-green-500/30' 
            : 'border-muted-foreground/30 hover:border-primary text-transparent'
        }`}
      >
        <Check className={`w-3 h-3 ${isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 group-hover:text-muted-foreground'}`} />
      </button>

      <Link
        href={`/task/${task.identifier}`}
        className="flex-1 flex items-center gap-3 min-w-0"
      >
        <div className="flex items-center gap-2 w-28 shrink-0">
          <PriorityIcon priority={task.priority} />
          <span className={`font-mono text-xs uppercase ${isCompleted ? 'line-through text-muted-foreground/50' : 'text-muted-foreground'}`}>
            {task.identifier}
          </span>
        </div>

        <div className="flex items-center gap-2 w-36 shrink-0">
          <StatusIcon status={status} />
          <span className={`text-xs ${isCompleted ? 'line-through text-muted-foreground/50' : 'text-muted-foreground'}`}>
            {getStatusLabel(status)}
          </span>
        </div>

        <div className={`flex-1 min-w-0 font-medium truncate ${isCompleted ? 'line-through text-muted-foreground/50' : 'text-foreground'}`}>
          {task.title}
        </div>

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
    </div>
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