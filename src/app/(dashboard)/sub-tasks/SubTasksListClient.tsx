'use client'

import { useState, useTransition } from 'react'
import { Check, Square, Calendar, ArrowUp, ArrowRight, ArrowDown, AlertCircle, GitBranch, ArrowUpRight } from 'lucide-react'
import { toggleSubTask } from '@/app/(dashboard)/stories/[id]/actions'
import Link from 'next/link'

interface SubTaskListItem {
  id: string
  taskId: string
  title: string
  status: string | null
  completed_at: string | null
  priority: string
  due_date: string | null
  taskIdentifier?: string
  taskTitle?: string
}

export function SubTasksListClient({ initialSubTasks }: { initialSubTasks: SubTaskListItem[] }) {
  const [subtasks, setSubtasks] = useState<SubTaskListItem[]>(initialSubTasks)
  const [isPending, startTransition] = useTransition()

  function handleToggle(st: SubTaskListItem) {
    const nowDone = st.status !== 'Done' && !st.completed_at
    startTransition(async () => {
      const result = await toggleSubTask({
        subTaskId: st.id,
        completed: nowDone,
        taskId: st.taskId
      })
      if (result.success) {
        setSubtasks((prev) =>
          prev.map((s) =>
            s.id === st.id
              ? {
                  ...s,
                  status: nowDone ? 'Done' : 'Todo',
                  completed_at: nowDone ? new Date().toISOString() : null,
                }
              : s
          )
        )
      }
    })
  }

  if (subtasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <GitBranch className="w-12 h-12 mb-4 opacity-20 text-violet-500 rotate-180" />
        <p className="text-sm font-medium">No sub-tasks assigned to you yet.</p>
        <p className="text-xs mt-1 opacity-60">Sub-tasks assigned to you will appear here.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col border border-border rounded-xl divide-y divide-border text-sm overflow-hidden bg-card shadow-sm">
      {subtasks.map((st) => {
        const isDone = st.status === 'Done' || !!st.completed_at
        return (
          <div
            key={st.id}
            className="flex items-center gap-3.5 px-4 py-3 hover:bg-muted/30 transition-colors group"
          >
            {/* Toggle button */}
            <button
              onClick={() => handleToggle(st)}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded border border-muted-foreground/30 hover:border-violet-500/50 hover:bg-violet-50/50 transition-colors"
            >
              {isDone ? (
                <Check className="w-4 h-4 text-violet-500" />
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>

            {/* Title & Priority icon */}
            <div className="flex-1 min-w-0">
              <span
                className={`font-medium block leading-snug ${
                  isDone ? 'line-through text-muted-foreground/50' : 'text-foreground'
                }`}
              >
                {st.title}
              </span>

              {/* Parent Task Context */}
              {st.taskIdentifier && (
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded text-[10px]">
                    {st.taskIdentifier}
                  </span>
                  <Link
                    href={`/task/${st.taskIdentifier}`}
                    className="hover:text-violet-600 hover:underline flex items-center gap-0.5 truncate max-w-[240px] md:max-w-[400px]"
                  >
                    {st.taskTitle}
                    <ArrowUpRight className="w-3 h-3 inline shrink-0" />
                  </Link>
                </div>
              )}
            </div>

            {/* Metadata (Priority, Due Date) */}
            <div className="flex items-center gap-4 shrink-0">
              {st.priority && st.priority !== 'None' && (
                <div className="flex items-center gap-1 text-xs">
                  <PriorityIcon priority={st.priority} />
                </div>
              )}

              {st.due_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(st.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PriorityIcon({ priority }: { priority: string }) {
  const getStyles = () => {
    switch (priority) {
      case 'Urgent':
        return {
          container: 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)] hover:shadow-[0_0_12px_rgba(239,68,68,0.35)]',
          label: 'Urgent',
          icon: <AlertCircle className="w-3 h-3 shrink-0" />
        }
      case 'High':
        return {
          container: 'bg-orange-500/10 border-orange-500/30 text-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.2)] hover:shadow-[0_0_12px_rgba(249,115,22,0.35)]',
          label: 'High',
          icon: <ArrowUp className="w-3 h-3 shrink-0" />
        }
      case 'Medium':
        return {
          container: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.2)] hover:shadow-[0_0_12px_rgba(234,179,8,0.35)]',
          label: 'Med',
          icon: <ArrowRight className="w-3 h-3 shrink-0" />
        }
      case 'Low':
        return {
          container: 'bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.2)] hover:shadow-[0_0_12px_rgba(59,130,246,0.35)]',
          label: 'Low',
          icon: <ArrowDown className="w-3 h-3 shrink-0" />
        }
      default:
        return {
          container: 'bg-muted/10 border-border/30 text-muted-foreground/60',
          label: 'None',
          icon: <span className="text-[9px] font-bold h-3 w-3 flex items-center justify-center">-</span>
        }
    }
  }

  const { container, label, icon } = getStyles()

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold tracking-wide uppercase backdrop-blur-xs select-none transition-all duration-300 ${container}`}>
      {icon}
      <span>{label}</span>
    </div>
  )
}
