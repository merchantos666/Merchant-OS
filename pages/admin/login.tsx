import { useEffect, useState } from 'react'
import { Box, Button, Heading, Input, Stack, Text, FormControl, FormLabel, Alert, AlertIcon, Link } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

export default function AdminLoginPage() {
  const supabase = useSupabaseClient()
  const user = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user) router.replace('/admin/content')
  }, [user, router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }
    router.push('/admin/content')
  }

  return (
    <Box maxW="md" mx="auto" mt={16} p={8} borderWidth="1px" borderRadius="lg" boxShadow="md">
      <Heading size="lg" mb={4}>Acceso Administrador</Heading>
      <Text fontSize="sm" color="gray.500" mb={6}>Inicia sesión con tu correo y contraseña de Supabase.</Text>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon /> {error}
        </Alert>
      )}
      <form onSubmit={onSubmit}>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>Correo</FormLabel>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </FormControl>
          <FormControl>
            <FormLabel>Contraseña</FormLabel>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </FormControl>
          <Button type="submit" colorScheme="blue" isLoading={loading}>Entrar</Button>
          <Text fontSize="sm" color="gray.600">
            ¿No tienes cuenta?{' '}
            <Link color="blue.500" href="/admin/signup">Crear cuenta y tienda</Link>
          </Text>
        </Stack>
      </form>
    </Box>
  )
}
