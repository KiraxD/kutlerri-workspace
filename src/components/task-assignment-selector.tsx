'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar } from '@/components/ui/avatar'
import { Loader2, X } from 'lucide-react'
import { assignTaskAction } from '@/app/(dashboard)/tasks/new/actions'

interface AssignableUser {
  id: string
  full_name: string | null
  email: string
}

interface TaskAssignmentSelectorProps {
  taskId: string
  teamId: string
  currentAssigneeId?: string | null
  currentAssigneeName?: string | null
  onAssignmentChange?: (assigneeId: string | null) => void
  className?: string
}

export function TaskAssignmentSelector({
  taskId,
  teamId,
  currentAssigneeId,
  currentAssigneeName,
  onAssignmentChange,
  className = '',
}: TaskAssignmentSelectorProps) {
  const [assignees, setAssignees] = useState<AssignableUser[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(currentAssigneeId || null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAssignees()
  }, [teamId])

  async function loadAssignees() {
    try {
      setLoading(true)
      setError(null)

      // Import the action dynamically to avoid build issues
      const { getTaskAssignees } = await import('@/app/(dashboard)/tasks/new/actions')
      const users = await getTaskAssignees(teamId)
      setAssignees(users || [])
    } catch (err: any) {
      console.error('Error loading assignees:', err)
      setError(err.message || 'Failed to load assignees')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignmentChange(newAssigneeId: string | null) {
    try {
      setAssigning(true)
      setError(null)
      setSelectedId(newAssigneeId)

      if (!newAssigneeId) {
        // Unassign
        const { unassignTaskAction } = await import('@/app/(dashboard)/tasks/new/actions')
        const result = await unassignTaskAction({ taskId })

        if (!result.success) {
          setError(result.error || 'Failed to unassign task')
          setSelectedId(currentAssigneeId || null)
          return
        }
      } else {
        // Assign to user
        const result = await assignTaskAction({
          taskId,
          assigneeId: newAssigneeId,
        })

        if (!result.success) {
          setError(result.error || 'Failed to assign task')
          setSelectedId(currentAssigneeId || null)
          return
        }
      }

      onAssignmentChange?.(newAssigneeId)
    } catch (err: any) {
      console.error('Error assigning task:', err)
      setError(err.message || 'Failed to update assignment')
      setSelectedId(currentAssigneeId || null)
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Select value={selectedId || 'unassigned'} onValueChange={handleAssignmentChange}>
        <SelectTrigger className="w-full" disabled={assigning || assignees.length === 0}>
          {selectedId ? (
            <SelectValue placeholder="Select assignee" />
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {assignees.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5 text-xs">
                  {user.full_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')}
                </Avatar>
                <span>{user.full_name || user.email}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {assignees.length === 0 && !error && (
        <p className="text-xs text-muted-foreground">
          No team members available for assignment
        </p>
      )}
    </div>
  )
}

/**
 * Simple assignment button component
 * Shows current assignee and allows quick assignment
 */
export function TaskAssignmentButton({
  taskId,
  teamId,
  currentAssigneeId,
  currentAssigneeName,
  onAssignmentChange,
}: TaskAssignmentSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2"
      >
        {currentAssigneeId ? (
          <>
            <Avatar className="w-4 h-4 text-xs">
              {currentAssigneeName
                ?.split(' ')
                .map((n) => n[0])
                .join('')}
            </Avatar>
            <span className="text-xs">{currentAssigneeName || 'Assigned'}</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Assign</span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg z-50 p-3">
          <TaskAssignmentSelector
            taskId={taskId}
            teamId={teamId}
            currentAssigneeId={currentAssigneeId}
            currentAssigneeName={currentAssigneeName}
            onAssignmentChange={(id) => {
              onAssignmentChange?.(id)
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
