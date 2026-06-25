'use client'

import { useState, useEffect, useRef } from 'react'
import { User, ChevronDown, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AssignableUser {
  id: string
  full_name: string | null
  email: string
}

interface AssigneePicker2Props {
  placeholder?: string
  value: string | null
  onChange: (userId: string | null, user: AssignableUser | null) => void
  orgId?: string      // fetch org members if provided
  teamId?: string     // fetch team members if provided
  className?: string
  size?: 'sm' | 'xs'
}

export function AssigneePicker({
  placeholder = 'Assign to…',
  value,
  onChange,
  orgId,
  teamId,
  className,
  size = 'sm',
}: AssigneePicker2Props) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<AssignableUser[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = users.find((u) => u.id === value) ?? null

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Fetch members when opened
  useEffect(() => {
    if (!open || users.length > 0) return
    setLoading(true)
    fetch(`/api/org-members${teamId ? `?teamId=${teamId}` : orgId ? `?orgId=${orgId}` : ''}`)
      .then((r) => r.json())
      .then((data) => setUsers(data?.members ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [open, orgId, teamId])

  const initials = (user: AssignableUser) =>
    (user.full_name || user.email)
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 border border-border rounded-md bg-white transition-all',
          size === 'xs' ? 'text-[11px] px-2 py-1' : 'text-xs px-2.5 py-1.5',
          open ? 'border-violet-400 ring-1 ring-violet-200' : 'hover:border-muted-foreground/40'
        )}
      >
        {selected ? (
          <>
            <span className="w-4 h-4 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[9px] font-bold shrink-0">
              {initials(selected)}
            </span>
            <span className="truncate max-w-[80px]">{selected.full_name || selected.email}</span>
            <X
              className="w-3 h-3 text-muted-foreground/60 hover:text-red-500 shrink-0"
              onClick={(e) => { e.stopPropagation(); onChange(null, null) }}
            />
          </>
        ) : (
          <>
            <User className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            <span className="text-muted-foreground">{placeholder}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No members found</p>
          ) : (
            <div className="max-h-48 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => { onChange(null, null); setOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:bg-muted/60 transition-colors"
              >
                <User className="w-3.5 h-3.5" /> Unassigned
              </button>
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { onChange(u.id, u); setOpen(false) }}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-left',
                    value === u.id && 'bg-violet-50 text-violet-700 font-medium'
                  )}
                >
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                    {initials(u)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate">{u.full_name || u.email}</p>
                    {u.full_name && <p className="truncate text-muted-foreground text-[10px]">{u.email}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
