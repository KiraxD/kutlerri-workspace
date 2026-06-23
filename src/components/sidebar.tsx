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
  MoreHorizontal,
  Home,
  Layers,
  Compass,
  Briefcase,
  Lock,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  shortcut?: string
}

export function Sidebar({ userName, userEmail }: { userName: string | null; userEmail: string | null }) {
  return (
    <aside className="w-[240px] flex-shrink-0 border-r border-border bg-sidebar flex flex-col z-20 shadow-sm">
      {/* Workspace Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
        <Image
          src="/images/icon.png"
          alt="Kutlerri"
          width={32}
          height={32}
          className="rounded-lg shrink-0 shadow-sm"
        />
        <div className="min-w-0">
          <span className="text-sm font-bold font-heading tracking-wide truncate block">Kutlerri</span>
          <span className="text-[10px] text-muted-foreground truncate block">{userEmail}</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        <div className="px-3 mb-3 space-y-0.5">
          <NavItem href="/search" icon={<Search className="w-4 h-4" />} label="Search" shortcut="⌘K" />
          <NavItem href="/home" icon={<Home className="w-4 h-4" />} label="Home" />
          <NavItem href="/inbox" icon={<Inbox className="w-4 h-4" />} label="Inbox" />
          <NavItem href="/my-tasks" icon={<CheckCircle2 className="w-4 h-4" />} label="My Tasks" />
        </div>

        <div className="px-3 mb-3">
          <div className="text-[10px] font-semibold text-muted-foreground/70 mb-1 px-2 uppercase tracking-wider">Your Space</div>
          <div className="space-y-0.5">
            <NavItem href="/favorites" icon={<Star className="w-4 h-4" />} label="Favorites" />
          </div>
        </div>

        <div className="px-3 mb-3">
          <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground/70 mb-1 px-2 uppercase tracking-wider group">
            <span>Workspace</span>
            <MoreHorizontal className="w-3 h-3 opacity-0 group-hover:opacity-100 cursor-pointer" />
          </div>
          <div className="space-y-0.5">
            <NavItem href="/initiatives" icon={<Compass className="w-4 h-4" />} label="Initiatives" />
            <NavItem href="/epics" icon={<Layers className="w-4 h-4" />} label="Epics" />
            <NavItem href="/projects" icon={<Briefcase className="w-4 h-4" />} label="Projects" />
            <NavItem href="/cycles" icon={<Target className="w-4 h-4" />} label="Cycles" />
            <NavItem href="/roadmap" icon={<Route className="w-4 h-4" />} label="Roadmap" />
            <NavItem href="/vault" icon={<Lock className="w-4 h-4" />} label="Vault" />
            <NavItem href="/teams" icon={<Users className="w-4 h-4" />} label="Teams" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border mt-auto">
        <NavItem href="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
      </div>
    </aside>
  )
}

function NavItem({ href, icon, label, shortcut }: NavItemProps) {
  const pathname = usePathname()
  const isActive = href === '/home'
    ? pathname === '/home' || pathname === '/'
    : pathname.startsWith(href) && href !== '/'

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors group',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <div className={cn(
        'transition-colors shrink-0',
        isActive ? 'text-primary' : 'text-muted-foreground/80 group-hover:text-foreground'
      )}>
        {icon}
      </div>
      <span className="flex-1 truncate">{label}</span>
      {shortcut && (
        <span className="text-[10px] uppercase font-mono bg-muted-foreground/10 px-1.5 py-0.5 rounded text-muted-foreground">
          {shortcut}
        </span>
      )}
    </Link>
  )
}
