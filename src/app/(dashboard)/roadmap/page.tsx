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

  const orgIds = orgMembers?.map(om => om.organization_id) || []

  // Fetch milestones
  const { data: milestones, error } = await supabase
    .from('milestones')
    .select('*')
    .in('organization_id', orgIds)
    .order('target_date', { ascending: true })

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Route className="w-5 h-5" />
          Roadmap & Milestones
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {error ? (
          <div className="text-red-500">Failed to load milestones.</div>
        ) : !milestones || milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed border-border rounded-lg">
            <Flag className="w-10 h-10 mb-4 opacity-20" />
            <p>No milestones found.</p>
            <p className="text-sm mt-2">Milestones track major goals across multiple projects.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone: any) => (
              <div key={milestone.id} className="border border-border rounded-lg p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{milestone.name}</h3>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                </div>
                <div className="text-right">
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
