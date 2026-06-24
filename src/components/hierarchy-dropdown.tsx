'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  Users,
  Compass,
  Layers,
  CheckCircle2,
  Briefcase,
  Target,
  Route,
  Lock,
  GitFork,
  ChevronDown,
  ChevronRight,
  GitBranch,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isNavItemVisible, type OrgRole } from '@/lib/permissions'

interface HierarchyDropdownProps {
  role?: OrgRole | null
}

interface TreeItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  children?: TreeItem[]
  navKey: string
}

export function HierarchyDropdown({ role }: HierarchyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on path change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const hierarchyData: TreeItem[] = [
    {
      id: 'teams',
      label: 'Teams',
      href: '/teams',
      icon: <Users className="w-4 h-4 text-sky-400" />,
      navKey: 'teams',
    },
    {
      id: 'initiatives',
      label: 'Initiatives',
      href: '/initiatives',
      icon: <Compass className="w-4 h-4 text-emerald-400" />,
      navKey: 'initiatives',
      children: [
        {
          id: 'epics',
          label: 'Epics',
          href: '/epics',
          icon: <Layers className="w-4 h-4 text-amber-400" />,
          navKey: 'epics',
          children: [
            {
              id: 'tasks',
              label: 'Tasks',
              href: '/my-tasks',
              icon: <CheckCircle2 className="w-4 h-4 text-indigo-400" />,
              navKey: 'my-tasks',
              children: [
                {
                  id: 'subtasks',
                  label: 'Sub Tasks',
                  href: '/my-tasks',
                  icon: <GitBranch className="w-4 h-4 text-violet-400 rotate-180" />,
                  navKey: 'my-tasks',
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'projects',
      label: 'Projects',
      href: '/projects',
      icon: <Briefcase className="w-4 h-4 text-pink-400" />,
      navKey: 'projects',
    },
    {
      id: 'cycles',
      label: 'Cycles',
      href: '/cycles',
      icon: <Target className="w-4 h-4 text-orange-400" />,
      navKey: 'cycles',
    },
    {
      id: 'roadmap',
      label: 'Roadmap',
      href: '/roadmap',
      icon: <Route className="w-4 h-4 text-teal-400" />,
      navKey: 'roadmap',
    },
    {
      id: 'vault',
      label: 'Vault',
      href: '/vault',
      icon: <Lock className="w-4 h-4 text-red-400" />,
      navKey: 'vault',
    },
    {
      id: 'employees',
      label: 'Employees',
      href: '/employees',
      icon: <Users className="w-4 h-4 text-fuchsia-400" />,
      navKey: 'employees',
    }
  ]

  const renderTree = (items: TreeItem[], depth = 0, isLastChildArray: boolean[] = []) => {
    return items.map((item, index) => {
      // Check if nav item is visible to user role
      if (!isNavItemVisible(role, item.navKey)) return null

      const isLast = index === items.length - 1
      const currentIsLastArray = [...isLastChildArray, isLast]
      const isItemActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/')

      return (
        <div key={item.id} className="relative flex flex-col select-none">
          {/* Item Row */}
          <div className="flex items-center min-h-[32px] group">
            {/* Guide lines based on depth */}
            {Array.from({ length: depth }).map((_, dIdx) => {
              const isAncestorLast = isLastChildArray[dIdx]
              return (
                <div
                  key={dIdx}
                  className={cn(
                    "w-6 h-full absolute top-0 flex justify-center shrink-0",
                    isAncestorLast ? "" : "border-l border-white/10"
                  )}
                  style={{ left: `${dIdx * 24 + 12}px` }}
                />
              )
            })}

            {/* Tree Branch Connector */}
            {depth > 0 && (
              <div
                className={cn(
                  "absolute border-white/10 shrink-0",
                  isLast
                    ? "border-l border-b rounded-bl-md w-3 h-4 -mt-4"
                    : "border-l border-b w-3 h-5 -mt-5"
                )}
                style={{
                  left: `${(depth - 1) * 24 + 12}px`,
                  top: "16px",
                  height: isLast ? "16px" : "20px"
                }}
              />
            )}

            {/* Clickable Node */}
            <Link
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all duration-150 flex-1 hover:bg-white/[0.04]",
                isItemActive
                  ? "bg-[#9F7CEF]/10 text-[#9F7CEF] font-semibold"
                  : "text-white/60 hover:text-white"
              )}
              style={{ marginLeft: `${depth * 24}px` }}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          </div>

          {/* Children Recursion */}
          {item.children && renderTree(item.children, depth + 1, currentIsLastArray)}
        </div>
      )
    })
  }

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-[11px] font-semibold tracking-wide transition-all duration-200 uppercase",
          isOpen
            ? "bg-[#9F7CEF]/15 border-[#9F7CEF] text-[#9F7CEF]"
            : "bg-white/[0.03] border-white/10 text-white/50 hover:bg-white/[0.06] hover:text-white"
        )}
        aria-label="View Project Hierarchy"
        title="View Project Hierarchy"
      >
        <GitFork className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Hierarchy</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Menu Container */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-lg bg-[#0d0d0d] border border-white/10 shadow-2xl p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden">
          {/* Glassmorphic background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#9F7CEF]/5 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-2">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Building2 className="w-4 h-4 text-[#9F7CEF]" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Kutlerri Workspace</span>
                <span className="text-[9px] text-white/40">Organizational Hierarchy</span>
              </div>
            </div>

            {/* Tree Root */}
            <div className="space-y-1 py-1 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {renderTree(hierarchyData)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
