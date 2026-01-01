import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react'
import { getStoreSlugFromHost } from './store'

type Store = { id: string; slug: string; name: string }
type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer'

/**
 * Client-side guard for admin pages. Checks session, loads the store for the current host,
 * verifies membership, and redirects to /admin/login when missing.
 */
export function useAdminStore() {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const { session, isLoading: sessionLoading } = useSessionContext()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [membershipRole, setMembershipRole] = useState<MemberRole | null>(null)
  const fetchedForUser = useRef<string | null>(null)
  const triedBootstrap = useRef<boolean>(false)

  useEffect(() => {
    if (sessionLoading) return
    if (!session) {
      setLoading(false)
      router.replace('/admin/login')
      return
    }

    // Avoid duplicate fetches in Strict Mode for the same user.
    if (fetchedForUser.current === session.user.id) return
    fetchedForUser.current = session.user.id

    let cancelled = false
    const run = async () => {
      const slugFromQuery = (router.query.store as string | undefined)?.trim()
      const slug = slugFromQuery || getStoreSlugFromHost(typeof window !== 'undefined' ? window.location.host : undefined)

      // Try store by slug first
      const { data: storeData } = await supabase
        .from('stores')
        .select('id, slug, name')
        .eq('slug', slug)
        .maybeSingle()

      let selectedStore = storeData as Store | null

      // Fallback: first store where the user is a member
      if (!selectedStore) {
        const { data: membershipStore } = await supabase
          .from('store_memberships')
          .select('stores!inner(id, slug, name)')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle()

        selectedStore = (membershipStore as any)?.stores ?? null
      }

      if (!selectedStore) {
        if (!cancelled) {
          setError('No tienes tiendas asignadas')
          setLoading(false)
          router.replace('/admin/signup')
        }
        return
      }

      const { data: membership } = await supabase
        .from('store_memberships')
        .select('role')
        .eq('store_id', selectedStore.id)
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!membership) {
        // Try to bootstrap membership via service API once.
        if (!triedBootstrap.current) {
          triedBootstrap.current = true
          await fetch('/api/admin/ensure-membership', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeId: selectedStore.id }),
          })
          // Re-fetch membership after bootstrap attempt
          const { data: membership2 } = await supabase
            .from('store_memberships')
            .select('role')
            .eq('store_id', selectedStore.id)
            .eq('user_id', session.user.id)
            .maybeSingle()
          if (!membership2) {
            if (!cancelled) {
              setError('No tienes acceso a esta tienda')
              setLoading(false)
              router.replace('/admin/signup')
            }
            return
          }
          setMembershipRole((membership2?.role || null) as MemberRole | null)
        } else {
          if (!cancelled) {
            setError('No tienes acceso a esta tienda')
            setLoading(false)
            router.replace('/admin/signup')
          }
          return
        }
      } else {
        setMembershipRole((membership?.role || null) as MemberRole | null)
      }

      if (!cancelled) {
        setStore(selectedStore)
        setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [sessionLoading, session, supabase, router])

  return { store, loading, error, membershipRole }
}
