'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TaskAssignmentButton } from '@/components/task-assignment-selector'

interface TaskAssignmentDisplayProps {
  taskId: string
  teamId: string
  currentAssigneeId: string | null
  currentAssigneeName: string | null
  currentAssigneeEmail: string | null
}

export function TaskAssignmentDisplay({
  taskId,
  teamId,
  currentAssigneeId,
  currentAssigneeName,
  currentAssigneeEmail,
}: TaskAssignmentDisplayProps) {
  const [assigneeId, setAssigneeId] = useState(currentAssigneeId)
  const [assigneeName, setAssigneeName] = useState(currentAssigneeName)
  const [assigneeEmail, setAssigneeEmail] = useState(currentAssigneeEmail)

  return (
    <div className="flex items-center justify-between gap-2 min-w-0">
      <span className="text-muted-foreground w-20 shrink-0 text-xs">Assignee</span>
      <div className="flex items-center gap-1.5 flex-1 justify-between min-w-0">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarFallback className="text-[10px]">
              {assigneeEmail ? assigneeEmail[0].toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-xs font-medium text-foreground" title={assigneeName || assigneeEmail || 'Unassigned'}>
            {assigneeName || assigneeEmail || 'Unassigned'}
          </span>
        </div>
        <div className="shrink-0">
          <TaskAssignmentButton
            taskId={taskId}
            teamId={teamId}
            currentAssigneeId={assigneeId}
            currentAssigneeName={assigneeName}
            onAssignmentChange={() => {
              // Re-fetch would be ideal, but for now we'll just update state
              // In a real app, this would trigger a data refresh
            }}
          />
        </div>
      </div>
    </div>
  )
}
