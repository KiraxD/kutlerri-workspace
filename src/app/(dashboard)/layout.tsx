import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommandPalette } from '@/components/cmdk/command-palette'
import { RealtimeProvider } from '@/components/realtime-provider'
import { Sidebar } from '@/components/sidebar'

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

  // Fetch profile for display
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <RealtimeProvider userId={user.id} />

      <Sidebar
        userName={profile?.full_name ?? null}
        userEmail={profile?.email ?? user.email ?? null}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </main>

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  )
}
