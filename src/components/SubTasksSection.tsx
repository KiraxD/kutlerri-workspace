'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2, Check, Square, X, GitBranch, User } from 'lucide-react'
import { createSubTask, toggleSubTask } from '@/app/(dashboard)/stories/[id]/actions'
import { AssigneePicker, type AssignableUser } from '@/components/AssigneePicker'

interface SubTask {
  id: string
  title: string
  status: string | null
  completed_at: string | null
  assignee?: { id: string; full_name: string | null; email: string } | null
}

interface SubTasksSectionProps {
  taskId: string
  initialSubTasks: SubTask[]
  storyId?: string
}

export function SubTasksSection({ taskId, initialSubTasks, storyId }: SubTasksSectionProps) {
  const [subtasks, setSubtasks] = useState<SubTask[]>(initialSubTasks)
  const [newTitle, setNewTitle] = useState('')
  const [newAssigneeId, setNewAssigneeId] = useState<string | null>(null)
  const [showInput, setShowInput] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const doneCount = subtasks.filter((s) => s.status === 'Done' || !!s.completed_at).length

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await createSubTask({ taskId, title: newTitle.trim(), storyId, assigneeId: newAssigneeId })
      if (result.success && result.subtask) {
        setSubtasks((prev) => [...prev, result.subtask as SubTask])
        setNewTitle('')
        setNewAssigneeId(null)
        setShowInput(false)
      } else {
        setError(result.error ?? 'Failed to add sub-task')
      }
    })
  }

  function handleToggle(subtask: SubTask) {
    const nowDone = subtask.status !== 'Done' && !subtask.completed_at
    startTransition(async () => {
      const result = await toggleSubTask({ subTaskId: subtask.id, completed: nowDone, taskId, storyId })
      if (result.success) {
        setSubtasks((prev) =>
          prev.map((s) =>
            s.id === subtask.id
              ? { ...s, status: nowDone ? 'Done' : 'Todo', completed_at: nowDone ? new Date().toISOString() : null }
              : s
          )
        )
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-500 rotate-180" />
          <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            Sub Tasks
          </h3>
          {subtasks.length > 0 && (
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground font-medium">
              {doneCount}/{subtasks.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-violet-600 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="h-1 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0}%` }}
          />
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-1">
        {subtasks.map((st) => {
          const isDone = st.status === 'Done' || !!st.completed_at
          return (
            <div
              key={st.id}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/60 group transition-colors"
            >
              <button
                onClick={() => handleToggle(st)}
                className="shrink-0 w-4 h-4 flex items-center justify-center"
              >
                {isDone ? (
                  <Check className="w-4 h-4 text-violet-500" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground/50 group-hover:text-violet-400 transition-colors" />
                )}
              </button>
              <span
                className={`text-sm flex-1 leading-snug ${
                  isDone ? 'line-through text-muted-foreground/50' : 'text-foreground'
                }`}
              >
                {st.title}
              </span>
              {st.assignee && (
                <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[9px] font-bold shrink-0" title={st.assignee.full_name || st.assignee.email}>
                  {(st.assignee.full_name || st.assignee.email).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )
        })}

        {subtasks.length === 0 && !showInput && (
          <p className="text-xs text-muted-foreground/60 italic px-2 py-1">No sub-tasks yet</p>
        )}
      </div>

      {/* Inline add input */}
      {showInput && (
        <form onSubmit={handleAdd} className="flex flex-col gap-2 mt-2 bg-muted/30 p-2 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Sub-task title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 text-xs bg-background border border-border rounded-md px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition-all"
            />
            <button
              type="submit"
              disabled={isPending || !newTitle.trim()}
              className="p-1.5 rounded-md bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={() => { setShowInput(false); setError(null); setNewAssigneeId(null); setNewTitle(''); }}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center">
            <AssigneePicker
              value={newAssigneeId}
              onChange={(id) => setNewAssigneeId(id)}
              placeholder="Assign sub-task..."
              size="xs"
              className="w-full"
            />
          </div>
        </form>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
