import Link from 'next/link'
import { Issue } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertCircle, ArrowDown, ArrowRight, ArrowUp, Circle, CircleDashed, CheckCircle2 } from 'lucide-react'

export function IssueList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>No issues found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col border-y border-border divide-y divide-border text-sm">
      {issues.map((issue) => (
        <IssueListItem key={issue.id} issue={issue} />
      ))}
    </div>
  )
}

function IssueListItem({ issue }: { issue: Issue }) {
  return (
    <Link
      href={`/issue/${issue.identifier}`}
      className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-2 w-28 shrink-0">
        <PriorityIcon priority={issue.priority} />
        <span className="text-muted-foreground font-mono text-xs uppercase">{issue.identifier}</span>
      </div>
      
      <div className="flex items-center gap-2 w-32 shrink-0">
        <StatusIcon status={issue.status} />
        <span className="capitalize text-muted-foreground">{issue.status.replace('_', ' ')}</span>
      </div>

      <div className="flex-1 min-w-0 font-medium truncate">
        {issue.title}
      </div>

      <div className="flex items-center gap-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {issue.estimate && (
          <Badge variant="outline" className="font-mono text-xs">
            {issue.estimate}
          </Badge>
        )}
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[10px]">U</AvatarFallback>
        </Avatar>
      </div>
    </Link>
  )
}

function PriorityIcon({ priority }: { priority: Issue['priority'] }) {
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

function StatusIcon({ status }: { status: Issue['status'] }) {
  switch (status) {
    case 'backlog':
      return <CircleDashed className="w-4 h-4 text-muted-foreground" />
    case 'todo':
      return <Circle className="w-4 h-4 text-muted-foreground" />
    case 'in_progress':
      return <Circle className="w-4 h-4 text-yellow-500" />
    case 'in_review':
      return <Circle className="w-4 h-4 text-blue-500" />
    case 'done':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case 'canceled':
      return <Circle className="w-4 h-4 text-red-500 line-through" />
  }
}
