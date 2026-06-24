import { createClient } from '@/lib/supabase/server'
import { Lock, FolderOpen, FileText, Plus, ChevronRight, Shield, Edit, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function VaultPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: orgMembers } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id)
  const orgIds = orgMembers?.map((organizationMember: any) => organizationMember.organization_id) ?? []

  let vaults: any[] = []
  if (orgIds.length > 0) {
    const { data } = await supabase
      .from('vaults')
      .select('*, org:organizations(name), team:teams(name)')
      .in('organization_id', orgIds)
      .order('created_at', { ascending: false })
    vaults = data ?? []
  }

  const vaultIds = vaults.map((vault: any) => vault.id)
  const folderCounts: Record<string, number> = {}
  const docCounts: Record<string, number> = {}
  const folderToVault = new Map<string, string>()
  const vaultNameById = new Map(vaults.map((vault: any) => [vault.id, vault.name]))
  let recentDocuments: Array<{ id: string; name: string; status: string | null; updatedAt: string; vaultName: string; type: string }> = []

  if (vaultIds.length > 0) {
    const { data: folders } = await supabase.from('vault_folders').select('id, vault_id').in('vault_id', vaultIds)
    const folderIds = folders?.map((folder: any) => folder.id) ?? []

    folders?.forEach((folder: any) => {
      folderCounts[folder.vault_id] = (folderCounts[folder.vault_id] || 0) + 1
      folderToVault.set(folder.id, folder.vault_id)
    })

    if (folderIds.length > 0) {
      const { data: allDocuments } = await supabase.from('vault_documents').select('folder_id').in('folder_id', folderIds)
      allDocuments?.forEach((document: any) => {
        const vaultId = folderToVault.get(document.folder_id)
        if (vaultId) {
          docCounts[vaultId] = (docCounts[vaultId] || 0) + 1
        }
      })

      const { data: latestDocuments } = await supabase
        .from('vault_documents')
        .select('id, name, approval_status, updated_at, folder_id')
        .in('folder_id', folderIds)
        .order('updated_at', { ascending: false })
        .limit(8)

      recentDocuments = (latestDocuments || []).map((document: any) => {
        const vaultId = folderToVault.get(document.folder_id) || ''
        return {
          id: document.id,
          name: document.name,
          status: document.approval_status,
          updatedAt: document.updated_at,
          vaultName: vaultNameById.get(vaultId) || 'Unknown vault',
          type: getDocumentType(document.name),
        }
      })
    }
  }

  return (
    <div className="flex flex-col bg-background">
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
              ].map((feature) => (
                <div key={feature.label} className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex justify-center mb-2">{feature.icon}</div>
                  <p className="text-xs text-muted-foreground font-medium">{feature.label}</p>
                </div>
              ))}
            </div>
            <Link href="/teams">
              <Button>Create a Team First</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Your Vaults</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {vaults.map((vault: any) => (
                  <VaultCard
                    key={vault.id}
                    vault={vault}
                    folderCount={folderCounts[vault.id] ?? 0}
                    docCount={docCounts[vault.id] ?? 0}
                  />
                ))}
                <button className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all group min-h-[140px]">
                  <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">New Vault</span>
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recent Documents</h2>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="divide-y divide-border/60">
                  {recentDocuments.length === 0 ? (
                    <div className="px-5 py-8 text-sm text-muted-foreground">No documents have been uploaded yet.</div>
                  ) : (
                    recentDocuments.map((document) => (
                      <div key={document.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary">{document.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {document.vaultName} · {formatRelativeDate(document.updatedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(document.status)}`}>
                            {document.status || 'Draft'}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{document.type}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function VaultCard({
  vault,
  folderCount,
  docCount,
}: {
  vault: any
  folderCount: number
  docCount: number
}) {
  const colors = ['from-violet-500/20 to-purple-500/10', 'from-blue-500/20 to-cyan-500/10', 'from-emerald-500/20 to-teal-500/10']
  const colorIndex = vault.name.charCodeAt(0) % colors.length

  return (
    <div className="border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
      <div className={`bg-gradient-to-br ${colors[colorIndex]} p-6 border-b border-border/40`}>
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
        {vault.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{vault.description}</p>}
      </div>
      <div className="p-4 bg-card flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FolderOpen className="w-3.5 h-3.5" /> {folderCount} folders
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> {docCount} docs
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  )
}

function getDocumentType(name: string) {
  const parts = name.split('.')
  if (parts.length < 2) return 'File'
  return parts[parts.length - 1].toUpperCase()
}

function getStatusStyle(status: string | null) {
  if (status === 'Approved') return 'bg-green-100 text-green-700'
  if (status === 'Pending Approval') return 'bg-yellow-100 text-yellow-700'
  if (status === 'Rejected') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

function formatRelativeDate(value: string) {
  const updatedAt = new Date(value)
  const diffMs = Date.now() - updatedAt.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}