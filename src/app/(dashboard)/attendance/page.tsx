import { createClient } from '@/lib/supabase/server'
import { getClockInStatusAction, getAttendanceLogsAction } from './actions'
import { AttendanceClient } from './AttendanceClient'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch clock-in status and history logs in parallel
  const [activeLog, logs] = await Promise.all([
    getClockInStatusAction(),
    getAttendanceLogsAction()
  ])

  return (
    <AttendanceClient
      initialActiveLog={activeLog}
      initialLogs={logs}
      currentUserId={user.id}
    />
  )
}
