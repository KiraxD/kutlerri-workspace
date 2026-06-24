'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { initializeSystemAction } from './actions'
import { createClient } from '@/lib/supabase/client'

export default function InitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) {
        router.replace('/login?message=Sign in before initializing your workspace')
        return
      }

      setUserEmail(user.email)
    }

    loadUser()
  }, [router])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await initializeSystemAction()
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/home')
        }, 1500)
      } else {
        setError(result.error || 'Initialization failed')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/images/kutlerri-logo.png"
            alt="Kutlerri"
            width={200}
            height={60}
            priority
          />
        </div>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Initialize your workspace</h1>
          <p className="text-white/60 mb-6">
            Create the first Kutlerri workspace for the signed-in account.
          </p>

          <div className="bg-white/5 border border-white/10 rounded p-4 mb-6">
            <p className="text-sm text-white/70">Signed in as</p>
            <p className="text-white font-medium mt-1">{userEmail || 'Loading account...'}</p>
          </div>

          {success ? (
            <div className="bg-green-500/20 border border-green-500 rounded p-4 mb-6">
              <p className="text-green-400">Workspace initialized successfully.</p>
              <p className="text-green-400/80 text-sm mt-2">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="button"
                disabled={loading || !userEmail}
                onClick={handleSubmit}
                className="w-full bg-[#9F7CEF] hover:bg-[#8f6cdf] text-white font-semibold py-2 rounded"
              >
                {loading ? 'Initializing...' : 'Initialize Workspace'}
              </Button>
            </div>
          )}

          <p className="text-white/40 text-xs mt-6 text-center">
            This creates your first organization, makes you the founding super admin, and adds a default team.
          </p>

          <div className="mt-6 pt-6 border-t border-[#333]">
            <Link
              href="/login"
              className="w-full inline-block text-center bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded transition"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
