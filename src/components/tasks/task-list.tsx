'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Task, TaskStatus, TaskPriority } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { TaskDetailInline } from './TaskDetailInline'
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Circle,
  CircleDashed,
  CheckCircle2,
  Eye,
  TestTube,
  XCircle,
  Check,
  LayoutGrid,
  List,
  ExternalLink,
} from 'lucide-react'

const STATUS_COLUMNS: TaskStatus[] = [
  'Backlog',
  'Todo',
  'In Progress',
  'Review',
  'Testing',
  'Blocked',
  'Done'
]

export function TaskList({ tasks }: { tasks: Task[] | null }) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [localTasks, setLocalTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Sync tasks prop
  useEffect(() => {
    if (tasks) {
      setLocalTasks(tasks)
    } else {
      setLocalTasks([])
    }
  }, [tasks])

  // Load view mode preference from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('task-list-view-mode')
    if (saved === 'list' || saved === 'board') {
      setViewMode(saved)
    }
  }, [])

  const handleViewModeChange = (mode: 'list' | 'board') => {
    setViewMode(mode)
    localStorage.setItem('task-list-view-mode', mode)
  }

  // Handle task status update (e.g. from drag & drop or selector)
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null))
    }

    try {
      const { updateTaskStatusAction } = await import('@/app/(dashboard)/tasks/new/actions')
      const result = await updateTaskStatusAction({ id: taskId, status: newStatus })
      if (!result.success) {
        // Revert status
        if (tasks) setLocalTasks(tasks)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      if (tasks) setLocalTasks(tasks)
    }
  }

  const handleUpdateProperty = async (taskId: string, fields: Partial<Task>) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...fields } : t))
    )
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, ...fields } : null))
    }

    try {
      const taskToUpdate = localTasks.find((t) => t.id === taskId)
      if (!taskToUpdate) return

      const { updateTaskAction } = await import('@/app/(dashboard)/tasks/new/actions')
      const result = await updateTaskAction({
        id: taskId,
        title: fields.title !== undefined ? fields.title : taskToUpdate.title,
        description: fields.description !== undefined ? fields.description : taskToUpdate.description,
        status: fields.status !== undefined ? fields.status : taskToUpdate.status,
        priority: fields.priority !== undefined ? fields.priority : taskToUpdate.priority,
        estimate: fields.estimate !== undefined ? fields.estimate : taskToUpdate.estimate,
      })

      if (!result.success) {
        if (tasks) setLocalTasks(tasks)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      if (tasks) setLocalTasks(tasks)
    }
  }

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      await handleUpdateStatus(taskId, targetStatus)
    }
  }

  const openDrawer = (task: Task) => {
    setSelectedTask(task)
    setDrawerOpen(true)
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">No tasks assigned to you yet.</p>
        <p className="text-xs mt-1 opacity-60">Tasks assigned to you will appear here.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Controls / View Toggle */}
      <div className="flex items-center justify-between pb-2">
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
          Displaying {localTasks.length} tasks
        </span>
        <div className="flex items-center bg-muted/40 border border-border/60 p-0.5 rounded-lg">
          <button
            onClick={() => handleViewModeChange('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
          <button
            onClick={() => handleViewModeChange('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'board'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Board
          </button>
        </div>
      </div>

      {/* Main Task Layout */}
      {viewMode === 'list' ? (
        <div className="flex flex-col border border-border/80 divide-y divide-border/60 text-sm bg-card rounded-xl overflow-hidden shadow-xs">
          {localTasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onSelect={openDrawer}
              onStatusChange={(status) => handleUpdateStatus(task.id, status)}
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none min-h-[500px]">
          {STATUS_COLUMNS.map((status) => {
            const columnTasks = localTasks.filter(
              (t) => t.status.toLowerCase() === status.toLowerCase()
            )
            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="flex-1 min-w-[280px] max-w-[320px] bg-muted/10 border border-border/40 rounded-xl p-3 flex flex-col gap-3 transition-colors hover:bg-muted/15"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={status} />
                    <span className="font-medium text-sm text-foreground/80">{status}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-[300px]">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => openDrawer(task)}
                      className="bg-card hover:bg-muted/30 border border-border/60 hover:border-primary/30 p-3 rounded-lg flex flex-col gap-2.5 cursor-grab active:cursor-grabbing shadow-xs transition-all hover:translate-y-[-1px] group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase text-muted-foreground/80">
                          {task.identifier}
                        </span>
                        <PriorityIcon priority={task.priority} />
                      </div>
                      <div className="text-sm font-medium text-foreground line-clamp-2">
                        {task.title}
                      </div>
                      <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-1">
                        <span className="text-[10px] text-muted-foreground/60">
                          {task.estimate ? `${task.estimate} pts` : '-'}
                        </span>
                        <Avatar className="h-5 w-5 ring-1 ring-border">
                          <AvatarFallback className="text-[9px] bg-primary/5 text-primary">
                            U
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="flex-1 border border-dashed border-border/40 rounded-lg flex items-center justify-center p-8 text-center text-xs text-muted-foreground/40">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Contextual Side Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-xl md:max-w-2xl w-full p-0 flex flex-col h-full bg-background border-l border-border shadow-xl">
          {selectedTask && (
            <div className="flex flex-col h-full">
              {/* Drawer Top Navigation Bar */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">PEEKING</span>
                  <span className="h-3 w-px bg-border" />
                  <span className="font-mono text-xs text-foreground uppercase">
                    {selectedTask.identifier}
                  </span>
                </div>
                <Link
                  href={`/task/${selectedTask.identifier}`}
                  className="flex items-center gap-1 text-xs text-primary hover:underline pr-8"
                  onClick={() => setDrawerOpen(false)}
                >
                  Open as page
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto flex">
                <div className="flex-1 p-6 overflow-y-auto">
                  <TaskDetailInline
                    task={selectedTask}
                    onUpdate={(fields) => handleUpdateProperty(selectedTask.id, fields)}
                  />
                </div>

                {/* Properties Sidebar Panel */}
                <div className="w-[220px] border-l border-border bg-muted/5 p-4 flex flex-col gap-5 overflow-y-auto">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/75">
                    Properties
                  </h3>

                  {/* Status Property */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Status</label>
                    <select
                      value={selectedTask.status}
                      onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value as TaskStatus)}
                      className="w-full text-xs bg-background border border-border/80 rounded-md p-1.5 text-foreground outline-none focus:ring-1 focus:ring-primary/40"
                    >
                      {STATUS_COLUMNS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Property */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Priority</label>
                    <select
                      value={selectedTask.priority}
                      onChange={(e) => handleUpdateProperty(selectedTask.id, { priority: e.target.value as TaskPriority })}
                      className="w-full text-xs bg-background border border-border/80 rounded-md p-1.5 text-foreground outline-none focus:ring-1 focus:ring-primary/40 capitalize"
                    >
                      <option value="no_priority">No Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Estimate Property */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground">Estimate</label>
                    <select
                      value={selectedTask.estimate || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value, 10)
                        handleUpdateProperty(selectedTask.id, { estimate: val })
                      }}
                      className="w-full text-xs bg-background border border-border/80 rounded-md p-1.5 text-foreground outline-none focus:ring-1 focus:ring-primary/40"
                    >
                      <option value="">None</option>
                      <option value="1">1 point</option>
                      <option value="2">2 points</option>
                      <option value="3">3 points</option>
                      <option value="5">5 points</option>
                      <option value="8">8 points</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function TaskListItem({
  task,
  onSelect,
  onStatusChange,
}: {
  task: Task
  onSelect: (task: Task) => void
  onStatusChange: (status: TaskStatus) => void
}) {
  const [toggling, setToggling] = useState(false)
  const isCompleted = task.status.toLowerCase() === 'done'

  async function handleToggleCompletion(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (toggling) return

    try {
      setToggling(true)
      const newStatus: TaskStatus = isCompleted ? 'Todo' : 'Done'
      onStatusChange(newStatus)
    } catch (err) {
      console.error(err)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div
      onClick={() => onSelect(task)}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors group cursor-pointer"
    >
      <button
        onClick={handleToggleCompletion}
        disabled={toggling}
        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
          isCompleted
            ? 'bg-green-500/20 border-green-500 text-green-500 hover:bg-green-500/30'
            : 'border-muted-foreground/30 hover:border-primary text-transparent'
        }`}
      >
        <Check
          className={`w-3.5 h-3.5 ${
            isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 group-hover:text-muted-foreground'
          }`}
        />
      </button>

      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 w-36 shrink-0">
          <PriorityIcon priority={task.priority} />
          <span
            className={`font-mono text-xs uppercase ${
              isCompleted ? 'line-through text-muted-foreground/50' : 'text-muted-foreground'
            }`}
          >
            {task.identifier}
          </span>
        </div>

        <div className="flex items-center gap-2 w-36 shrink-0">
          <StatusIcon status={task.status} />
          <span
            className={`text-xs ${
              isCompleted ? 'line-through text-muted-foreground/50' : 'text-muted-foreground'
            }`}
          >
            {task.status}
          </span>
        </div>

        <div
          className={`flex-1 min-w-0 font-medium truncate ${
            isCompleted ? 'line-through text-muted-foreground/50' : 'text-foreground'
          }`}
        >
          {task.title}
        </div>

        <div className="flex items-center gap-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.estimate && (
            <Badge variant="outline" className="font-mono text-xs">
              {task.estimate}
            </Badge>
          )}
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  )
}

function PriorityIcon({ priority }: { priority: Task['priority'] }) {
  const getStyles = () => {
    switch (priority) {
      case 'urgent':
        return {
          container: 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)] hover:shadow-[0_0_12px_rgba(239,68,68,0.35)]',
          label: 'Urgent',
          icon: <AlertCircle className="w-3 h-3 shrink-0" />
        }
      case 'high':
        return {
          container: 'bg-orange-500/10 border-orange-500/30 text-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.2)] hover:shadow-[0_0_12px_rgba(249,115,22,0.35)]',
          label: 'High',
          icon: <ArrowUp className="w-3 h-3 shrink-0" />
        }
      case 'medium':
        return {
          container: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.2)] hover:shadow-[0_0_12px_rgba(234,179,8,0.35)]',
          label: 'Med',
          icon: <ArrowRight className="w-3 h-3 shrink-0" />
        }
      case 'low':
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

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'Backlog':
    case 'backlog':
      return <CircleDashed className="w-4 h-4 text-muted-foreground shrink-0" />
    case 'Ready':
      return <Circle className="w-4 h-4 text-sky-400 shrink-0" />
    case 'Todo':
    case 'todo':
      return <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
    case 'In Progress':
    case 'in_progress':
      return <Circle className="w-4 h-4 text-yellow-500 shrink-0" />
    case 'Review':
    case 'in_review':
      return <Eye className="w-4 h-4 text-blue-500 shrink-0" />
    case 'Testing':
      return <TestTube className="w-4 h-4 text-purple-500 shrink-0" />
    case 'Blocked':
      return <XCircle className="w-4 h-4 text-red-500 shrink-0" />
    case 'Done':
    case 'done':
      return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
    case 'Cancelled':
    case 'canceled':
      return <XCircle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
    default:
      return <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
  }
}