import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowDown, ArrowRight, ArrowUp, Circle, CircleDashed, CheckCircle2, ChevronRight, Copy } from 'lucide-react'

// Note: In Next.js 15, `params` is a Promise.
export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ identifier: string }>
}) {
  const { identifier } = await params
  const supabase = await createClient()

  const { data: issue, error } = await supabase
    .from('issues')
    .select(`
      *,
      creator:profiles!creator_id(*),
      assignee:profiles!assignee_id(*),
      team:teams(*),
      relations_out:issue_relations!issue_relations_issue_id_fkey(
        relation_type,
        related_issue:issues!issue_relations_related_issue_id_fkey(identifier, title, status)
      ),
      relations_in:issue_relations!issue_relations_related_issue_id_fkey(
        relation_type,
        issue:issues!issue_relations_issue_id_fkey(identifier, title, status)
      )
    `)
    .eq('identifier', identifier)
    .single()

  if (error || !issue) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Issue not found
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border text-sm text-muted-foreground">
        <span className="font-medium hover:text-foreground cursor-pointer">{issue.team?.identifier}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="font-mono uppercase">{issue.identifier}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2">
          <Copy className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold mb-4 text-foreground">{issue.title}</h1>
            
            <div className="prose prose-sm dark:prose-invert max-w-none mb-8 text-foreground/90">
              {issue.description ? (
                <p className="whitespace-pre-wrap">{issue.description}</p>
              ) : (
                <p className="text-muted-foreground italic">No description provided.</p>
              )}
            </div>

            {/* Placeholder for comments */}
            <div className="border-t border-border pt-6">
              <h3 className="font-semibold mb-4">Activity</h3>
              <div className="text-sm text-muted-foreground">
                No activity yet.
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Properties */}
        <aside className="w-[300px] border-l border-border bg-muted/10 flex flex-col p-4 gap-6 overflow-y-auto">
          
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Properties</h3>
            
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground w-24">Status</span>
                <div className="flex items-center gap-2 flex-1 justify-start">
                  <StatusIcon status={issue.status} />
                  <span className="capitalize">{issue.status.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground w-24">Assignee</span>
                <div className="flex items-center gap-2 flex-1 justify-start">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">{issue.assignee ? issue.assignee.email[0].toUpperCase() : 'U'}</AvatarFallback>
                  </Avatar>
                  <span>{issue.assignee?.full_name || issue.assignee?.email || 'Unassigned'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground w-24">Priority</span>
                <div className="flex items-center gap-2 flex-1 justify-start">
                  <PriorityIcon priority={issue.priority} />
                  <span className="capitalize">{issue.priority.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground w-24">Estimate</span>
                <div className="flex items-center gap-2 flex-1 justify-start">
                  {issue.estimate ? (
                    <Badge variant="outline" className="font-mono">{issue.estimate}</Badge>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Relations</h3>
            <div className="text-sm flex flex-col gap-2">
              {(!issue.relations_out || issue.relations_out.length === 0) && (!issue.relations_in || issue.relations_in.length === 0) ? (
                <div className="text-muted-foreground">No relations added.</div>
              ) : (
                <>
                  {issue.relations_out?.map((rel: any, i: number) => (
                    <div key={`out-${i}`} className="flex flex-col border border-border p-2 rounded-md bg-background">
                      <span className="text-xs text-muted-foreground capitalize mb-1">{rel.relation_type.replace('_', ' ')}</span>
                      <a href={`/issue/${rel.related_issue.identifier}`} className="font-medium hover:underline text-foreground truncate">
                        {rel.related_issue.identifier} <span className="text-muted-foreground font-normal">{rel.related_issue.title}</span>
                      </a>
                    </div>
                  ))}
                  {issue.relations_in?.map((rel: any, i: number) => (
                    <div key={`in-${i}`} className="flex flex-col border border-border p-2 rounded-md bg-background">
                      <span className="text-xs text-muted-foreground capitalize mb-1">
                        {rel.relation_type === 'blocks' ? 'blocked by' : 
                         rel.relation_type === 'parent' ? 'child' : 
                         rel.relation_type === 'child' ? 'parent' : 
                         `is ${rel.relation_type.replace('_', ' ')} of`}
                      </span>
                      <a href={`/issue/${rel.issue.identifier}`} className="font-medium hover:underline text-foreground truncate">
                        {rel.issue.identifier} <span className="text-muted-foreground font-normal">{rel.issue.title}</span>
                      </a>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}

function PriorityIcon({ priority }: { priority: string }) {
  switch (priority) {
    case 'urgent':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    case 'high':
      return <ArrowUp className="w-4 h-4 text-orange-500" />
    case 'medium':
      return <ArrowRight className="w-4 h-4 text-yellow-500" />
    case 'low':
      return <ArrowDown className="w-4 h-4 text-blue-500" />
    default:
      return <div className="w-4 h-4 flex items-center justify-center text-muted-foreground/50">-</div>
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'backlog':
      return <CircleDashed className="w-4 h-4 text-muted-foreground" />
    case 'todo':
      return <Circle className="w-4 h-4 text-muted-foreground" />
    case 'in_progress':
      return <Circle className="w-4 h-4 text-yellow-500" />
    case 'in_review':
      return <Circle className="w-4 h-4 text-blue-500" />
    case 'done':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case 'canceled':
      return <Circle className="w-4 h-4 text-red-500 line-through" />
  }
}
