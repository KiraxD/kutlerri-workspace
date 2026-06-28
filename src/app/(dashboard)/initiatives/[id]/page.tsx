import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Compass, ArrowLeft, Layers, Calendar, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { STATUS_DOT, STATUS_STYLES } from '@/lib/types'

import { HierarchyBreadcrumb } from '@/components/hierarchy-breadcrumb'
import { EditDeleteControls } from '@/components/EditDeleteControls'

export default async function InitiativeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: initiative, error } = await supabase
    .from('initiatives')
    .select('*, owner:profiles!owner_id(id, full_name, email)')
    .eq('id', id)
    .single()

  if (error || !initiative) notFound()

  const { data: epics } = await supabase
    .from('epics')
    .select('id, name, status, priority, progress, target_date, owner:profiles!owner_id(id, full_name, email)')
    .eq('initiative_id', id)
    .order('created_at', { ascending: false })

  const epicList = epics ?? []
  const totalEpics = epicList.length
  const doneEpics = epicList.filter((e: any) => e.status === 'Done').length
  const progress = initiative.progress ?? (totalEpics > 0 ? Math.round((doneEpics / totalEpics) * 100) : 0)

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <HierarchyBreadcrumb
        items={[
          { label: 'Organization', href: '/home' },
          { label: 'Initiatives', href: '/projects?tab=initiatives' },
          { label: initiative.name, current: true },
        ]}
      />
      {/* Header */}
      <div className="px-8 py-5 border-b border-border bg-gradient-to-r from-violet-50 to-background">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[initiative.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {initiative.status ?? 'Backlog'}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{initiative.name}</h1>
            {initiative.description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{initiative.description}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-3 shrink-0">
            <EditDeleteControls
              entityId={initiative.id}
              entityType="initiative"
              initialData={{
                name: initiative.name,
                description: initiative.description,
                status: initiative.status,
                priority: initiative.priority,
              }}
              redirectOnDelete={initiative.project_id ? `/projects/${initiative.project_id}?tab=initiatives` : "/projects"}
            />

            <div className="space-y-3 text-xs">
              {initiative.owner && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-foreground font-medium w-16">Owner</span>
                  <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">
                    {(initiative.owner.full_name || initiative.owner.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <span>{initiative.owner.full_name || initiative.owner.email}</span>
                </div>
              )}
              {initiative.target_date && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-foreground font-medium w-16">Target</span>
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(initiative.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-foreground font-medium w-16">Epics</span>
                <span className="font-bold text-foreground">{totalEpics}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{doneEpics} of {totalEpics} epics done</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Epics list */}
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" /> Epics
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{totalEpics}</span>
          </h2>
          <Link href={initiative.project_id ? `/epics/new?projectId=${initiative.project_id}&initiativeId=${initiative.id}` : `/epics/new?initiativeId=${initiative.id}`}>
            <Button size="sm" variant="outline" className="gap-2 text-xs">
              <Plus className="w-3 h-3" /> New Epic
            </Button>
          </Link>
        </div>

        {epicList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border rounded-xl text-muted-foreground">
            <Layers className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm font-medium">No epics yet</p>
            <p className="text-xs opacity-60 mt-1">Create epics and link them to this initiative</p>
          </div>
        ) : (
          <div className="space-y-2">
            {epicList.map((epic: any) => {
              const epicProgress = epic.progress ?? 0
              return (
                <Link key={epic.id} href={`/epics/${epic.id}`}>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-blue-300 hover:shadow-sm transition-all group cursor-pointer">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[epic.status] ?? 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-blue-600 transition-colors">
                        {epic.name}
                      </p>
                      {epicProgress > 0 && (
                        <div className="mt-1.5 w-40 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${epicProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {epic.target_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(epic.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {epic.owner && (
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                          {(epic.owner.full_name || epic.owner.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[epic.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {epic.status}
                      </span>
                      {epicProgress > 0 && <span className="text-xs text-muted-foreground">{epicProgress}%</span>}
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
