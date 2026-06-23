'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Inbox, Search, Settings, Star, Users, Target,
  Route, CheckCircle2, Home, Layers, Compass,
  Briefcase, Lock, MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isNavItemVisible, type OrgRole } from '@/lib/permissions'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  shortcut?: string
  visible?: boolean
}

interface SidebarProps {
  userName: string | null
  userEmail: string | null
  role?: OrgRole | null
}

export function Sidebar({ userName, userEmail, role }: SidebarProps) {
  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col z-20 bg-[#0d0d0d] border-r border-[#222]" style={{ height: '100vh' }}>

      {/* Logo Header */}
      <div className="flex flex-col px-4 pt-4 pb-3 border-b border-[#222] shrink-0">
        <Image
          src="/images/kutlerri-logo.png"
          alt="Kutlerri"
          width={120}
          height={30}
          className="h-8 w-auto object-contain object-left"
          priority
        />
        <span className="text-[10px] text-white/30 truncate mt-1.5">{userEmail}</span>
      </div>

      {/* Navigation — scrollable */}
      <nav className="flex-1 overflow-y-auto py-3 min-h-0" style={{ scrollbarWidth: 'none' }}>

        {/* Main */}
        <div className="px-2 mb-1 space-y-0.5">
          {isNavItemVisible(role, 'search') && (
            <NavItem href="/search" icon={<Search className="w-4 h-4" />} label="Search" shortcut="⌘K" />
          )}
          {isNavItemVisible(role, 'home') && (
            <NavItem href="/home" icon={<Home className="w-4 h-4" />} label="Home" />
          )}
          {isNavItemVisible(role, 'inbox') && (
            <NavItem href="/inbox" icon={<Inbox className="w-4 h-4" />} label="Inbox" />
          )}
          {isNavItemVisible(role, 'my-tasks') && (
            <NavItem href="/my-tasks" icon={<CheckCircle2 className="w-4 h-4" />} label="My Tasks" />
          )}
        </div>

        {/* Divider */}
        {isNavItemVisible(role, 'favorites') && (
          <div className="mx-4 my-2 border-t border-[#222]" />
        )}

        {/* Your Space */}
        {isNavItemVisible(role, 'favorites') && (
          <div className="px-2 mb-1">
            <p className="text-[10px] font-semibold text-white/25 px-2 pb-1 uppercase tracking-widest">Your Space</p>
            <div className="space-y-0.5">
              <NavItem href="/favorites" icon={<Star className="w-4 h-4" />} label="Favorites" />
            </div>
          </div>
        )}

        {/* Divider */}
        {(isNavItemVisible(role, 'initiatives') ||
          isNavItemVisible(role, 'epics') ||
          isNavItemVisible(role, 'projects') ||
          isNavItemVisible(role, 'cycles') ||
          isNavItemVisible(role, 'roadmap') ||
          isNavItemVisible(role, 'vault') ||
          isNavItemVisible(role, 'teams')) && (
          <div className="mx-4 my-2 border-t border-[#222]" />
        )}

        {/* Workspace */}
        {(isNavItemVisible(role, 'initiatives') ||
          isNavItemVisible(role, 'epics') ||
          isNavItemVisible(role, 'projects') ||
          isNavItemVisible(role, 'cycles') ||
          isNavItemVisible(role, 'roadmap') ||
          isNavItemVisible(role, 'vault') ||
          isNavItemVisible(role, 'teams')) && (
          <div className="px-2 mb-2">
            <p className="text-[10px] font-semibold text-white/25 px-2 pb-1 uppercase tracking-widest">Workspace</p>
            <div className="space-y-0.5">
              {isNavItemVisible(role, 'initiatives') && (
                <NavItem href="/initiatives" icon={<Compass className="w-4 h-4" />} label="Initiatives" />
              )}
              {isNavItemVisible(role, 'epics') && (
                <NavItem href="/epics" icon={<Layers className="w-4 h-4" />} label="Epics" />
              )}
              {isNavItemVisible(role, 'projects') && (
                <NavItem href="/projects" icon={<Briefcase className="w-4 h-4" />} label="Projects" />
              )}
              {isNavItemVisible(role, 'cycles') && (
                <NavItem href="/cycles" icon={<Target className="w-4 h-4" />} label="Cycles" />
              )}
              {isNavItemVisible(role, 'roadmap') && (
                <NavItem href="/roadmap" icon={<Route className="w-4 h-4" />} label="Roadmap" />
              )}
              {isNavItemVisible(role, 'vault') && (
                <NavItem href="/vault" icon={<Lock className="w-4 h-4" />} label="Vault" />
              )}
              {isNavItemVisible(role, 'teams') && (
                <NavItem href="/teams" icon={<Users className="w-4 h-4" />} label="Teams" />
              )}
            </div>
          </div>
        )}

      </nav>

      {/* Footer — always visible at bottom */}
      <div className="px-2 py-3 border-t border-[#222] shrink-0">
        <NavItem href="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
      </div>
    </aside>
  )
}

function NavItem({ href, icon, label, shortcut, visible = true }: NavItemProps) {
  const pathname = usePathname()
  const isActive = href === '/home'
    ? pathname === '/home' || pathname === '/'
    : pathname === href || (pathname.startsWith(href + '/') && href !== '/')

  if (!visible) return null

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-1.5 text-sm rounded-md transition-all duration-150 group w-full',
        isActive
          ? 'bg-[#9F7CEF]/15 text-[#9F7CEF] font-medium'
          : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
      )}
    >
      <span className={cn(
        'shrink-0 transition-colors',
        isActive ? 'text-[#9F7CEF]' : 'text-white/35 group-hover:text-white/80'
      )}>
        {icon}
      </span>
      <span className="flex-1 truncate leading-none">{label}</span>
      {shortcut && (
        <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/30 shrink-0">
          {shortcut}
        </span>
      )}
    </Link>
  )
}
