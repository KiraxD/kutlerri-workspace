import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Layers, ArrowLeft, Compass, BookOpen, Calendar, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { STATUS_DOT, STATUS_STYLES } from '@/lib/types'

const PRIORITY_COLOR: Record<string, string> = {
  None: 'text-gray-400',
  Low: 'text-blue-500',
  Medium: 'text-yellow-600',
  High: 'text-orange-500',
  Urgent: 'text-red-600',
}
const PRIORITY_ICON: Record<string, string> = {
  None: '—', Low: '↓', Medium: '↔', High: '↑', Urgent: '⚡',
}

import { HierarchyBreadcrumb } from '@/components/hierarchy-breadcrumb'
import { EditDeleteControls } from '@/components/EditDeleteControls'

export default async function EpicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: epic, error } = await supabase
    .from('epics')
    .select('*, initiative:initiatives(id, name), owner:profiles!owner_id(id, full_name, email)')
    .eq('id', id)
    .single()

  if (error || !epic) notFound()

  const { data: stories } = await supabase
    .from('stories')
    .select(
      'id, name, status, priority, progress, due_date, owner:profiles!owner_id(id, full_name, email)'
    )
    .eq('epic_id', id)
    .order('created_at', { ascending: false })

  const storyList = stories ?? []
  const totalStories = storyList.length
  const doneStories = storyList.filter((s: any) => s.status === 'Done').length
  const progress = epic.progress ?? (totalStories > 0 ? Math.round((doneStories / totalStories) * 100) : 0)

  // Also get total task count across stories
  let totalTasks = 0
  if (storyList.length > 0) {
    const storyIds = storyList.map((s: any) => s.id)
    const { count } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('story_id', storyIds)
    totalTasks = count ?? 0
  }

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <HierarchyBreadcrumb
        items={[
          { label: 'Organization', href: '/home' },
          ...(epic.initiative ? [{ label: epic.initiative.name, href: `/initiatives/${epic.initiative.id}` }] : []),
          { label: 'Epics', href: '/projects?tab=epics' },
          { label: epic.name, current: true },
        ]}
      />
      {/* Header */}
      <div className="px-8 py-5 border-b border-border bg-gradient-to-r from-blue-50 to-background">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[epic.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {epic.status ?? 'Backlog'}
              </span>
              {epic.priority && epic.priority !== 'None' && (
                <span className={`text-xs font-semibold ${PRIORITY_COLOR[epic.priority]}`}>
                  {PRIORITY_ICON[epic.priority]} {epic.priority}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold">{epic.name}</h1>
            {epic.description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{epic.description}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-3 shrink-0">
            <EditDeleteControls
              entityId={epic.id}
              entityType="epic"
              initialData={{
                name: epic.name,
                description: epic.description,
                status: epic.status,
                priority: epic.priority,
              }}
              redirectOnDelete={epic.project_id ? `/projects/${epic.project_id}?tab=epics` : "/projects"}
            />

            <div className="space-y-3 text-xs">
              {epic.owner && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-foreground font-medium w-16">Owner</span>
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                    {(epic.owner.full_name || epic.owner.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <span>{epic.owner.full_name || epic.owner.email}</span>
                </div>
              )}
              {epic.target_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-foreground font-medium w-16">Target</span>
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(epic.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-foreground font-medium w-16">Stories</span>
                <span className="font-bold text-foreground">{totalStories}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-foreground font-medium w-16">Tasks</span>
                <span className="font-bold text-foreground">{totalTasks}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{doneStories} of {totalStories} stories done</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stories list */}
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Stories
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{totalStories}</span>
          </h2>
          <Link href={epic.project_id ? `/stories/new?projectId=${epic.project_id}&epicId=${epic.id}` : `/stories/new?epicId=${epic.id}`}>
            <Button size="sm" variant="outline" className="gap-2 text-xs">
              <Plus className="w-3 h-3" /> New Story
            </Button>
          </Link>
        </div>

        {storyList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-xl text-muted-foreground">
            <BookOpen className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm font-medium">No stories yet</p>
            <p className="text-xs opacity-60 mt-1">Create stories and link them to this epic</p>
          </div>
        ) : (
          <div className="space-y-2">
            {storyList.map((story: any) => {
              const storyProgress = story.progress ?? 0
              const priority = story.priority ?? 'None'
              return (
                <Link key={story.id} href={`/stories/${story.id}`}>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-emerald-300 hover:shadow-sm transition-all group cursor-pointer">
                    <span className={`text-sm font-bold shrink-0 w-5 text-center ${PRIORITY_COLOR[priority]}`}>
                      {PRIORITY_ICON[priority]}
                    </span>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[story.status] ?? 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-emerald-600 transition-colors">
                        {story.name}
                      </p>
                      {storyProgress > 0 && (
                        <div className="mt-1.5 w-40 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${storyProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {story.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(story.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {story.owner && (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                          {(story.owner.full_name || story.owner.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[story.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {story.status}
                      </span>
                      {storyProgress > 0 && <span className="text-xs text-muted-foreground">{storyProgress}%</span>}
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
