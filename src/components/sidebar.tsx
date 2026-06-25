'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Inbox,
  Search,
  Settings,
  Star,
  Users,
  Target,
  Route,
  CheckCircle2,
  Home,
  Layers,
  Compass,
  Briefcase,
  Lock,
  BookOpen,
  GitBranch,
  ChevronRight,
  Bell,
  LayoutGrid,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isNavItemVisible, type OrgRole } from '@/lib/permissions'

interface SidebarProps {
  userName: string | null
  userEmail: string | null
  role?: OrgRole | null
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  shortcut?: string
  badge?: number
  depth?: number
}

function getInitials(name: string | null, email: string | null) {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return 'U'
}

export function Sidebar({ userName, userEmail, role }: SidebarProps) {
  const initials = getInitials(userName, userEmail)

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col z-20 relative" style={{ height: '100vh' }}>
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-[#0a0a0f] border-r border-white/[0.06]" />
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative flex flex-col h-full">

        {/* Header — Logo + Workspace name */}
        <div className="px-4 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/40 shrink-0">
              <LayoutGrid className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white/90 leading-tight truncate">Kutlerri</p>
              <p className="text-[10px] text-white/30 leading-tight">Workspace</p>
            </div>
          </div>

          {/* Search pill */}
          {isNavItemVisible(role, 'search') && (
            <Link
              href="/search"
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/10 transition-all group"
            >
              <Search className="w-3.5 h-3.5 text-white/30 group-hover:text-white/50 transition-colors" />
              <span className="text-[12px] text-white/30 group-hover:text-white/50 transition-colors flex-1">Search...</span>
              <span className="text-[10px] font-mono bg-white/[0.06] px-1.5 py-0.5 rounded text-white/20 shrink-0">⌘K</span>
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-2 min-h-0 space-y-4" style={{ scrollbarWidth: 'none' }}>

          {/* Personal section */}
          <div className="space-y-0.5">
            {isNavItemVisible(role, 'home') && (
              <NavItem href="/home" icon={<Home className="w-4 h-4" />} label="Home" />
            )}
            {isNavItemVisible(role, 'inbox') && (
              <NavItem href="/inbox" icon={<Inbox className="w-4 h-4" />} label="Inbox" />
            )}
            {isNavItemVisible(role, 'my-tasks') && (
              <NavItem href="/my-tasks" icon={<CheckCircle2 className="w-4 h-4" />} label="My Tasks" />
            )}
            {isNavItemVisible(role, 'favorites') && (
              <NavItem href="/favorites" icon={<Star className="w-4 h-4" />} label="Favorites" />
            )}
          </div>

          <Divider />

          {/* Hierarchy section */}
          <div>
            <SectionLabel>Hierarchy</SectionLabel>
            <div className="space-y-0.5 mt-1">
              {isNavItemVisible(role, 'initiatives') && (
                <NavItem
                  href="/initiatives"
                  icon={<Compass className="w-4 h-4 text-emerald-400" />}
                  label="Initiatives"
                />
              )}
              {isNavItemVisible(role, 'epics') && (
                <NavItem
                  href="/epics"
                  icon={<Layers className="w-4 h-4 text-amber-400" />}
                  label="Epics"
                  depth={1}
                />
              )}
              {isNavItemVisible(role, 'stories') && (
                <NavItem
                  href="/stories"
                  icon={<BookOpen className="w-4 h-4 text-green-400" />}
                  label="Stories"
                  depth={2}
                />
              )}
              {isNavItemVisible(role, 'my-tasks') && (
                <NavItem
                  href="/tasks"
                  icon={<CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                  label="Tasks"
                  depth={3}
                />
              )}
              <NavItem
                href="/sub-tasks"
                icon={<GitBranch className="w-3.5 h-3.5 text-violet-400" style={{ transform: 'rotate(180deg)' }} />}
                label="Sub Tasks"
                depth={4}
              />
            </div>
          </div>

          <Divider />

          {/* Work section */}
          <div>
            <SectionLabel>Work</SectionLabel>
            <div className="space-y-0.5 mt-1">
              {isNavItemVisible(role, 'projects') && (
                <NavItem href="/projects" icon={<Briefcase className="w-4 h-4 text-pink-400" />} label="Projects" />
              )}
              {isNavItemVisible(role, 'cycles') && (
                <NavItem href="/cycles" icon={<Target className="w-4 h-4 text-orange-400" />} label="Cycles" />
              )}
              {isNavItemVisible(role, 'roadmap') && (
                <NavItem href="/roadmap" icon={<Route className="w-4 h-4 text-teal-400" />} label="Roadmap" />
              )}
              {isNavItemVisible(role, 'vault') && (
                <NavItem href="/vault" icon={<Lock className="w-4 h-4 text-red-400" />} label="Vault" />
              )}
              {isNavItemVisible(role, 'teams') && (
                <NavItem href="/teams" icon={<Users className="w-4 h-4 text-sky-400" />} label="Teams" />
              )}
              {isNavItemVisible(role, 'employees') && (
                <NavItem href="/employees" icon={<Users className="w-4 h-4 text-fuchsia-400" />} label="Employees" />
              )}
            </div>
          </div>
        </nav>

        {/* Footer — User + Settings */}
        <div className="shrink-0 px-3 py-3 border-t border-white/[0.05]">
          <NavItem href="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />

          <div className="mt-2 flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-md">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-white/80 truncate leading-tight">{userName || 'Workspace User'}</p>
              <p className="text-[10px] text-white/30 truncate leading-tight">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-white/20 px-2 uppercase tracking-widest">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="mx-2 border-t border-white/[0.05]" />
}

function NavItem({ href, icon, label, shortcut, badge, depth = 0 }: NavItemProps) {
  const pathname = usePathname()
  const isActive =
    href === '/home'
      ? pathname === '/home' || pathname === '/'
      : pathname === href || (pathname.startsWith(href + '/') && href !== '/')

  const indentPx = depth * 16

  return (
    <Link
      href={href}
      style={{ paddingLeft: `${8 + indentPx + (depth > 0 ? 12 : 0)}px` }}
      className={cn(
        'flex items-center gap-2.5 pr-2 py-[7px] text-[13px] rounded-lg transition-all duration-150 group relative',
        isActive
          ? 'bg-violet-500/10 text-violet-300 font-medium'
          : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80'
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-violet-500 rounded-r-full" />
      )}

      {/* Depth connector lines */}
      {depth > 0 && (
        <span
          className="absolute pointer-events-none opacity-20"
          style={{
            left: `${8 + (depth - 1) * 16 + 6}px`,
            top: '50%',
            width: '10px',
            height: '1px',
            background: 'currentColor',
          }}
        />
      )}

      <span className={cn('shrink-0 transition-colors', isActive ? 'text-violet-400' : 'text-white/30 group-hover:text-white/60')}>
        {icon}
      </span>
      <span className="flex-1 truncate leading-none">{label}</span>

      {shortcut && (
        <span className="text-[10px] font-mono bg-white/[0.06] px-1.5 py-0.5 rounded text-white/20 shrink-0">
          {shortcut}
        </span>
      )}
      {badge != null && badge > 0 && (
        <span className="text-[10px] font-semibold bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center">
          {badge}
        </span>
      )}
    </Link>
  )
}