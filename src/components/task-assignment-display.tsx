'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TaskAssignmentButton } from '@/components/task-assignment-selector'

interface AssigneeProfile {
  id: string
  full_name: string | null
  email: string
}

interface TaskAssignmentDisplayProps {
  taskId: string
  teamId: string
  currentAssignees: AssigneeProfile[]
}

export function TaskAssignmentDisplay({
  taskId,
  teamId,
  currentAssignees,
}: TaskAssignmentDisplayProps) {
  const [assignees, setAssignees] = useState<AssigneeProfile[]>(currentAssignees)

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Assignees</span>
        <TaskAssignmentButton
          taskId={taskId}
          teamId={teamId}
          currentAssignees={assignees}
          onAssignmentChange={(updatedAssignees) => {
            setAssignees(updatedAssignees)
          }}
        />
      </div>
      
      {assignees.length > 0 ? (
        <div className="flex flex-col gap-1.5 mt-1">
          {assignees.map((assignee) => (
            <div key={assignee.id} className="flex items-center gap-2 py-1 px-1.5 hover:bg-muted/30 rounded transition-colors min-w-0">
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {assignee.full_name
                    ? assignee.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                    : assignee.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-xs font-medium text-foreground" title={assignee.full_name || assignee.email}>
                {assignee.full_name || assignee.email}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic mt-1">Unassigned</p>
      )}
    </div>
  )
}
