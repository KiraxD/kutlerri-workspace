'use client'

import { useState } from 'react'
import { createProjectAction, getTeamsAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProjectPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<{
    teamId: string
    name: string
    description: string
    status: string
    targetDate: string
  }>({
    teamId: '',
    name: '',
    description: '',
    status: 'planned',
    targetDate: '',
  })

  useEffect(() => {
    const loadTeams = async () => {
      const result = await getTeamsAction()
      if (result.success && result.teams && result.teams.length > 0) {
        setTeams(result.teams)
        setFormData((prev) => ({ ...prev, teamId: result.teams![0].id }))
      } else if (!result.success) {
        setError(result.error || 'Failed to load teams')
      } else {
        setError('No teams available. Please create a team first.')
      }
    }
    loadTeams()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await createProjectAction(formData)
    if (result.success) {
      router.push('/projects')
    } else {
      setError(result.error || 'Failed to create project')
    }
    setLoading(false)
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col h-full bg-background overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Create Project</h1>
            <p className="text-muted-foreground">You need to be part of a team to create a project.</p>
          </div>
          <Button onClick={() => router.push('/teams')}>Go to Teams</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="px-8 py-5 border-b border-border">
        <h1 className="text-xl font-bold">Create New Project</h1>
      </div>

      <div className="flex-1 p-8">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="team">Team *</Label>
            <Select value={formData.teamId} onValueChange={(value) => { if (value) setFormData(prev => ({ ...prev, teamId: value })) }}>
              <SelectTrigger id="team">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Q2 Product Launch"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the project..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="min-h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => { if (value) setFormData((prev) => ({ ...prev, status: value })) }}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, targetDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
