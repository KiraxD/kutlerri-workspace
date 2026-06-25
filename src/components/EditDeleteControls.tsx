'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Trash2, Loader2, X, AlertTriangle } from 'lucide-react'
import { updateInitiativeAction, deleteInitiativeAction } from '@/app/(dashboard)/initiatives/actions'
import { updateEpicAction, deleteEpicAction } from '@/app/(dashboard)/epics/actions'
import { updateStoryAction, deleteStoryAction } from '@/app/(dashboard)/stories/actions'
import { updateTaskAction, deleteTaskAction } from '@/app/(dashboard)/tasks/new/actions'

interface EditDeleteControlsProps {
  entityId: string
  entityType: 'initiative' | 'epic' | 'story' | 'task'
  initialData: {
    name?: string
    title?: string
    description?: string | null
    status?: string | null
    priority?: string | null
    estimate?: number | null
  }
  redirectOnDelete: string
}

export function EditDeleteControls({
  entityId,
  entityType,
  initialData,
  redirectOnDelete,
}: EditDeleteControlsProps) {
  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState(initialData.name || initialData.title || '')
  const [description, setDescription] = useState(initialData.description || '')
  const [status, setStatus] = useState(initialData.status || 'Todo')
  const [priority, setPriority] = useState(initialData.priority || 'None')
  const [estimate, setEstimate] = useState<number | null>(initialData.estimate ?? null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      let res
      if (entityType === 'initiative') res = await deleteInitiativeAction(entityId)
      else if (entityType === 'epic') res = await deleteEpicAction(entityId)
      else if (entityType === 'story') res = await deleteStoryAction(entityId)
      else res = await deleteTaskAction(entityId)

      if (res.success) {
        setIsDeleteOpen(false)
        router.push(redirectOnDelete)
        router.refresh()
      } else {
        setError(res.error || 'Failed to delete')
      }
    })
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    startTransition(async () => {
      let res
      if (entityType === 'initiative') {
        res = await updateInitiativeAction({ id: entityId, name, description, status, priority })
      } else if (entityType === 'epic') {
        res = await updateEpicAction({ id: entityId, name, description, status, priority })
      } else if (entityType === 'story') {
        res = await updateStoryAction({ id: entityId, name, description, status, priority, estimate })
      } else {
        res = await updateTaskAction({ id: entityId, title: name, description, status, priority, estimate })
      }

      if (res.success) {
        setIsEditOpen(false)
        router.refresh()
      } else {
        setError(res.error || 'Failed to save updates')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsEditOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 shadow-sm"
      >
        <Edit2 className="w-3.5 h-3.5" />
        Edit
      </button>

      <button
        onClick={() => setIsDeleteOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200/50 rounded-lg bg-red-50/20 hover:bg-red-50 text-red-600 dark:hover:bg-red-950/30 transition-all duration-200 shadow-sm"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold capitalize">Edit {entityType}</h2>
              <button
                onClick={() => { setIsEditOpen(false); setError(null); }}
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Title / Name</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-500 transition-all"
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Testing">Testing</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-500 transition-all"
                  >
                    <option value="None">None</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {(entityType === 'story' || entityType === 'task') && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Estimate (Points)</label>
                  <input
                    type="number"
                    value={estimate === null ? '' : estimate}
                    onChange={(e) => setEstimate(e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-500 transition-all"
                  />
                </div>
              )}

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setError(null); }}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50 transition-all shadow-md shadow-violet-500/20"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-foreground capitalize">Delete {entityType}</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Are you sure you want to delete this {entityType}? This action cannot be undone and will permanently delete all associated sub-items.
                </p>
              </div>

              {error && <p className="text-xs text-red-500 text-center font-medium">{error}</p>}

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsDeleteOpen(false); setError(null); }}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-all flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-all flex-1 shadow-md shadow-red-500/20"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
