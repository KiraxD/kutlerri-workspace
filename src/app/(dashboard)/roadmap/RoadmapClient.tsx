'use client'

import { useState } from 'react'
import { updateInitiativeDatesAction, updateEpicDatesAction } from './actions'
import { Route, Compass, Layers, CalendarDays, ChevronRight, List, GanttChartSquare, Edit2, Loader2, Link2 } from 'lucide-react'
import Link from 'next/link'
import { STATUS_STYLES } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface RoadmapClientProps {
  initialInitiatives: any[]
  initialIndependentEpics: any[]
  userRole: string
}

export function RoadmapClient({ initialInitiatives, initialIndependentEpics, userRole }: RoadmapClientProps) {
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline')
  const [initiatives, setInitiatives] = useState(initialInitiatives)
  const [independentEpics, setIndependentEpics] = useState(initialIndependentEpics)

  // Edit popover state
  const [editingItem, setEditingItem] = useState<{ id: string; type: 'initiative' | 'epic'; name: string; start: string; target: string } | null>(null)
  const [saving, setSaving] = useState(false)

  // Timeline boundaries (6 months starting from current month)
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentYear, currentMonth + i, 1)
    return {
      name: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      value: d
    }
  })

  const minTime = months[0].value.getTime()
  const maxTime = new Date(months[5].value.getFullYear(), months[5].value.getMonth() + 1, 0).getTime()
  const totalDuration = maxTime - minTime

  const calculateBarPosition = (startStr: string | null, targetStr: string | null) => {
    if (!startStr || !targetStr) {
      // Default to 1-month middle bar if no dates set
      return { left: '20%', width: '15%', hasDates: false }
    }

    const start = new Date(startStr).getTime()
    const target = new Date(targetStr).getTime()

    const clampedStart = Math.max(minTime, Math.min(maxTime, start))
    const clampedTarget = Math.max(minTime, Math.min(maxTime, target))

    const leftPercent = ((clampedStart - minTime) / totalDuration) * 100
    const widthPercent = ((clampedTarget - clampedStart) / totalDuration) * 100

    return {
      left: `${Math.max(0, Math.min(95, leftPercent))}%`,
      width: `${Math.max(5, Math.min(100, widthPercent))}%`,
      hasDates: true
    }
  }

  const handleOpenEdit = (item: any, type: 'initiative' | 'epic') => {
    if (!['super_admin', 'admin', 'manager'].includes(userRole)) return
    
    setEditingItem({
      id: item.id,
      type,
      name: item.name,
      start: item.start_date ? new Date(item.start_date).toISOString().split('T')[0] : '',
      target: item.target_date ? new Date(item.target_date).toISOString().split('T')[0] : ''
    })
  }

  const handleSaveDates = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    setSaving(true)
    const startVal = editingItem.start ? new Date(editingItem.start).toISOString() : null
    const targetVal = editingItem.target ? new Date(editingItem.target).toISOString() : null

    try {
      if (editingItem.type === 'initiative') {
        const res = await updateInitiativeDatesAction({
          id: editingItem.id,
          startDate: startVal,
          targetDate: targetVal
        })
        if (res.success && res.initiative) {
          setInitiatives((prev) =>
            prev.map((i) => (i.id === editingItem.id ? { ...i, start_date: startVal, target_date: targetVal } : i))
          )
        }
      } else {
        const res = await updateEpicDatesAction({
          id: editingItem.id,
          startDate: startVal,
          targetDate: targetVal
        })
        if (res.success && res.epic) {
          setInitiatives((prev) =>
            prev.map((i) => ({
              ...i,
              epics: i.epics?.map((e: any) => (e.id === editingItem.id ? { ...e, start_date: startVal, target_date: targetVal } : e)) || []
            }))
          )
          setIndependentEpics((prev) =>
            prev.map((e) => (e.id === editingItem.id ? { ...e, start_date: startVal, target_date: targetVal } : e))
          )
        }
      }
      setEditingItem(null)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-8 py-5 border-b border-border bg-gradient-to-r from-violet-50/50 to-background gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Route className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Roadmap Timeline</h1>
            <p className="text-xs text-muted-foreground font-medium">Track and reschedule organization initiatives & epics</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-border/60 shrink-0 self-end sm:self-auto">
          <Button
            onClick={() => setViewMode('timeline')}
            variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-lg text-xs font-semibold gap-1.5"
          >
            <GanttChartSquare className="w-3.5 h-3.5" /> Timeline View
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-lg text-xs font-semibold gap-1.5"
          >
            <List className="w-3.5 h-3.5" /> List View
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        {initiatives.length === 0 && independentEpics.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[420px]">
            <div className="w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center mb-6">
              <Route className="w-10 h-10 text-violet-400 opacity-60" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No roadmap data yet</h2>
            <p className="text-muted-foreground text-sm text-center max-w-md mb-6">
              Create Initiatives and link Epics to them to see the roadmap timeline here.
            </p>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="space-y-6">
            {initiatives.map((initiative: any) => {
              const progress = initiative.progress ?? 0
              return (
                <div key={initiative.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                  {/* Initiative row */}
                  <Link href={`/initiatives/${initiative.id}`}>
                    <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-violet-50/60 to-transparent hover:from-violet-100/70 transition-all group border-b border-border/60">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <Compass className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold group-hover:text-violet-700 transition-colors truncate">
                            {initiative.name}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLES[initiative.status] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {initiative.status ?? 'Backlog'}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                        {initiative.target_date ? (
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {new Date(initiative.target_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">No target date</span>
                        )}
                        <span className="text-muted-foreground/60">{initiative.epics?.length ?? 0} epics</span>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </div>
                  </Link>

                  {/* Epics nested */}
                  {initiative.epics?.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {initiative.epics.map((epic: any) => {
                        const epicProgress = epic.progress ?? 0
                        return (
                          <Link key={epic.id} href={`/epics/${epic.id}`}>
                            <div className="flex items-center gap-4 px-6 py-3 pl-14 hover:bg-blue-50/40 transition-all group">
                              <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                                <Layers className="w-3 h-3 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm font-medium group-hover:text-blue-600 transition-colors truncate">
                                    {epic.name}
                                  </p>
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLES[epic.status] ?? 'bg-gray-100 text-gray-500'}`}
                                  >
                                    {epic.status ?? 'Backlog'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                                {epic.target_date ? (
                                  <div className="flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3" />
                                    {new Date(epic.target_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/40">No date</span>
                                )}
                                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="px-14 py-3 text-xs text-muted-foreground italic">No epics linked yet</div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* Timeline (Gantt) View */
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
            {/* Timeline Header Row (Months) */}
            <div className="grid grid-cols-6 border-b border-border/80 bg-muted/20 text-center py-3 text-xs font-bold text-muted-foreground font-mono uppercase tracking-wider">
              {months.map((m, idx) => (
                <div key={idx} className="border-r border-border last:border-none py-1">
                  {m.name}
                </div>
              ))}
            </div>

            {/* Gantt Rows */}
            <div className="divide-y divide-border/60">
              {initiatives.map((initiative: any) => {
                const initPos = calculateBarPosition(initiative.start_date, initiative.target_date)
                return (
                  <div key={initiative.id} className="relative py-4 hover:bg-muted/10 transition-colors">
                    {/* Initiative Row */}
                    <div className="flex flex-col gap-1 px-6">
                      <div className="flex items-center justify-between gap-4">
                        <Link href={`/initiatives/${initiative.id}`} className="hover:underline flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-violet-500" />
                          <span className="text-xs font-bold text-foreground">{initiative.name}</span>
                        </Link>
                        {['super_admin', 'admin', 'manager'].includes(userRole) && (
                          <button
                            onClick={() => handleOpenEdit(initiative, 'initiative')}
                            className="p-1 text-muted-foreground/50 hover:text-violet-500 rounded hover:bg-muted"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Timeline Bar Track */}
                      <div className="w-full bg-muted/20 h-8 rounded-lg relative overflow-hidden border border-border/40 mt-1">
                        <div
                          style={{ left: initPos.left, width: initPos.width }}
                          className={`absolute top-1 bottom-1 rounded-md bg-gradient-to-r from-violet-500/80 to-violet-600/90 text-white flex items-center px-3 text-[10px] font-semibold truncate border border-violet-500/20 shadow-sm ${initPos.hasDates ? 'cursor-pointer hover:shadow-md' : 'opacity-30'}`}
                          onClick={() => handleOpenEdit(initiative, 'initiative')}
                        >
                          {initiative.name} {!initPos.hasDates && ' (Click to set dates)'}
                        </div>
                      </div>
                    </div>

                    {/* Epic Rows Nested */}
                    {initiative.epics?.length > 0 && (
                      <div className="pl-12 pr-6 mt-3 space-y-3 relative border-l-2 border-dashed border-violet-200/40 ml-10">
                        {initiative.epics.map((epic: any) => {
                          const epicPos = calculateBarPosition(epic.start_date, epic.target_date)
                          return (
                            <div key={epic.id} className="space-y-1 relative">
                              {/* Visual connector line indicator */}
                              <div className="flex items-center justify-between gap-4">
                                <Link href={`/epics/${epic.id}`} className="hover:underline flex items-center gap-1.5">
                                  <Layers className="w-3 h-3 text-blue-500" />
                                  <span className="text-[11px] font-semibold text-muted-foreground">{epic.name}</span>
                                </Link>
                                {['super_admin', 'admin', 'manager'].includes(userRole) && (
                                  <button
                                    onClick={() => handleOpenEdit(epic, 'epic')}
                                    className="p-1 text-muted-foreground/40 hover:text-blue-500 rounded hover:bg-muted"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              <div className="w-full bg-muted/20 h-6 rounded-md relative overflow-hidden border border-border/30">
                                <div
                                  style={{ left: epicPos.left, width: epicPos.width }}
                                  className={`absolute top-0.5 bottom-0.5 rounded-md bg-gradient-to-r from-blue-400 to-blue-500 text-white flex items-center px-2 text-[9px] font-medium truncate shadow-sm ${epicPos.hasDates ? 'cursor-pointer hover:shadow-md' : 'opacity-30'}`}
                                  onClick={() => handleOpenEdit(epic, 'epic')}
                                >
                                  {epic.name} {!epicPos.hasDates && ' (Set dates)'}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Date Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h2 className="text-sm font-bold text-foreground">Reschedule Dates</h2>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{editingItem.name}</p>
            </div>

            <form onSubmit={handleSaveDates} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Start Date</label>
                <input
                  type="date"
                  value={editingItem.start}
                  onChange={(e) => setEditingItem({ ...editingItem, start: e.target.value })}
                  className="w-full bg-muted/40 border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Target Date / Due Date</label>
                <input
                  type="date"
                  value={editingItem.target}
                  onChange={(e) => setEditingItem({ ...editingItem, target: e.target.value })}
                  className="w-full bg-muted/40 border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  size="sm"
                  className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Dates'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
