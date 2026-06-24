export type TaskStatus =
  | 'Backlog'
  | 'Ready'
  | 'Todo'
  | 'In Progress'
  | 'Review'
  | 'Testing'
  | 'Blocked'
  | 'Done'
  | 'Cancelled'

export type TaskPriority = 'no_priority' | 'urgent' | 'high' | 'medium' | 'low'

export type WorkPriority = 'None' | 'Low' | 'Medium' | 'High' | 'Urgent'

// ─── Hierarchy types ────────────────────────────────────────────────

export interface Initiative {
  id: string
  organization_id: string
  name: string
  description: string | null
  status: TaskStatus | null
  priority: WorkPriority | null
  owner_id: string | null
  start_date: string | null
  target_date: string | null
  progress: number | null
  created_at: string
  updated_at: string
}

export interface Epic {
  id: string
  organization_id: string
  initiative_id: string | null
  name: string
  description: string | null
  status: TaskStatus | null
  priority: WorkPriority | null
  owner_id: string | null
  start_date: string | null
  target_date: string | null
  progress: number | null
  created_at: string
  updated_at: string
}

export interface Story {
  id: string
  organization_id: string
  epic_id: string | null
  name: string
  description: string | null
  status: TaskStatus | null
  priority: WorkPriority | null
  owner_id: string | null
  assignee_id: string | null
  start_date: string | null
  due_date: string | null
  estimate: number | null
  progress: number | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  team_id: string
  project_id: string | null
  cycle_id: string | null
  story_id: string | null
  epic_id: string | null
  creator_id: string
  assignee_id: string | null
  identifier: string
  number: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  estimate: number | null
  start_date: string | null
  due_date: string | null
  progress: number | null
  created_at: string
  updated_at: string
}

export interface SubTask {
  id: string
  task_id: string
  name: string
  status: TaskStatus | null
  priority: WorkPriority | null
  assignee_id: string | null
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ─── Supporting types ────────────────────────────────────────────────

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

// ─── UI constants ────────────────────────────────────────────────────

export const STATUS_ORDER: TaskStatus[] = [
  'In Progress',
  'Review',
  'Todo',
  'Ready',
  'Backlog',
  'Blocked',
  'Testing',
  'Done',
  'Cancelled',
]

export const STATUS_DOT: Record<string, string> = {
  Backlog: 'bg-gray-300',
  Ready: 'bg-sky-400',
  Todo: 'bg-gray-400',
  'In Progress': 'bg-yellow-400',
  Review: 'bg-blue-400',
  Testing: 'bg-purple-400',
  Blocked: 'bg-red-500',
  Done: 'bg-green-500',
  Cancelled: 'bg-gray-200',
}

export const STATUS_STYLES: Record<string, string> = {
  Backlog: 'bg-gray-100 text-gray-500',
  Ready: 'bg-sky-100 text-sky-700',
  Todo: 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Review: 'bg-blue-100 text-blue-700',
  Testing: 'bg-purple-100 text-purple-700',
  Blocked: 'bg-red-100 text-red-600',
  Done: 'bg-green-100 text-green-700',
  Cancelled: 'bg-gray-100 text-gray-400',
}

export const PRIORITY_STYLES: Record<WorkPriority, string> = {
  None: 'text-gray-400',
  Low: 'text-blue-500',
  Medium: 'text-yellow-500',
  High: 'text-orange-500',
  Urgent: 'text-red-600',
}

export const PRIORITY_DOT: Record<WorkPriority, string> = {
  None: 'bg-gray-300',
  Low: 'bg-blue-400',
  Medium: 'bg-yellow-400',
  High: 'bg-orange-400',
  Urgent: 'bg-red-500',
}
