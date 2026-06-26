'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'

export function TaskStatusCheckbox({
  taskId,
  initialStatus,
  isAssignee,
}: {
  taskId: string
  initialStatus: string
  isAssignee: boolean
}) {
  const router = useRouter()
  const [status, setStatus] = useState<string>(initialStatus)
  const [toggling, setToggling] = useState(false)
  const isCompleted = status.toLowerCase() === 'done'

  async function handleToggleCompletion() {
    if (toggling || !isAssignee) return

    try {
      setToggling(true)
      const newStatus = isCompleted ? 'Todo' : 'Done'
      setStatus(newStatus)

      const { updateTaskStatusAction } = await import('@/app/(dashboard)/tasks/new/actions')
      const result = await updateTaskStatusAction({ id: taskId, status: newStatus })

      if (!result.success) {
        setStatus(initialStatus)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      setStatus(initialStatus)
    } finally {
      setToggling(false)
    }
  }

  return (
    <button
      onClick={handleToggleCompletion}
      disabled={toggling || !isAssignee}
      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0 hover:scale-105 ${
        isCompleted 
          ? 'bg-green-500/20 border-green-500 text-green-500 hover:bg-green-500/30' 
          : 'border-muted-foreground/30 hover:border-primary text-transparent'
      } ${!isAssignee ? 'cursor-not-allowed opacity-50 hover:scale-100' : ''}`}
      title={!isAssignee ? 'Only assignees can complete this task' : (isCompleted ? 'Mark as incomplete' : 'Mark as complete')}
    >
      {toggling ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
      ) : (
        <Check className={`w-3.5 h-3.5 ${isCompleted ? 'opacity-100' : 'opacity-0 hover:opacity-40'}`} />
      )}
    </button>
  )
}
