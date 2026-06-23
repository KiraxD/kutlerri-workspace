import { createClient } from '@/lib/supabase/server'
import { Settings as SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from './actions'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="flex flex-col bg-background">
      <div className="flex items-center px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          Settings
        </h1>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto max-w-2xl">
        <div className="space-y-8">
          
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Account</h2>
            <div className="grid gap-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium">Email</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Preferences</h2>
            <div className="grid gap-4">
              <div className="flex justify-between items-center py-2">
                <div>
                  <span className="text-sm font-medium block">Theme</span>
                  <span className="text-xs text-muted-foreground">Manage your app appearance</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Light (Default)
                </div>
              </div>
            </div>
          </section>

          <section className="pt-8">
            <form action={signOut}>
              <Button type="submit" variant="destructive">Sign Out</Button>
            </form>
          </section>

        </div>
      </div>
    </div>
  )
}
