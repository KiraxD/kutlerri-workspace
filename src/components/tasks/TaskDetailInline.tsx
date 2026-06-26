'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateTaskAction } from '@/app/(dashboard)/tasks/new/actions'
import { Task, TaskStatus, TaskPriority } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TaskDetailInlineProps {
  task: Task
  onUpdate?: (updatedTask: Partial<Task>) => void
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function TaskDetailInline({ task, onUpdate }: TaskDetailInlineProps) {
  const supabase = createClient()
  
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [presenceUsers, setPresenceUsers] = useState<any[]>([])

  const titleRef = useRef(title)
  const descRef = useRef(description)

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    titleRef.current = task.title
    descRef.current = task.description || ''
  }, [task])

  // Track Presence
  useEffect(() => {
    if (!task.id) return

    let channel: any = null
    let active = true

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !active) return

      const userDetails = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
      }

      channel = supabase.channel(`task-presence-${task.id}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      })

      channel
        .on('presence', { event: 'sync' }, () => {
          if (!active) return
          const state = channel.presenceState()
          const users: any[] = []
          Object.keys(state).forEach((key) => {
            if (key !== user.id) {
              const presences = state[key] as any[]
              if (presences && presences[0]) {
                users.push(presences[0])
              }
            }
          })
          setPresenceUsers(users)
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED' && active) {
            await channel.track(userDetails)
          }
        })
    })

    return () => {
      active = false
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [task.id, supabase])

  const handleSave = async (updatedFields: { title?: string; description?: string }) => {
    // Only save if values actually changed
    const finalTitle = updatedFields.title !== undefined ? updatedFields.title : titleRef.current
    const finalDesc = updatedFields.description !== undefined ? updatedFields.description : descRef.current

    if (finalTitle === task.title && finalDesc === (task.description || '')) {
      return
    }

    try {
      setSaveStatus('saving')
      const result = await updateTaskAction({
        id: task.id,
        title: finalTitle,
        description: finalDesc,
        status: task.status,
        priority: task.priority,
        estimate: task.estimate,
      })

      if (result.success) {
        setSaveStatus('saved')
        if (onUpdate) {
          onUpdate({ title: finalTitle, description: finalDesc })
        }
        setTimeout(() => {
          setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev))
        }, 2000)
      } else {
        setSaveStatus('error')
        setErrorMessage(result.error || 'Failed to save changes')
      }
    } catch (err: any) {
      setSaveStatus('error')
      setErrorMessage(err.message || 'An error occurred')
    }
  }

  const handleTitleBlur = () => {
    if (title.trim() === '') {
      setTitle(task.title)
      return
    }
    titleRef.current = title
    handleSave({ title })
  }

  const handleDescBlur = () => {
    descRef.current = description
    handleSave({ description })
  }

  return (
    <div className="space-y-6 w-full">
      {/* Presence and Saving Status Row */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
              <Check className="h-3 w-3" />
              Changes saved
            </span>
          )}
          {saveStatus === 'error' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium cursor-help">
                      <AlertCircle className="h-3 w-3" />
                      Save failed
                    </span>
                  }
                />
                <TooltipContent>
                  <p>{errorMessage}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Presence Indicators */}
        <div className="flex items-center gap-1.5">
          {presenceUsers.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground mr-1">Viewing now:</span>
              <div className="flex -space-x-1.5 overflow-hidden">
                <TooltipProvider>
                  {presenceUsers.map((user) => (
                    <Tooltip key={user.id}>
                      <TooltipTrigger
                        render={
                          <Avatar className="h-6 w-6 ring-2 ring-background border-none relative cursor-default select-none animate-pulse">
                            <AvatarFallback className="text-[9px] font-bold bg-primary/20 text-primary uppercase">
                              {user.full_name?.slice(0, 2) || user.email?.slice(0, 2) || '?'}
                            </AvatarFallback>
                          </Avatar>
                        }
                      />
                      <TooltipContent>
                        <p className="text-xs font-semibold">{user.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">{user.email}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title Editor */}
      <div className="space-y-1">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Task title"
          className="w-full text-2xl font-semibold bg-transparent border-none outline-none focus:ring-0 placeholder-muted-foreground/50 text-foreground transition-all rounded px-1 -mx-1 focus:bg-muted/10"
        />
      </div>

      {/* Description Editor */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescBlur}
          placeholder="Add a detailed description..."
          rows={8}
          className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 placeholder-muted-foreground/40 text-foreground/90 resize-none whitespace-pre-wrap transition-all rounded px-1 -mx-1 py-1 focus:bg-muted/10 min-h-[150px]"
        />
      </div>
    </div>
  )
}
