'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createStoryAction } from '../actions'

const STATUSES = ['Backlog', 'Ready', 'Todo', 'In Progress', 'Review', 'Testing', 'Blocked', 'Done', 'Cancelled']
const PRIORITIES = ['None', 'Low', 'Medium', 'High', 'Urgent']

interface NewStoryFormProps {
  epics: Array<{ id: string; name: string; initiative?: { name: string } | null }>
  members: Array<{ id: string; full_name: string | null; email: string }>
}

export function NewStoryForm({ epics, members }: NewStoryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const result = await createStoryAction({
      name: fd.get('name') as string,
      description: (fd.get('description') as string) || undefined,
      status: (fd.get('status') as string) || 'Backlog',
      priority: (fd.get('priority') as string) || 'None',
      epicId: (fd.get('epicId') as string) || undefined,
      assigneeId: (fd.get('assigneeId') as string) || undefined,
      startDate: (fd.get('startDate') as string) || undefined,
      dueDate: (fd.get('dueDate') as string) || undefined,
      estimate: fd.get('estimate') ? Number(fd.get('estimate')) : undefined,
    })

    if (result.success) {
      router.push('/stories')
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to create story')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 p-8">
      {/* Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Story Name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          required
          placeholder="As an Admin, I can manage user permissions"
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Description</label>
        <textarea
          name="description"
          rows={4}
          placeholder="Describe the user story and acceptance criteria..."
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition resize-none"
        />
      </div>

      {/* Epic + Status row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Parent Epic</label>
          <select
            name="epicId"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
          >
            <option value="">No Epic</option>
            {epics.map((epic) => (
              <option key={epic.id} value={epic.id}>
                {epic.initiative ? `${epic.initiative.name} / ` : ''}
                {epic.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Status</label>
          <select
            name="status"
            defaultValue="Backlog"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Priority + Assignee row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Priority</label>
          <select
            name="priority"
            defaultValue="None"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Assignee</label>
          <select
            name="assigneeId"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name || m.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dates + Estimate row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Start Date</label>
          <input
            name="startDate"
            type="date"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Due Date</label>
          <input
            name="dueDate"
            type="date"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Estimate (pts)</label>
          <input
            name="estimate"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 5"
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Link href="/stories">
          <Button variant="ghost" size="sm" type="button">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={loading} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
          {loading ? 'Creating…' : 'Create Story'}
        </Button>
      </div>
    </form>
  )
}
