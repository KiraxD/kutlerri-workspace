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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()

  const { data: orgMembers } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)

  let userRole = null
  if (orgMembers && orgMembers.length > 0) {
    userRole = orgMembers[0].role
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <RealtimeProvider userId={user.id} />

      <Sidebar
        userName={profile?.full_name ?? null}
        userEmail={profile?.email ?? user.email ?? null}
        role={userRole}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
        <div className="relative z-10 flex-1 flex flex-col min-h-full">{children}</div>
      </main>

      <CommandPalette />
    </div>
  )
}