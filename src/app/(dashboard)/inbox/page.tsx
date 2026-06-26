import { createClient } from '@/lib/supabase/server'
import InboxClient from './InboxClient'

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

  return (
    <InboxClient
      initialNotifications={notifications ?? []}
      currentUserId={user.id}
    />
  )
}
