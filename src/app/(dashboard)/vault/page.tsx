import { createClient } from '@/lib/supabase/server'
import {
  Lock, FolderOpen, FileText, Plus, ChevronRight,
  Shield, Eye, Edit, Trash2, Tag, Clock
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function VaultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch orgs the user is in
  const { data: orgMembers } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
  const orgIds = orgMembers?.map((o: any) => o.organization_id) ?? []

  let vaults: any[] = []
  if (orgIds.length > 0) {
    const { data } = await supabase
      .from('vaults')
      .select('*, org:organizations(name), team:teams(name)')
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })
    vaults = data ?? []
  }

  // For each vault, get folder count and document count
  const vaultIds = vaults.map((v: any) => v.id)
  let folderCounts: Record<string, number> = {}
  let docCounts: Record<string, number> = {}

  if (vaultIds.length > 0) {
    const { data: folders } = await supabase
      .from('vault_folders')
      .select('vault_id')
      .in('vault_id', vaultIds)
    folders?.forEach((f: any) => {
      folderCounts[f.vault_id] = (folderCounts[f.vault_id] || 0) + 1
    })
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-background">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading">Vault</h1>
            <p className="text-xs text-muted-foreground">Secure document storage with version control</p>
          </div>
        </div>
        {vaults.length > 0 && (
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> New Vault
          </Button>
        )}
      </div>

      <div className="flex-1 p-8">
        {vaults.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-10 h-10 text-primary opacity-60" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-3 h-3 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">No vaults yet</h2>
            <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
              Vaults are secure spaces to store, organize, and share documents with your team. Create a team first to get started.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              {[
                { icon: <FolderOpen className="w-5 h-5 text-blue-500" />, label: 'Organized Folders' },
                { icon: <Shield className="w-5 h-5 text-green-500" />, label: 'Access Control' },
                { icon: <Clock className="w-5 h-5 text-purple-500" />, label: 'Version History' },
              ].map((f) => (
                <div key={f.label} className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex justify-center mb-2">{f.icon}</div>
                  <p className="text-xs text-muted-foreground font-medium">{f.label}</p>
                </div>
              ))}
            </div>
            <Link href="/teams">
              <Button>Create a Team First</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vault Grid */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Your Vaults</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {vaults.map((vault: any) => (
                  <VaultCard
                    key={vault.id}
                    vault={vault}
                    folderCount={folderCounts[vault.id] ?? 0}
                  />
                ))}
                {/* Create New Vault Card */}
                <button className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all group min-h-[140px]">
                  <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">New Vault</span>
                </button>
              </div>
            </div>

            {/* Recent Documents */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recent Documents</h2>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="divide-y divide-border/60">
                  {[
                    { name: 'Product Requirements v2.pdf', vault: vaults[0]?.name, type: 'PDF', updated: '2h ago', status: 'Approved' },
                    { name: 'Sprint Planning Notes.md', vault: vaults[0]?.name, type: 'Markdown', updated: '1d ago', status: 'Draft' },
                    { name: 'Architecture Decision Record.md', vault: vaults[0]?.name, type: 'Markdown', updated: '3d ago', status: 'Pending Approval' },
                  ].map((doc, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.vault} · {doc.updated}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          doc.status === 'Approved' ? 'bg-green-100 text-green-700' :
                          doc.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {doc.status}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{doc.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function VaultCard({ vault, folderCount }: { vault: any; folderCount: number }) {
  const colors = ['from-violet-500/20 to-purple-500/10', 'from-blue-500/20 to-cyan-500/10', 'from-emerald-500/20 to-teal-500/10']
  const colorIdx = vault.name.charCodeAt(0) % colors.length

  return (
    <div className="border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
      <div className={`bg-gradient-to-br ${colors[colorIdx]} p-6 border-b border-border/40`}>
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1.5 rounded-lg bg-white/70 hover:bg-white text-muted-foreground hover:text-foreground">
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <h3 className="font-semibold mt-4 text-foreground">{vault.name}</h3>
        {vault.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{vault.description}</p>
        )}
      </div>
      <div className="p-4 bg-card flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><FolderOpen className="w-3.5 h-3.5" /> {folderCount} folders</span>
          <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> 0 docs</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  )
}
