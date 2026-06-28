'use client'

import Link from 'next/link'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
  icon?: string
}

interface HierarchyBreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Breadcrumb component showing organizational hierarchy
 * Organization → Teams → Initiatives → Epics → Tasks → SubTasks
 */
export function HierarchyBreadcrumb({ items, className = '' }: HierarchyBreadcrumbProps) {
  const router = useRouter()

  return (
    <nav
      className={`flex items-center gap-2 px-6 py-3 border-b border-border text-sm text-muted-foreground bg-muted/30 ${className}`}
      aria-label="Breadcrumb"
    >
      <button
        onClick={() => router.back()}
        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all duration-150 shrink-0 mr-1 flex items-center justify-center border border-border/40 shadow-sm bg-background/50 hover:scale-105"
        title="Go Back"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
      </button>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground/50" />}

          {item.current ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

/**
 * Visual hierarchy indicator showing current level in org structure
 */
export function HierarchyLevel({ level }: { level: 'org' | 'team' | 'initiative' | 'epic' | 'story' | 'task' | 'subtask' }) {
  const hierarchy = {
    org: { position: 1, label: 'Organization', icon: '🏢' },
    team: { position: 2, label: 'Team', icon: '👥' },
    initiative: { position: 3, label: 'Initiative', icon: '🎯' },
    epic: { position: 4, label: 'Epic', icon: '📚' },
    story: { position: 5, label: 'Story', icon: '📖' },
    task: { position: 6, label: 'Task', icon: '✓' },
    subtask: { position: 7, label: 'Sub-task', icon: '◦' },
  }

  const current = hierarchy[level]

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{current.icon}</span>
      <span className="text-xs font-semibold text-muted-foreground uppercase">
        {current.label} ({current.position}/7)
      </span>
    </div>
  )
}

/**
 * Full hierarchy visualization
 */
export function HierarchyVisualization() {
  return (
    <div className="p-4 bg-muted/20 rounded-lg border border-border/50 text-xs space-y-2">
      <div className="font-semibold text-foreground mb-3">Organizational Hierarchy</div>
      <div className="space-y-1.5 font-mono text-muted-foreground">
        <div>🏢 Organization (Level 1)</div>
        <div className="ml-4">├─ 👥 Teams (Level 2)</div>
        <div className="ml-8">├─ 🎯 Initiatives (Level 3)</div>
        <div className="ml-12">├─ 📚 Epics (Level 4)</div>
        <div className="ml-16">├─ 📖 Stories (Level 5)</div>
        <div className="ml-20">├─ ✓ Tasks (Level 6)</div>
        <div className="ml-24">└─ ◦ Sub-Tasks (Level 7)</div>
      </div>
    </div>
  )
}
