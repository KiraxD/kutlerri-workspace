'use client'

import { useState, useEffect } from 'react'
import { clockInAction, clockOutAction } from './actions'
import { CalendarDays, MapPin, Compass, Play, Square, Loader2, ArrowUpRight, History } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AttendanceLog {
  id: string
  user_id: string
  clock_in: string
  clock_out: string | null
  latitude: number | null
  longitude: number | null
  location_name: string | null
  total_hours: number | null
  profile?: {
    full_name: string | null
    email: string
  } | null
}

interface AttendanceClientProps {
  initialLogs: any[]
  initialActiveLog: any | null
  currentUserId: string
}

export function AttendanceClient({ initialLogs, initialActiveLog, currentUserId }: AttendanceClientProps) {
  const [activeLog, setActiveLog] = useState<AttendanceLog | null>(initialActiveLog)
  const [logs, setLogs] = useState<AttendanceLog[]>(initialLogs)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState('00:00:00')

  // Live timer for active session
  useEffect(() => {
    if (!activeLog) {
      setElapsedTime('00:00:00')
      return
    }

    const interval = setInterval(() => {
      const start = new Date(activeLog.clock_in).getTime()
      const now = new Date().getTime()
      const diff = now - start

      const secs = Math.floor((diff / 1000) % 60)
      const mins = Math.floor((diff / (1000 * 60)) % 60)
      const hours = Math.floor(diff / (1000 * 60 * 60))

      const formatted = [
        hours.toString().padStart(2, '0'),
        mins.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
      ].join(':')

      setElapsedTime(formatted)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeLog])

  const handleClockIn = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          const result = await clockInAction({
            latitude,
            longitude,
            locationName: 'GPS Coordinates'
          })

          if (result.success && result.log) {
            setActiveLog(result.log as AttendanceLog)
            setLogs((prev) => [result.log as AttendanceLog, ...prev])
          } else {
            setError(result.error ?? 'Failed to clock in.')
          }
        } catch (err: any) {
          setError(err.message || 'An error occurred during clock in.')
        } finally {
          setLoading(false)
        }
      },
      async (geoError) => {
        let msg = 'Location permission is required to clock in.'
        if (geoError.code === geoError.PERMISSION_DENIED) {
          msg = 'Please enable location permissions in your browser to clock in.'
        }
        setError(msg)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleClockOut = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await clockOutAction()
      if (result.success && result.log) {
        setActiveLog(null)
        setLogs((prev) =>
          prev.map((log) => (log.id === result.log.id ? (result.log as AttendanceLog) : log))
        )
      } else {
        setError(result.error ?? 'Failed to clock out.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during clock out.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 p-8 space-y-8 bg-background max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <CalendarDays className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Attendance & Location Tracking</h1>
          <p className="text-xs text-muted-foreground">Clock in and verify exact location with Google Maps</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Clock Controls Card */}
        <div className="md:col-span-1 p-6 rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm relative flex flex-col justify-between min-h-[300px]">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Session</h2>
            {activeLog ? (
              <div className="space-y-2">
                <div className="text-3xl font-mono font-bold tracking-wider text-emerald-500 tabular-nums">
                  {elapsedTime}
                </div>
                <p className="text-xs text-muted-foreground">
                  Clocked in at {new Date(activeLog.clock_in).toLocaleTimeString()}
                </p>
                {activeLog.latitude && activeLog.longitude && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/40">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Lat: {activeLog.latitude.toFixed(5)}, Lon: {activeLog.longitude.toFixed(5)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-3xl font-mono font-bold tracking-wider text-muted-foreground/40">
                  00:00:00
                </div>
                <p className="text-xs text-muted-foreground">You are currently clocked out.</p>
              </div>
            )}
          </div>

          <div className="space-y-4 mt-6">
            {error && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                {error}
              </p>
            )}

            {activeLog ? (
              <Button
                onClick={handleClockOut}
                disabled={loading}
                className="w-full py-6 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 border border-red-500/20 shadow-lg shadow-red-500/10"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Square className="w-4 h-4 shrink-0 fill-current" />
                    Clock Out
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleClockIn}
                disabled={loading}
                className="w-full py-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 border border-emerald-500/20 shadow-lg shadow-emerald-500/10"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 shrink-0 fill-current" />
                    Clock In
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Info Box / Location Overview */}
        <div className="md:col-span-2 p-6 rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm relative flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-primary" /> Location Verification
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              To ensure compliance and transparency, exact GPS coordinates are fetched using your browser's Geolocation API on clock-in. These coordinates are locked inside the database and generate a Google Maps link visible to both you and the workspace administrators.
            </p>
          </div>

          {activeLog && activeLog.latitude && activeLog.longitude && (
            <div className="mt-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Current Clock-in Location</p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Coordinates: {activeLog.latitude}, {activeLog.longitude}
                </p>
              </div>
              <a
                href={`https://www.google.com/maps?q=${activeLog.latitude},${activeLog.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shrink-0"
              >
                View on Google Maps <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Logs History Table */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-muted/10 border-b border-border/60 flex items-center gap-2">
          <History className="w-4 h-4 text-violet-500" />
          <h2 className="text-sm font-bold text-foreground">Attendance Logs & Logs History</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-muted-foreground font-medium uppercase tracking-wider">
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Clock In</th>
                <th className="px-6 py-3">Clock Out</th>
                <th className="px-6 py-3">Total Time</th>
                <th className="px-6 py-3">Location & Coordinates</th>
                <th className="px-6 py-3 text-right">Maps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground italic">
                    No attendance logs found. Clock in to create your first log!
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isOwnLog = log.user_id === currentUserId
                  return (
                    <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">
                          {log.profile?.full_name || 'Anonymous'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{log.profile?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {new Date(log.clock_in).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {log.clock_out ? (
                          new Date(log.clock_out).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        ) : (
                          <span className="text-emerald-500 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-foreground">
                        {log.total_hours != null ? `${log.total_hours} hrs` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {log.latitude && log.longitude ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {log.latitude.toFixed(5)}, {log.longitude.toFixed(5)}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">{log.location_name || 'GPS'}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">No location</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {log.latitude && log.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-bold hover:underline"
                          >
                            Open Maps <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
