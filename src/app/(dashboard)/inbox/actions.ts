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
    .select('sender_id, receiver_id, created_at')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error || !messages) return []

  // Find unique other user IDs
  const otherUserIds = Array.from(
    new Set(
      messages.map(m => (m.sender_id === user.id ? m.receiver_id : m.sender_id))
    )
  )

  if (otherUserIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', otherUserIds)

  return profiles || []
}
