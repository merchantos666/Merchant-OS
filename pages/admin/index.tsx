import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useAdminStore } from '@/lib/useAdminStore'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AdminHome() {
  const { store, loading } = useAdminStore()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !store) {
      router.replace('/admin/login')
    }
  }, [loading, store, router])

  if (loading || !store) {
    return (
      <Box>
        <Text>Cargando panel...</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Heading size="lg" mb={4}>Panel de Administración</Heading>
      <Text mb={6}>Gestiona categorías y productos.</Text>
      <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
        <Button as={Link} href="/admin/content" colorScheme="blue">Contenido</Button>
        <Button as={Link} href="/admin/categories" variant="outline">Categorías</Button>
        <Button as={Link} href="/admin/products" variant="outline">Productos</Button>
      </Stack>
    </Box>
  )
}
