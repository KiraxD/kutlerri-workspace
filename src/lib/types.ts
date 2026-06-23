export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'canceled'
export type IssuePriority = 'no_priority' | 'urgent' | 'high' | 'medium' | 'low'

export interface Issue {
  id: string
  team_id: string
  project_id: string | null
  cycle_id: string | null
  creator_id: string
  assignee_id: string | null
  identifier: string
  number: number
  title: string
  description: string | null
  status: IssueStatus
  priority: IssuePriority
  estimate: number | null
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  organization_id: string
  name: string
  identifier: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}
