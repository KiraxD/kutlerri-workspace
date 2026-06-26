'use server'

import { createClient } from '@/lib/supabase/server'

export async function getEmployeesAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching employees:', error)
    return []
  }

  return (profiles || []).filter(p => p.id !== user.id)
}

export async function getMessagesAction(otherUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(id, full_name, email), receiver:profiles!receiver_id(id, full_name, email)')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return messages || []
}

export async function sendMessageAction(receiverId: string, content: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    if (!content.trim()) return { success: false, error: 'Message cannot be empty' }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim(),
      })
      .select('*, sender:profiles!sender_id(id, full_name, email), receiver:profiles!receiver_id(id, full_name, email)')
      .single()

    if (error) return { success: false, error: error.message }

    // Create a direct message notification for the receiver
    // Fetch user's organization first to satisfy organization_id constraint
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (member) {
      const { createNotification } = await import('@/lib/notification-helper')
      await createNotification({
        userId: receiverId,
        organizationId: member.organization_id,
        type: 'task_comment', // Passes DB constraint after migration, type checks correctly
        actorId: user.id,
      })
    }

    return { success: true, message }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getConversationsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Fetch recent messages involving the user
  const { data: messages, error } = await supabase
    .from('messages')
    .select('sender_id, receiver_id, read_at')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error || !messages) return []

  // Find unique other user IDs and compute unread counts
  const unreadCounts: Record<string, number> = {}
  const otherUserIdsSet = new Set<string>()

  messages.forEach(m => {
    const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id
    otherUserIdsSet.add(otherId)
    if (m.receiver_id === user.id && !m.read_at) {
      unreadCounts[otherId] = (unreadCounts[otherId] || 0) + 1
    }
  })

  const otherUserIds = Array.from(otherUserIdsSet)
  if (otherUserIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', otherUserIds)

  if (!profiles) return []

  // Map profiles with unreadCount
  return profiles.map(p => ({
    ...p,
    unreadCount: unreadCounts[p.id] || 0
  }))
}

export async function markMessagesAsReadAction(senderId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Mark messages as read
    const { error: msgError } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id)
      .is('read_at', null)

    if (msgError) return { success: false, error: msgError.message }

    // Archive direct message notifications from this sender
    await supabase
      .from('notifications')
      .update({ 
        read_at: new Date().toISOString(), 
        archived_at: new Date().toISOString() 
      })
      .eq('user_id', user.id)
      .eq('actor_id', senderId)
      .eq('type', 'task_comment')
      .is('task_id', null)
      .is('archived_at', null)

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getInboxUnreadCountAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    // Fetch count of unread messages
    const { count: msgCount, error: msgError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .is('read_at', null)

    // Fetch count of active notifications (unread and unarchived)
    const { count: notifCount, error: notifError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('archived_at', null)
      .is('read_at', null)

    const total = (msgCount || 0) + (notifCount || 0)
    return total
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }
}
