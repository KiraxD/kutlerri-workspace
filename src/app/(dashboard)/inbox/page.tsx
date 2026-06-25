import { createClient } from '@/lib/supabase/server'
import { Inbox as InboxIcon, Bell, Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TaskAcceptanceCard } from '@/components/task-acceptance-card'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch notifications that are not archived
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*, task:tasks(id, identifier, title, acceptance_status), actor:profiles!actor_id(id, full_name, email, avatar_url)')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase error loading inbox:', error.message, error.details)
  }

  const notifList = notifications ?? []

  const getNotificationMessage = (notification: any) => {
    const actor = notification.actor?.full_name || notification.actor?.email || 'Someone'

    switch (notification.type) {
      case 'task_acceptance_required':
        return null // Handled by TaskAcceptanceCard below
      case 'subtask_acceptance_required':
        return null // Handled by TaskAcceptanceCard below
      case 'task_assignment_accepted':
        return `${actor} accepted your task assignment`
      case 'task_assignment_declined':
        return `${actor} declined your task assignment`
      case 'task_assigned':
        return `${actor} assigned you to a task`
      case 'task_updated':
        return `${actor} updated a task`
      case 'task_completed':
        return `${actor} completed a task`
      case 'team_created':
        return `${actor} created a team`
      case 'team_member_added':
        return `${actor} added you to a team`
      case 'task_comment':
        return `${actor} commented on a task`
      case 'task_mentioned':
        return `${actor} mentioned you in a task`
      case 'mention':
        return `${actor} mentioned you`
      case 'assignment':
        return `${actor} assigned you to a task`
      case 'status_update':
        return `${actor} updated the status`
      case 'comment':
        return `${actor} commented on`
      case 'completed_work':
        return `${actor} completed`
      default:
        return `${actor} sent you a notification`
    }
  }

  const isAcceptanceRequired = (type: string) =>
    type === 'task_acceptance_required' || type === 'subtask_acceptance_required'

  return (
    <div className="flex flex-col bg-background">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <InboxIcon className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold">Inbox</h1>
        {notifList.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {notifList.length}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Bell className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">You&apos;re all caught up.</p>
            <p className="text-xs mt-1 opacity-60">Notifications will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50 p-4 space-y-2">
            {notifList.map((notification: any) => {
              const actor = notification.actor?.full_name || notification.actor?.email || 'Someone'

              if (isAcceptanceRequired(notification.type) && notification.task) {
                return (
                  <div key={notification.id} className="py-2">
                    <TaskAcceptanceCard
                      taskId={notification.task.id}
                      taskIdentifier={notification.task.identifier}
                      taskTitle={notification.task.title}
                      assignedBy={actor}
                      notificationId={notification.id}
                    />
                    <p className="text-xs text-muted-foreground mt-1.5 px-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                )
              }

              const message = getNotificationMessage(notification)

              return (
                <div
                  key={notification.id}
                  className="p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/50 cursor-pointer transition-all shadow-sm group"
                >
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">
                        {message}
                      </p>
                      {notification.task && (
                        <Link href={`/task/${notification.task.identifier}`}>
                          <p className="text-sm font-medium text-primary mt-1 hover:underline">
                            {notification.task.identifier} – {notification.task.title}
                          </p>
                        </Link>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Archive">
                        <Archive className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
