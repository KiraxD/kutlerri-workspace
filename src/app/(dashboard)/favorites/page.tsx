import { createClient } from '@/lib/supabase/server'
import { Star } from 'lucide-react'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch favorites
  const { data: favorites, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Star className="w-5 h-5" />
          Favorites
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {error ? (
          <div className="text-red-500">Failed to load favorites.</div>
        ) : !favorites || favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed border-border rounded-lg">
            <Star className="w-10 h-10 mb-4 opacity-20" />
            <p>You have no favorites yet.</p>
            <p className="text-sm mt-2">Star items to keep them easily accessible here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((fav: any) => (
              <div key={fav.id} className="border border-border rounded-lg p-4 flex items-center justify-between">
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
