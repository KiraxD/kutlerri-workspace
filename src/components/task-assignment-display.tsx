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
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground w-24">Assignee</span>
      <div className="flex items-center gap-2 flex-1 justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px]">
              {assigneeEmail ? assigneeEmail[0].toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <span>{assigneeName || assigneeEmail || 'Unassigned'}</span>
        </div>
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
  )
}
