import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { error: dbError } = await supabase.from('profiles').select('id').limit(1)
    const databaseStatus = dbError ? 'error' : 'ok'

    const { error: authError } = await supabase.auth.getUser()
    const authStatus = authError ? 'error' : 'ok'

    const realtimeStatus = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'error'
    const isHealthy = databaseStatus === 'ok' && authStatus === 'ok' && realtimeStatus === 'ok'

    return NextResponse.json(
      {
        status: isHealthy ? 'ok' : 'error',
        services: {
          database: {
            status: databaseStatus,
            error: dbError?.message || null,
          },
          authentication: {
            status: authStatus,
            error: authError?.message || null,
          },
          realtime: {
            status: realtimeStatus,
          },
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: isHealthy ? 200 : 503,
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Internal Server Error',
      },
      { status: 500 }
    )
  }
}