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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isNavItemVisible, type OrgRole } from '@/lib/permissions'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  shortcut?: string
  depth?: number
  isLast?: boolean
  parentDepths?: boolean[] // true = ancestor was last child at that depth
}

interface SidebarProps {
  userName: string | null
  userEmail: string | null
  role?: OrgRole | null
}

export function Sidebar({ userName, userEmail, role }: SidebarProps) {
  return (
    <aside
      className="w-[240px] flex-shrink-0 flex flex-col z-20 bg-[#0d0d0d] border-r border-[#222]"
      style={{ height: '100vh' }}
    >
      {/* Header */}
      <div className="flex flex-col px-4 pt-4 pb-3 border-b border-[#222] shrink-0">
        <Image
          src="/images/kutlerri-logo.png"
          alt="Kutlerri"
          width={120}
          height={28}
          className="h-7 w-auto object-contain object-left"
          priority
        />
        <span className="text-xs text-white/80 truncate mt-2">{userName || 'Workspace User'}</span>
        <span className="text-[10px] text-white/30 truncate mt-1">{userEmail}</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 min-h-0" style={{ scrollbarWidth: 'none' }}>

        {/* Personal */}
        <div className="px-2 mb-1 space-y-0.5">
          {isNavItemVisible(role, 'search') && (
            <NavItem href="/search" icon={<Search className="w-4 h-4" />} label="Search" shortcut="⌘K" />
          )}
          {isNavItemVisible(role, 'home') && <NavItem href="/home" icon={<Home className="w-4 h-4" />} label="Home" />}
          {isNavItemVisible(role, 'inbox') && <NavItem href="/inbox" icon={<Inbox className="w-4 h-4" />} label="Inbox" />}
          {isNavItemVisible(role, 'my-tasks') && (
            <NavItem href="/my-tasks" icon={<CheckCircle2 className="w-4 h-4" />} label="My Tasks" />
          )}
        </div>

        {isNavItemVisible(role, 'favorites') && <div className="mx-4 my-2 border-t border-[#222]" />}

        {isNavItemVisible(role, 'favorites') && (
          <div className="px-2 mb-1">
            <p className="text-[10px] font-semibold text-white/25 px-2 pb-1 uppercase tracking-widest">Your Space</p>
            <div className="space-y-0.5">
              <NavItem href="/favorites" icon={<Star className="w-4 h-4" />} label="Favorites" />
            </div>
          </div>
        )}

        <div className="mx-4 my-2 border-t border-[#222]" />

        {/* Workspace — hierarchy tree inline */}
        <div className="px-2 mb-2">
          <p className="text-[10px] font-semibold text-white/25 px-2 pb-2 uppercase tracking-widest">Workspace</p>

          <div className="space-y-0.5">

            {/* Teams — flat */}
            {isNavItemVisible(role, 'teams') && (
              <NavItem href="/teams" icon={<Users className="w-4 h-4 text-sky-400" />} label="Teams" />
            )}

            {/* Initiatives */}
            {isNavItemVisible(role, 'initiatives') && (
              <NavItem href="/initiatives" icon={<Compass className="w-4 h-4 text-emerald-400" />} label="Initiatives" />
            )}

            {/* └ Epics */}
            {isNavItemVisible(role, 'epics') && (
              <NavItem
                href="/epics"
                icon={<Layers className="w-4 h-4 text-amber-400" />}
                label="Epics"
                depth={1}
                isLast={false}
                parentDepths={[false]}
              />
            )}

            {/* └─ Stories */}
            {isNavItemVisible(role, 'stories') && (
              <NavItem
                href="/stories"
                icon={<BookOpen className="w-4 h-4 text-green-400" />}
                label="Stories"
                depth={2}
                isLast={false}
                parentDepths={[false, false]}
              />
            )}

            {/* └── Tasks (My Tasks) */}
            {isNavItemVisible(role, 'my-tasks') && (
              <NavItem
                href="/my-tasks"
                icon={<CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                label="Tasks"
                depth={3}
                isLast={false}
                parentDepths={[false, false, false]}
              />
            )}

            {/* └─── Sub Tasks (also points to my-tasks for now) */}
            <NavItem
              href="/my-tasks"
              icon={<GitBranch className="w-3.5 h-3.5 text-violet-400 rotate-180" />}
              label="Sub Tasks"
              depth={4}
              isLast={true}
              parentDepths={[false, false, false, true]}
            />

            {/* Separator before flat items */}
            <div className="h-2" />

            {/* Projects — flat */}
            {isNavItemVisible(role, 'projects') && (
              <NavItem href="/projects" icon={<Briefcase className="w-4 h-4 text-pink-400" />} label="Projects" />
            )}

            {/* Cycles — flat */}
            {isNavItemVisible(role, 'cycles') && (
              <NavItem href="/cycles" icon={<Target className="w-4 h-4 text-orange-400" />} label="Cycles" />
            )}

            {/* Roadmap — flat */}
            {isNavItemVisible(role, 'roadmap') && (
              <NavItem href="/roadmap" icon={<Route className="w-4 h-4 text-teal-400" />} label="Roadmap" />
            )}

            {/* Vault — flat */}
            {isNavItemVisible(role, 'vault') && (
              <NavItem href="/vault" icon={<Lock className="w-4 h-4 text-red-400" />} label="Vault" />
            )}

            {/* Employees — flat */}
            {isNavItemVisible(role, 'employees') && (
              <NavItem href="/employees" icon={<Users className="w-4 h-4 text-fuchsia-400" />} label="Employees" />
            )}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-[#222] shrink-0">
        <NavItem href="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
      </div>
    </aside>
  )
}

function NavItem({
  href,
  icon,
  label,
  shortcut,
  depth = 0,
  isLast = false,
  parentDepths = [],
}: NavItemProps) {
  const pathname = usePathname()
  const isActive =
    href === '/home'
      ? pathname === '/home' || pathname === '/'
      : pathname === href || (pathname.startsWith(href + '/') && href !== '/')

  const indentPx = depth * 20

  return (
    <div className="relative flex items-center min-h-[30px]">

      {/* Vertical guide lines from ancestor depths */}
      {parentDepths.map((ancestorIsLast, dIdx) => (
        <div
          key={dIdx}
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: `${dIdx * 20 + 10}px`,
            width: '1px',
            // only draw line if ancestor was NOT the last child
            background: ancestorIsLast ? 'transparent' : 'rgba(255,255,255,0.08)',
          }}
        />
      ))}

      {/* Horizontal connector for children */}
      {depth > 0 && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${(depth - 1) * 20 + 10}px`,
            top: '50%',
            width: '12px',
            height: '1px',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
      )}

      <Link
        href={href}
        style={{ paddingLeft: `${indentPx + (depth > 0 ? 24 : 0)}px` }}
        className={cn(
          'flex items-center gap-2 pr-2.5 py-1.5 text-sm rounded-md transition-all duration-150 group w-full',
          isActive
            ? 'bg-[#9F7CEF]/15 text-[#9F7CEF] font-medium'
            : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
        )}
      >
        <span
          className={cn(
            'shrink-0 transition-colors',
            isActive ? 'text-[#9F7CEF]' : 'group-hover:text-white/80'
          )}
        >
          {icon}
        </span>
        <span className="flex-1 truncate leading-none">{label}</span>
        {shortcut && (
          <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/30 shrink-0">
            {shortcut}
          </span>
        )}
      </Link>
    </div>
  )
}