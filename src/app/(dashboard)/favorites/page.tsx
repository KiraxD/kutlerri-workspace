import { createClient } from '@/lib/supabase/server'
import { Star } from 'lucide-react'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: favorites, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading favorites:', error.message)
  }

  const favList = favorites ?? []

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Star className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold">Favorites</h1>
        {favList.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {favList.length}
          </span>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {favList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed border-border rounded-lg">
            <Star className="w-10 h-10 mb-4 opacity-20" />
            <p className="text-sm font-medium">No favorites yet</p>
            <p className="text-xs mt-1 opacity-60">Star items to keep them easily accessible here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favList.map((fav: any) => (
              <div key={fav.id} className="border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div>
                  <h3 className="font-semibold capitalize">{fav.type}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{fav.target_id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
