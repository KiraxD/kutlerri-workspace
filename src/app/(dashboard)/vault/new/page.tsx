import { createClient } from '@/lib/supabase/server'
import { createVaultAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { redirect } from 'next/navigation'

async function handleCreateVault(formData: FormData) {
  'use server'
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name) {
    throw new Error('Vault name is required')
  }

  const result = await createVaultAction({
    name,
    description,
  })

  if (result.success) {
    redirect('/vault')
  } else {
    throw new Error(result.error)
  }
}

export default async function NewVaultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col h-full items-center justify-center bg-muted/20">
      <div className="w-full max-w-2xl bg-background border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h1 className="text-lg font-semibold">Create New Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Secure document storage with version control and access management</p>
        </div>
        <form action={handleCreateVault} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Vault Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Financial Records, Legal Docs, Product Specs"
              required
              autoFocus
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What this vault is used for, access rules, retention policy, etc..."
              className="min-h-[150px] resize-y"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border mt-6 pt-6">
            <a href="/vault" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              Cancel
            </a>
            <Button type="submit">Create Vault</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
