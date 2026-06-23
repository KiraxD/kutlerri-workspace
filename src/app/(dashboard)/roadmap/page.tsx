import { createClient } from '@/lib/supabase/server'
import { Route, Flag } from 'lucide-react'

export default async function RoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch orgs the user is part of
  const { data: orgMembers } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)

  const orgIds = orgMembers?.map(om => om.organization_id) ?? []

  let milestones: any[] = []
  if (orgIds.length > 0) {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .in('organization_id', orgIds)
      .order('target_date', { ascending: true })
    if (!error && data) milestones = data
    if (error) console.error('Error loading milestones:', error.message)
  }

  return (
    <div className="flex flex-col bg-background">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Route className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold">Roadmap &amp; Milestones</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed border-border rounded-lg">
            <Flag className="w-10 h-10 mb-4 opacity-20" />
            <p className="text-sm font-medium">No milestones yet</p>
            <p className="text-xs mt-1 opacity-60">Milestones track major goals across multiple projects.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone: any) => (
              <div key={milestone.id} className="border border-border rounded-lg p-5 flex items-center justify-between hover:bg-muted/30 hover:shadow-sm transition-all">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{milestone.name}</h3>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-sm font-medium mb-1">
                    {milestone.target_date ? new Date(milestone.target_date).toLocaleDateString() : 'No Target Date'}
                  </div>
                  <div className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize inline-block">
                    {milestone.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
