import Link from 'next/link'
import Image from 'next/image'
import {
  Inbox,
  LayoutGrid,
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
  Database,
  Lock
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CommandPalette } from '@/components/cmdk/command-palette'
import { RealtimeProvider } from '@/components/realtime-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Linear style sidebar
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <RealtimeProvider userId={user.id} />
      {/* Sidebar */}
      <aside className="w-[240px] flex-shrink-0 border-r border-border bg-sidebar flex flex-col z-20 shadow-xl">
        {/* Workspace Switcher / Profile */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-muted/50 cursor-pointer">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground font-bold text-lg shadow-sm">
            K
          </div>
          <span className="text-lg font-bold font-heading tracking-wide truncate">Kutlerri</span>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 mb-4 space-y-0.5">
            <NavItem href="/search" icon={<Search className="w-4 h-4" />} label="Search" shortcut="Ctrl K" />
            <NavItem href="/" icon={<Home className="w-4 h-4" />} label="Home" />
            <NavItem href="/inbox" icon={<Inbox className="w-4 h-4" />} label="Inbox" />
            <NavItem href="/my-tasks" icon={<CheckCircle2 className="w-4 h-4" />} label="My Tasks" />
          </div>

          <div className="px-3 mb-4">
            <div className="text-xs font-semibold text-muted-foreground mb-1 px-2">Your Space</div>
            <div className="space-y-0.5">
              <NavItem href="/favorites" icon={<Star className="w-4 h-4" />} label="Favorites" />
            </div>
          </div>

          <div className="px-3 mb-4">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1 px-2 group">
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

        {/* User / Settings Footer */}
        <div className="p-3 border-t border-border mt-auto">
          <NavItem href="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </main>
      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  )
}

function NavItem({ href, icon, label, shortcut }: { href: string; icon: React.ReactNode; label: string; shortcut?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors group"
    >
      <div className="text-muted-foreground/80 group-hover:text-foreground">{icon}</div>
      <span className="flex-1 truncate">{label}</span>
      {shortcut && <span className="text-[10px] uppercase font-mono bg-muted-foreground/10 px-1.5 py-0.5 rounded text-muted-foreground">{shortcut}</span>}
    </Link>
  )
}
