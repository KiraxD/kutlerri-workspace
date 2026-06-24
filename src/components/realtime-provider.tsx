"use client"

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function RealtimeProvider({ userId }: { userId?: string }) {
  const router = useRouter()

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    const notificationsChannel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          router.refresh()
          console.log('New notification:', payload)
        }
      )
      .subscribe()

    const activityChannel = supabase
      .channel('realtime-activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_events' }, () => {
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(notificationsChannel)
      supabase.removeChannel(activityChannel)
    }
  }, [userId, router])

  return null
}