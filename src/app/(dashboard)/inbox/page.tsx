import { createClient } from '@/lib/supabase/server'
import { Inbox as InboxIcon } from 'lucide-react'

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch notifications that are not archived
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*, issue:issues(*), actor:profiles!actor_id(*)')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <InboxIcon className="w-5 h-5" />
          Inbox
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="p-6 text-red-500">Failed to load inbox.</div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <InboxIcon className="w-12 h-12 mb-4 opacity-20" />
            <p>You're all caught up.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50 p-4 space-y-2">
            {notifications.map((notification: any) => (
              <div key={notification.id} className="p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-muted/50 cursor-pointer backdrop-blur-sm transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-sm text-foreground">
                    {notification.actor?.full_name || notification.actor?.email || 'Someone'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {notification.type === 'mention' && 'mentioned you in'}
                    {notification.type === 'assignment' && 'assigned you to'}
                    {notification.type === 'status_update' && 'updated the status of'}
                    {notification.type === 'comment' && 'commented on'}
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {notification.issue?.identifier}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
