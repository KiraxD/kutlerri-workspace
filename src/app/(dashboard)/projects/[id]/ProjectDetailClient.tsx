'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Compass,
  Layers,
  BookOpen,
  CheckCircle2,
  FileText,
  Calendar,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { STATUS_DOT, STATUS_STYLES, STATUS_ORDER } from '@/lib/types'

interface ProjectDetailClientProps {
  project: any
  members: any[]
  initiatives: any[]
  epics: any[]
  stories: any[]
  tasks: any[]
}

const TAB_ICONS: Record<string, React.ReactNode> = {
  overview: <FileText className="w-4 h-4" />,
  initiatives: <Compass className="w-4 h-4 text-emerald-400" />,
  epics: <Layers className="w-4 h-4 text-amber-400" />,
  stories: <BookOpen className="w-4 h-4 text-green-400" />,
  tasks: <CheckCircle2 className="w-4 h-4 text-indigo-400" />,
}

export default function ProjectDetailClient({
  project,
  members,
  initiatives,
  epics,
  stories,
  tasks,
}: ProjectDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'initiatives' | 'epics' | 'stories' | 'tasks'>('overview')

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Project Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {project.description && (
                <div className="border border-border rounded-xl p-6 bg-card">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">{project.description}</p>
                </div>
              )}

              {/* Project Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-border rounded-xl p-4 bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge className="capitalize font-medium">{project.status?.replace('_', ' ')}</Badge>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Target Date
                  </p>
                  <p className="text-sm font-medium">{formatDate(project.target_date)}</p>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm font-medium">{formatDate(project.created_at)}</p>
                </div>
                <div className="border border-border rounded-xl p-4 bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Team</p>
                  <p className="text-sm font-medium">{project.team?.name}</p>
                </div>
              </div>
            </div>

            {/* Right column - Team Members */}
            <div className="lg:col-span-1">
              <div className="border border-border rounded-xl p-6 bg-card sticky top-8">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Members ({members.length})
                </h3>
                <div className="space-y-3">
                  {members.length > 0 ? (
                    members.map((member) => (
                      <div key={member.user_id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {member.profile?.full_name?.slice(0, 2).toUpperCase() ||
                              member.profile?.email?.slice(0, 2).toUpperCase() ||
                              'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {member.profile?.full_name || member.profile?.email}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {member.role?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No members yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 'initiatives':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold">Project Initiatives ({initiatives.length})</h2>
              <Link href={`/initiatives/new?projectId=${project.id}`}>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> New Initiative
                </Button>
              </Link>
            </div>

            {initiatives.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
                <Compass className="w-8 h-8 mx-auto mb-3 text-muted-foreground/60" />
                <p className="text-sm font-medium">No initiatives in this project yet</p>
                <p className="text-xs mt-1">Create initiatives to represent high-level strategic goals</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {initiatives.map((initiative: any) => {
                  const progress = initiative.progress ?? 0
                  return (
                    <Link key={initiative.id} href={`/initiatives/${initiative.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-emerald-400/50 hover:shadow-sm transition-all group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[initiative.status] ?? 'bg-gray-300'}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-emerald-600 transition-colors">
                              {initiative.name}
                            </p>
                            {initiative.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-lg">
                                {initiative.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                          {progress > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground font-medium">{progress}%</span>
                            </div>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[initiative.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {initiative.status}
                          </span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )

      case 'epics':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold">Project Epics ({epics.length})</h2>
              <Link href={`/epics/new?projectId=${project.id}`}>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> New Epic
                </Button>
              </Link>
            </div>

            {epics.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
                <Layers className="w-8 h-8 mx-auto mb-3 text-muted-foreground/60" />
                <p className="text-sm font-medium">No epics in this project yet</p>
                <p className="text-xs mt-1">Create epics to organize large bodies of tasks</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {epics.map((epic: any) => {
                  const progress = epic.progress ?? 0
                  return (
                    <Link key={epic.id} href={`/epics/${epic.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-amber-400/50 hover:shadow-sm transition-all group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[epic.status] ?? 'bg-gray-300'}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-amber-600 transition-colors">
                              {epic.name}
                            </p>
                            {epic.initiative && (
                              <span className="inline-flex items-center gap-1 mt-0.5 text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                                <Compass className="w-3 h-3" /> {epic.initiative.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                          {progress > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progress}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground font-medium">{progress}%</span>
                            </div>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[epic.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {epic.status}
                          </span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )

      case 'stories':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold">Project Stories ({stories.length})</h2>
            </div>

            {stories.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-3 text-muted-foreground/60" />
                <p className="text-sm font-medium">No stories in this project yet</p>
                <p className="text-xs mt-1">Stories represent user perspectives linked to Epics</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {stories.map((story: any) => (
                  <Link key={story.id} href={`/stories/${story.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-green-400/50 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[story.status] ?? 'bg-gray-300'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate group-hover:text-green-600 transition-colors">
                            {story.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {story.epic && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                                <Layers className="w-2.5 h-2.5" /> {story.epic.name}
                              </span>
                            )}
                            {story.epic?.initiative && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                                <Compass className="w-2.5 h-2.5" /> {story.epic.initiative.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[story.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {story.status}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )

      case 'tasks':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold">Team Tasks ({tasks.length})</h2>
              <Link href="/tasks/new">
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Create Task
                </Button>
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-muted-foreground/60" />
                <p className="text-sm font-medium">No tasks found for this project's team</p>
                <p className="text-xs mt-1">Get started by creating a new task</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {tasks.map((task: any) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-indigo-400/50 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[task.status] ?? 'bg-gray-300'}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-muted-foreground shrink-0">
                              {task.identifier}
                            </span>
                            <p className="text-sm font-semibold truncate group-hover:text-indigo-600 transition-colors">
                              {task.title}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {task.assignee && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                              {(task.assignee.full_name || task.assignee.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="hidden sm:block truncate max-w-[80px]">
                              {task.assignee.full_name?.split(' ')[0] || 'User'}
                            </span>
                          </div>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {task.status}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-gradient-to-r from-blue-50/50 via-background to-background">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon" className="hover:bg-slate-100">
              <FileText className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading">{project.name}</h1>
              <p className="text-xs text-muted-foreground">{project.team?.name}</p>
            </div>
          </div>
        </div>
        <Badge className="capitalize bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
          {project.status?.replace('_', ' ')}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border px-8 bg-muted/10">
        {(['overview', 'initiatives', 'epics', 'stories', 'tasks'] as const).map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all capitalize -mb-[2px] ${
                isActive
                  ? 'border-blue-600 text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {TAB_ICONS[tab]}
              <span>{tab}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-8">{renderTabContent()}</div>
    </div>
  )
}
