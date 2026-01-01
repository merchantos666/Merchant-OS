import { useEffect } from 'react'
import { Box, Text } from '@chakra-ui/react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { useAdminStore } from '@/lib/useAdminStore'
import { useRouter } from 'next/router'

export default function AdminSettingsPage() {
  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()
  const { store, loading: guardLoading, error: guardError, membershipRole } = useAdminStore()

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (guardLoading || !store) {
    return (
      <Box p={6} bg="white" minH="100vh">
        <Text>{guardError || 'Cargando...'}</Text>
      </Box>
    )
  }

  return (
    <Box p={6} bg="white" minH="100vh">
      <Text>Redirigiendo a editor...</Text>
      {router.replace(`/store/${store.slug}/edit`)}
    </Box>
  )
}
