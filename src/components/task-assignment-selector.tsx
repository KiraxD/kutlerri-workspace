'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Check } from 'lucide-react'
import { assignTaskAction } from '@/app/(dashboard)/tasks/new/actions'

interface AssignableUser {
  id: string
  full_name: string | null
  email: string
}

interface TaskAssignmentSelectorProps {
  taskId: string
  teamId: string
  currentAssignees: AssignableUser[]
  onAssignmentChange?: (updatedAssignees: AssignableUser[]) => void
  className?: string
}

export function TaskAssignmentSelector({
  taskId,
  teamId,
  currentAssignees,
  onAssignmentChange,
  className = '',
}: TaskAssignmentSelectorProps) {
  const [assignees, setAssignees] = useState<AssignableUser[]>([])
  const [loading, setLoading] = useState(true)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>(currentAssignees.map(a => a.id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAssignees()
  }, [teamId])

  async function loadAssignees() {
    try {
      setLoading(true)
      setError(null)
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

  async function handleToggleUser(user: AssignableUser) {
    if (assigningId) return
    
    try {
      setAssigningId(user.id)
      setError(null)

      const isCurrentlySelected = selectedIds.includes(user.id)
      let newSelectedIds: string[]
      
      if (isCurrentlySelected) {
        newSelectedIds = selectedIds.filter(id => id !== user.id)
      } else {
        newSelectedIds = [...selectedIds, user.id]
      }

      // Update the DB
      const result = await assignTaskAction({
        taskId,
        assigneeIds: newSelectedIds,
      })

      if (!result.success) {
        setError(result.error || 'Failed to update assignment')
        return
      }

      setSelectedIds(newSelectedIds)
      
      // Map IDs back to assignable user objects to pass to callback
      const updatedAssignees = assignees.filter(u => newSelectedIds.includes(u.id))
      onAssignmentChange?.(updatedAssignees)
    } catch (err: any) {
      console.error('Error toggling assignment:', err)
      setError(err.message || 'Failed to update assignment')
    } finally {
      setAssigningId(null)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading team members...</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="max-h-[200px] overflow-y-auto pr-1 space-y-1">
        {assignees.map((user) => {
          const isSelected = selectedIds.includes(user.id)
          const isPending = assigningId === user.id
          
          return (
            <button
              key={user.id}
              onClick={() => handleToggleUser(user)}
              disabled={!!assigningId}
              className={`w-full flex items-center justify-between p-1.5 rounded-md text-left text-xs transition-colors hover:bg-muted/50 ${
                isSelected ? 'bg-primary/5 font-medium' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="w-5 h-5 text-[10px] shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.full_name
                      ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase()
                      : user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{user.full_name || user.email}</span>
              </div>
              <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                {isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                ) : isSelected ? (
                  <Check className="w-3.5 h-3.5 text-primary" />
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}

      {assignees.length === 0 && !error && (
        <p className="text-[10px] text-muted-foreground italic">
          No team members available
        </p>
      )}
    </div>
  )
}

export function TaskAssignmentButton({
  taskId,
  teamId,
  currentAssignees,
  onAssignmentChange,
}: {
  taskId: string
  teamId: string
  currentAssignees: AssignableUser[]
  onAssignmentChange?: (updatedAssignees: AssignableUser[]) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="h-6 px-2 py-0 text-[10px] gap-1 font-semibold"
      >
        Assign
      </Button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg z-50 p-2">
            <div className="px-1.5 py-1 border-b border-border mb-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Select Assignees
              </span>
            </div>
            <TaskAssignmentSelector
              taskId={taskId}
              teamId={teamId}
              currentAssignees={currentAssignees}
              onAssignmentChange={onAssignmentChange}
            />
          </div>
        </>
      )}
    </div>
  )
}
