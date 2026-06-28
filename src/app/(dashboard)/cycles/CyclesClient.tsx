'use client'

import { useState } from 'react'
import { createCycleAction, rolloverCycleTasksAction } from './actions'
import { updateTaskStatusAction } from '@/app/(dashboard)/tasks/new/actions'
import { CalendarDays, RefreshCw, AlertCircle, Plus, Users, Layout, ArrowUpRight, Flame, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Issue {
  id: string
  identifier: string
  title: string
  status: string
  estimate: number | null
  project_id: string | null
  updated_at: string
}

interface Cycle {
  id: string
  team_id: string
  name: string
  starts_at: string
  ends_at: string
  team?: {
    id: string
    name: string
  } | null
  issues?: Issue[]
}

interface CyclesClientProps {
  initialCycles: any[]
  teams: any[]
  projects: any[]
  userRole: string
}

export function CyclesClient({ initialCycles, teams, projects, userRole }: CyclesClientProps) {
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles)
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedCycleId, setSelectedCycleId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

  const handleToggleTaskStatus = async (issueId: string, currentStatus: string) => {
    if (updatingTaskId) return
    const isCompleted = currentStatus === 'Done'
    const newStatus = isCompleted ? 'Todo' : 'Done'
    
    setUpdatingTaskId(issueId)
    setError(null)
    
    // Optimistic UI update
    setCycles((prevCycles) =>
      prevCycles.map((c) => ({
        ...c,
        issues: c.issues?.map((i) =>
          i.id === issueId ? { ...i, status: newStatus, updated_at: new Date().toISOString() } : i
        ) || []
      }))
    )

    try {
      const res = await updateTaskStatusAction({ id: issueId, status: newStatus })
      if (!res.success) {
        // Rollback
        setCycles((prevCycles) =>
          prevCycles.map((c) => ({
            ...c,
            issues: c.issues?.map((i) =>
              i.id === issueId ? { ...i, status: currentStatus } : i
            ) || []
          }))
        )
        setError(res.error || 'Failed to update task status')
      }
    } catch (err: any) {
      // Rollback
      setCycles((prevCycles) =>
        prevCycles.map((c) => ({
          ...c,
          issues: c.issues?.map((i) =>
            i.id === issueId ? { ...i, status: currentStatus } : i
          ) || []
        }))
      )
      setError(err.message || 'An error occurred')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  // Creation form state
  const [showCreate, setShowCreate] = useState(false)
  const [newCycleName, setNewCycleName] = useState('')
  const [newCycleTeamId, setNewCycleTeamId] = useState(teams[0]?.id || '')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')

  // Rollover state
  const [showRollover, setShowRollover] = useState(false)
  const [rolloverFromId, setRolloverFromId] = useState('')
  const [rolloverToId, setRolloverToId] = useState('')

  // Filter cycles by selected team
  const filteredCycles = cycles.filter((c) => c.team_id === selectedTeamId)
  
  // Active cycle is the one where starts_at <= now <= ends_at
  const now = new Date()
  const activeCycleDefault = filteredCycles.find((c) => {
    const start = new Date(c.starts_at)
    const end = new Date(c.ends_at)
    return start <= now && now <= end
  }) || filteredCycles[0] // fallback to latest if none active

  const activeCycle = filteredCycles.find((c) => c.id === selectedCycleId) || activeCycleDefault

  // Calculate cycle stats (filtered project-wise)
  const cycleIssues = activeCycle?.issues || []
  const filteredIssues = cycleIssues.filter(
    (i) => !selectedProjectId || i.project_id === selectedProjectId
  )
  const totalIssues = filteredIssues.length
  const completedIssues = filteredIssues.filter((i) => i.status === 'Done').length
  
  const totalPoints = filteredIssues.reduce((sum, i) => sum + (i.estimate || 0), 0)
  const completedPoints = filteredIssues.filter((i) => i.status === 'Done').reduce((sum, i) => sum + (i.estimate || 0), 0)
  
  const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCycleName || !newCycleTeamId || !startsAt || !endsAt) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await createCycleAction({
        teamId: newCycleTeamId,
        name: newCycleName,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      })

      if (res.success && res.cycle) {
        const created: Cycle = {
          ...res.cycle,
          team: teams.find((t) => t.id === res.cycle.team_id),
          issues: []
        }
        setCycles((prev) => [created, ...prev])
        setShowCreate(false)
        setNewCycleName('')
        setStartsAt('')
        setEndsAt('')
      } else {
        setError(res.error || 'Failed to create cycle.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleRollover = async () => {
    if (!rolloverFromId || !rolloverToId) {
      setError('Please select both cycles.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await rolloverCycleTasksAction({
        fromCycleId: rolloverFromId,
        toCycleId: rolloverToId,
      })

      if (res.success) {
        // Update local state: move tasks that are not Done/Cancelled from source to target
        setCycles((prev) => {
          return prev.map((c) => {
            if (c.id === rolloverFromId) {
              const activeTasks = c.issues?.filter((i) => i.status === 'Done' || i.status === 'Cancelled') || []
              return { ...c, issues: activeTasks }
            }
            if (c.id === rolloverToId) {
              const sourceCycle = prev.find((x) => x.id === rolloverFromId)
              const rolledTasks = sourceCycle?.issues?.filter((i) => i.status !== 'Done' && i.status !== 'Cancelled') || []
              return { ...c, issues: [...(c.issues || []), ...rolledTasks] }
            }
            return c
          })
        })
        setShowRollover(false)
        setRolloverFromId('')
        setRolloverToId('')
      } else {
        setError(res.error || 'Rollover failed.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // Generate burn-down chart points based on project-wise filtered tasks
  const getBurnDownData = () => {
    if (!activeCycle) return { idealPoints: [], actualPoints: [], labels: [] }

    const start = new Date(activeCycle.starts_at)
    const end = new Date(activeCycle.ends_at)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    if (totalDays <= 0) return { idealPoints: [], actualPoints: [], labels: [] }

    const idealPoints: number[] = []
    const actualPoints: number[] = []
    const labels: string[] = []

    const totalPointsToUse = totalPoints > 0 ? totalPoints : filteredIssues.length

    for (let i = 0; i <= totalDays; i++) {
      const currentDay = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
      labels.push(currentDay.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))

      // Ideal: linear decrease
      const ideal = Math.max(0, parseFloat((totalPointsToUse - (totalPointsToUse / totalDays) * i).toFixed(1)))
      idealPoints.push(ideal)

      // Actual: remaining points at this day
      if (currentDay <= new Date() || i === 0) {
        let completedSoFar = 0
        filteredIssues.forEach((issue) => {
          if (issue.status === 'Done') {
            const completedDate = new Date(issue.updated_at)
            if (completedDate <= currentDay) {
              completedSoFar += totalPoints > 0 ? (issue.estimate || 0) : 1
            }
          }
        })
        actualPoints.push(Math.max(0, totalPointsToUse - completedSoFar))
      }
    }

    return { idealPoints, actualPoints, labels }
  }

  const { idealPoints, actualPoints, labels } = getBurnDownData()
  const isAdminOrManager = ['super_admin', 'admin', 'manager'].includes(userRole)

  return (
    <div className="flex-1 p-8 space-y-8 bg-background max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            <RefreshCw className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Cycle Management</h1>
            <p className="text-xs text-muted-foreground">Plan sprints, track velocity, and analyze burn-down curves project-wise</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Team Selector */}
          <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-border/60">
            <Users className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold py-1 pr-8 pl-1 rounded focus:ring-0 text-foreground cursor-pointer"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Selector (Project-wise Cycle Monitor) */}
          <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-border/60">
            <Layout className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold py-1 pr-8 pl-1 rounded focus:ring-0 text-foreground cursor-pointer"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cycle Selector */}
          {filteredCycles.length > 0 && (
            <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-border/60">
              <CalendarDays className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
              <select
                value={activeCycle?.id || ''}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold py-1 pr-8 pl-1 rounded focus:ring-0 text-foreground cursor-pointer"
              >
                {filteredCycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isAdminOrManager && (
            <>
              <Button
                onClick={() => setShowCreate(true)}
                size="sm"
                className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-violet-500/10"
              >
                <Plus className="w-4 h-4" /> Create Cycle
              </Button>
              {filteredCycles.length > 1 && (
                <Button
                  onClick={() => setShowRollover(true)}
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs font-bold border-border"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Rollover Tasks
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-500">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      {activeCycle ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Card */}
          <div className="md:col-span-1 p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between min-h-[340px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-500 uppercase tracking-wider bg-violet-500/10 px-2 py-0.5 rounded-full">
                  Active Sprint
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(activeCycle.starts_at).toLocaleDateString()} - {new Date(activeCycle.ends_at).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{activeCycle.name}</h2>
              
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground">{progressPercent}% ({completedPoints}/{totalPoints} pts)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/40">
                    <div
                      className="bg-violet-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/40">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Issues</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{completedIssues} / {totalIssues}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-xl border border-border/40">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Story Points</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{completedPoints} / {totalPoints}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground leading-relaxed mt-4 bg-muted/20 p-3 rounded-xl border border-border/30">
              Uncompleted issues can be rolled over to the next cycle by organization admins once this sprint ends.
            </div>
          </div>

          {/* Burn-down Curve Card */}
          <div className="md:col-span-2 p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-1.5 mb-4">
              <Flame className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sprint Burn-Down Chart</h3>
            </div>

            <div className="flex-1 min-h-[200px] flex items-center justify-center relative">
              {idealPoints.length > 0 ? (
                <svg className="w-full h-full min-h-[200px]" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                  <line x1="0" y1="180" x2="500" y2="180" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

                  {/* Ideal Path */}
                  <path
                    d={`M 0,${20 + 160 * (1 - idealPoints[0] / (totalPoints || 1))} ` + 
                       idealPoints.map((val, idx) => `L ${(500 / (idealPoints.length - 1)) * idx},${20 + 160 * (1 - val / (totalPoints || 1))}`).join(' ')}
                    fill="none"
                    stroke="rgba(107, 114, 128, 0.4)"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />

                  {/* Actual Path */}
                  {actualPoints.length > 0 && (
                    <path
                      d={`M 0,${20 + 160 * (1 - actualPoints[0] / (totalPoints || 1))} ` + 
                         actualPoints.map((val, idx) => `L ${(500 / (idealPoints.length - 1)) * idx},${20 + 160 * (1 - val / (totalPoints || 1))}`).join(' ')}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="3"
                    />
                  )}
                </svg>
              ) : (
                <span className="text-xs text-muted-foreground italic">No burn-down data plotted</span>
              )}
            </div>

            <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-4 border-t border-border/40 mt-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-gray-500 border border-dashed border-gray-400" /> Ideal Path</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-violet-500" /> Actual Remaining</span>
              </div>
              <span>Timeline: Starts {new Date(activeCycle.starts_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50">
          <RefreshCw className="w-8 h-8 mx-auto text-muted-foreground/40 mb-4 animate-spin" />
          <h3 className="text-sm font-bold text-foreground">No active cycles</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Create a cycle for the selected team to begin plotting burn-down records and planning tasks.
          </p>
        </div>
      )}

      {/* Task List in Active Cycle */}
      {activeCycle && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-muted/10 border-b border-border/60 flex items-center gap-2">
            <Layout className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-bold text-foreground">Cycle Backlog & Tasks ({totalIssues})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground font-medium uppercase tracking-wider">
                  <th className="px-6 py-3">Identifier</th>
                  <th className="px-6 py-3">Task Title</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Estimate</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic">
                      {selectedProjectId ? 'No issues assigned to this project in this cycle.' : 'No issues assigned to this cycle yet. Open a task\'s details panel to link it here.'}
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-violet-500">
                        {issue.identifier}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {issue.title}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleTaskStatus(issue.id, issue.status)}
                            disabled={updatingTaskId === issue.id}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 hover:scale-105 ${
                              issue.status === 'Done'
                                ? 'bg-green-500/20 border-green-500 text-green-500 hover:bg-green-500/30'
                                : 'border-muted-foreground/30 hover:border-violet-500 text-transparent'
                            }`}
                            title={issue.status === 'Done' ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            {updatingTaskId === issue.id ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin text-muted-foreground" />
                            ) : (
                              <Check className={`w-3.5 h-3.5 ${issue.status === 'Done' ? 'opacity-100' : 'opacity-0 hover:opacity-40'}`} />
                            )}
                          </button>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            issue.status === 'Done'
                              ? 'bg-green-500/10 border-green-500/20 text-green-500'
                              : 'bg-muted border-border text-muted-foreground'
                          }`}>
                            {issue.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-foreground">
                        {issue.estimate != null ? `${issue.estimate} pts` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/task/${issue.identifier}`}
                          className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-bold hover:underline"
                        >
                          View Details <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation Modal / Drawer */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-foreground">Create New Cycle</h2>
            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Cycle Name</label>
                <input
                  type="text"
                  required
                  placeholder='e.g., Cycle 12'
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  className="w-full bg-muted/40 border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Assign to Team</label>
                <select
                  value={newCycleTeamId}
                  onChange={(e) => setNewCycleTeamId(e.target.value)}
                  className="w-full bg-muted/40 border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full bg-muted/40 border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full bg-muted/40 border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                  className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rollover Modal */}
      {showRollover && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-foreground">Rollover Incomplete Tasks</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This action will automatically transfer all active, uncompleted tasks (excluding Done or Cancelled) from the source cycle to the target cycle.
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Source Cycle (From)</label>
                <select
                  value={rolloverFromId}
                  onChange={(e) => setRolloverFromId(e.target.value)}
                  className="w-full bg-muted/40 border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none"
                >
                  <option value="">Select source cycle...</option>
                  {filteredCycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({new Date(c.starts_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Target Cycle (To)</label>
                <select
                  value={rolloverToId}
                  onChange={(e) => setRolloverToId(e.target.value)}
                  className="w-full bg-muted/40 border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none"
                >
                  <option value="">Select target cycle...</option>
                  {filteredCycles.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.id === rolloverFromId}>
                      {c.name} ({new Date(c.starts_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRollover(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRollover}
                disabled={loading || !rolloverFromId || !rolloverToId}
                size="sm"
                className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rollover'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
