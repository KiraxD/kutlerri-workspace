import { createClient } from '@/lib/supabase/server'
import { Inbox as InboxIcon, Bell } from 'lucide-react'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch notifications that are not archived
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*, task:tasks(id, identifier, title), actor:profiles!actor_id(id, full_name, email, avatar_url)')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase error loading inbox:', error.message, error.details)
  }

  const notifList = notifications ?? []

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
            {notifList.map((notification: any) => (
              <div
                key={notification.id}
                className="p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/50 cursor-pointer transition-all shadow-sm"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">
                    {notification.actor?.full_name || notification.actor?.email || 'Someone'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {notification.type === 'mention' && 'mentioned you in'}
                    {notification.type === 'assignment' && 'assigned you to'}
                    {notification.type === 'status_update' && 'updated the status of'}
                    {notification.type === 'comment' && 'commented on'}
                    {notification.type === 'completed_work' && 'completed'}
                  </span>
                  {notification.task && (
                    <span className="text-sm font-medium text-primary">
                      {notification.task.identifier} – {notification.task.title}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
