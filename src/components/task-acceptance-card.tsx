'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { respondToTaskAssignmentAction } from '@/app/(dashboard)/tasks/new/actions'
import Link from 'next/link'

interface TaskAcceptanceCardProps {
  taskId: string
  taskIdentifier: string
  taskTitle: string
  assignedBy: string
  notificationId: string
  onResponded?: () => void
}

export function TaskAcceptanceCard({
  taskId,
  taskIdentifier,
  taskTitle,
  assignedBy,
  notificationId,
  onResponded,
}: TaskAcceptanceCardProps) {
  const [loading, setLoading] = useState<'accepted' | 'declined' | null>(null)
  const [responded, setResponded] = useState<'accepted' | 'declined' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleResponse = async (response: 'accepted' | 'declined') => {
    setLoading(response)
    setError(null)
    try {
      const result = await respondToTaskAssignmentAction({ taskId, response, notificationId })
      if (result.success) {
        setResponded(response)
        onResponded?.()
      } else {
        setError(result.error || 'Something went wrong')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  if (responded === 'accepted') {
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>You accepted this task assignment.</span>
      </div>
    )
  }

  if (responded === 'declined') {
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
        <XCircle className="w-4 h-4 shrink-0" />
        <span>You declined this assignment. The task has been unassigned.</span>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Task Assignment Request</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground/80">{assignedBy}</span> assigned you to a task
          </p>
          <Link
            href={`/task/${taskIdentifier}`}
            className="text-xs font-mono text-amber-400 hover:text-amber-300 hover:underline mt-1 inline-block"
          >
            {taskIdentifier} — {taskTitle}
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 px-1">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleResponse('accepted')}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-semibold border border-green-500/30 transition-colors disabled:opacity-50"
        >
          {loading === 'accepted' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          Accept
        </button>
        <button
          onClick={() => handleResponse('declined')}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition-colors disabled:opacity-50"
        >
          {loading === 'declined' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          Decline
        </button>
      </div>
    </div>
  )
}
