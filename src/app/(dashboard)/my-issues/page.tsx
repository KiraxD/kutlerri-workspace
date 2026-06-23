import { createClient } from '@/lib/supabase/server'
import { IssueList } from '@/components/issues/issue-list'
import { Issue } from '@/lib/types'

export default async function MyIssuesPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Fetch issues assigned to the user
  const { data: issues, error } = await supabase
    .from('issues')
    .select('*')
    .eq('assignee_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold">My Issues</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="p-6 text-red-500">Failed to load issues.</div>
        ) : (
          <IssueList issues={issues as unknown as Issue[]} />
        )}
      </div>
    </div>
  )
}
