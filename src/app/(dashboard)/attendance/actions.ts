'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ClockInParams {
  latitude?: number | null
  longitude?: number | null
  locationName?: string | null
}

export async function getClockInStatusAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: log, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', user.id)
      .is('clock_out', null)
      .maybeSingle()

    if (error) {
      console.error('Error fetching clock-in status:', error)
      return null
    }

    return log
  } catch (error) {
    console.error('Error in getClockInStatusAction:', error)
    return null
  }
}

export async function clockInAction(params: ClockInParams = {}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Fetch user's active organization
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (memberError || !member) {
      return { success: false, error: 'User is not part of any organization.' }
    }

    // Check if already clocked in
    const active = await getClockInStatusAction()
    if (active) {
      return { success: false, error: 'You are already clocked in.' }
    }

    const { data, error } = await supabase
      .from('attendance_logs')
      .insert({
        user_id: user.id,
        organization_id: member.organization_id,
        clock_in: new Date().toISOString(),
        latitude: params.latitude || null,
        longitude: params.longitude || null,
        location_name: params.locationName || null,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/attendance')
    return { success: true, log: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function clockOutAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Find active log
    const active = await getClockInStatusAction()
    if (!active) {
      return { success: false, error: 'No active clock-in log found.' }
    }

    const clockOutTime = new Date()
    const clockInTime = new Date(active.clock_in)
    
    // Calculate total hours
    const diffMs = clockOutTime.getTime() - clockInTime.getTime()
    const totalHours = Math.max(0.01, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)))

    const { data, error } = await supabase
      .from('attendance_logs')
      .update({
        clock_out: clockOutTime.toISOString(),
        total_hours: totalHours,
        updated_at: clockOutTime.toISOString(),
      })
      .eq('id', active.id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/attendance')
    return { success: true, log: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAttendanceLogsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Fetch user's role to see if manager/admin
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!member) return []

    const isPrivileged = ['super_admin', 'admin', 'manager'].includes(member.role)

    if (isPrivileged) {
      // Query all logs in the organization
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*, profile:profiles!user_id(id, full_name, email)')
        .eq('organization_id', member.organization_id)
        .order('clock_in', { ascending: false })

      if (error) throw error
      return data || []
    } else {
      // Query user's own logs only
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*, profile:profiles!user_id(id, full_name, email)')
        .eq('user_id', user.id)
        .order('clock_in', { ascending: false })

      if (error) throw error
      return data || []
    }
  } catch (error) {
    console.error('Error fetching attendance logs:', error)
    return []
  }
}
