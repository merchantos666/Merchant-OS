import { useState } from 'react'
import { Box, Button, Heading, Input, Stack, Text, FormControl, FormLabel, Alert, AlertIcon, Link, Switch, HStack } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import slugify from 'slugify'

export default function AdminSignupPage() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const normalizedSlug = slug || slugify(name || '', { lower: true, strict: true })
    try {
      const resp = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, slug: normalizedSlug, isPublic }),
      })
      const payload = await resp.json()
      if (!resp.ok) throw new Error(payload?.error || 'No se pudo crear la cuenta')

      // Now sign the user in (email is auto-confirmed via the service route).
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      router.push('/admin/content')
    } catch (err: any) {
      setError(err.message || 'No se pudo crear la tienda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box maxW="lg" mx="auto" mt={12} p={8} borderWidth="1px" borderRadius="lg" boxShadow="md">
      <Heading size="lg" mb={4}>Crear cuenta y tienda</Heading>
      <Text fontSize="sm" color="gray.600" mb={6}>Esto creará un usuario de Supabase y una tienda con slug propio.</Text>
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon /> {error}
        </Alert>
      )}
      <form onSubmit={onSubmit}>
        <Stack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Nombre de la tienda</FormLabel>
            <Input value={name} onChange={(e) => {
              setName(e.target.value)
              if (!slug) setSlug(slugify(e.target.value || '', { lower: true, strict: true }))
            }} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Slug (subdominio)</FormLabel>
            <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value || '', { lower: true, strict: true }))} />
          </FormControl>
          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Catálogo público</FormLabel>
            <Switch isChecked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Correo</FormLabel>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Contraseña</FormLabel>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </FormControl>
          <Button type="submit" colorScheme="blue" isLoading={loading}>Crear</Button>
          <Text fontSize="sm" color="gray.600">
            ¿Ya tienes cuenta? <Link href="/admin/login" color="blue.500">Inicia sesión</Link>
          </Text>
        </Stack>
      </form>
    </Box>
  )
}
