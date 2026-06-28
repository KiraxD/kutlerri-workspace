'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2, X } from 'lucide-react'
import { createTaskForStory } from './actions'
import { AssigneePicker, type AssignableUser } from '@/components/AssigneePicker'

interface AddTaskFormProps {
  storyId: string
  teamId?: string
}

const STATUSES = ['Todo', 'In Progress', 'Review', 'Blocked', 'Done']

export function AddTaskForm({ storyId, teamId }: AddTaskFormProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('Todo')
  const [priority, setPriority] = useState('no_priority')
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setTitle('')
    setStatus('Todo')
    setPriority('no_priority')
    setAssigneeId(null)
    setError(null)
    setOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await createTaskForStory({
        storyId,
        title: title.trim(),
        status,
        priority,
        teamId,
        assigneeId: assigneeId ?? undefined,
      })
      if (result.success) {
        reset()
      } else {
        setError(result.error ?? 'Failed to create task')
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-dashed border-border hover:border-emerald-400 hover:bg-emerald-50/40 transition-all group w-full"
      >
        <Plus className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
        Add Task
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-emerald-300 bg-emerald-50/30 p-4 space-y-3"
    >
      {/* Title row */}
      <div className="flex items-center gap-2">
        <input
          autoFocus
          type="text"
          placeholder="Task title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-sm bg-white border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all"
        />
        <button
          type="button"
          onClick={reset}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Options row */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-xs border border-border rounded-md px-2 py-1.5 bg-white outline-none focus:ring-1 focus:ring-emerald-400"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="text-xs border border-border rounded-md px-2 py-1.5 bg-white outline-none focus:ring-1 focus:ring-emerald-400"
        >
          <option value="no_priority">No Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        {/* Assignee picker — fetches org members automatically */}
        <AssigneePicker
          value={assigneeId}
          onChange={(id) => setAssigneeId(id)}
          placeholder="Assign to…"
          size="sm"
        />

        <div className="flex-1" />

        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="flex items-center gap-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  )
}
