import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState, FormEvent } from 'react'
import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  Button,
  Link as ChakraLink,
} from '@chakra-ui/react'
import { FiSearch } from 'react-icons/fi'
import Link from 'next/link'
import { getSupabaseServerClient } from '@/lib/supabaseServerClient'
import { searchProducts, SearchResult } from '@/lib/search'
import { defaultBrand } from '@/lib/defaultBrand'
import { useQuery } from '@tanstack/react-query'
import { StoreNavbar } from '@/components/store/StoreNavbar'

type SearchPageProps = {
  store: { id: string; name: string; slug: string; brand: any }
  q: string
  initialResults: SearchResult[]
}

export const getServerSideProps: GetServerSideProps = async ({ params, query, req, res }) => {
  const slug = params?.slug as string
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const supabase = getSupabaseServerClient(req as any, res as any)

  const { data: store, error } = await supabase
    .from('stores')
    .select('id, name, slug, brand, is_active')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !store || !store.is_active) {
    return { notFound: true }
  }

  const initialResults = q ? await searchProducts(supabase, store.id, q, 50) : []

  return {
    props: {
      store: { id: store.id, name: store.name, slug: store.slug, brand: store.brand || null },
      q,
      initialResults,
    },
  }
}

export default function SearchPage({ store, q, initialResults }: SearchPageProps) {
  const router = useRouter()
  const [term, setTerm] = useState(q)
  const [submitted, setSubmitted] = useState(q)
  const brand = useMemo(() => ({ ...defaultBrand, ...(store.brand || {}) }), [store.brand])

  useEffect(() => {
    setTerm(q)
    setSubmitted(q)
  }, [q])

  const { data: results, isFetching } = useQuery({
    queryKey: ['search', store.id, submitted],
    queryFn: async (): Promise<SearchResult[]> => {
      const res = await fetch(`/api/search?store=${store.slug}&q=${encodeURIComponent(submitted)}`)
      if (!res.ok) throw new Error('No se pudieron cargar resultados')
      const json = await res.json()
      return json.results || []
    },
    enabled: submitted.trim().length > 0,
    initialData: submitted === q ? initialResults : undefined,
    staleTime: 60_000,
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next = term.trim()
    setSubmitted(next)
    const url = next ? `/store/${store.slug}/buscar?q=${encodeURIComponent(next)}` : `/store/${store.slug}/buscar`
    router.replace(url, undefined, { shallow: true })
  }

  const title = submitted ? `Buscar “${submitted}” | ${store.name}` : `Buscar productos | ${store.name}`
  const description = submitted
    ? `Resultados de búsqueda para ${submitted} en ${store.name}`
    : `Busca productos en ${store.name}`

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`/store/${store.slug}/buscar${submitted ? `?q=${encodeURIComponent(submitted)}` : ''}`} />
      </Head>
      <StoreNavbar brand={brand} store={store} />
      <Container maxW="6xl" py={8}>
        <VStack align="stretch" spacing={6}>
          <Heading size="lg">Buscar en {store.name}</Heading>
          <Box as="form" onSubmit={handleSubmit}>
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.500" />
              </InputLeftElement>
              <Input
                type="search"
                name="q"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar productos..."
                bg="white"
                borderColor="#e2e8f0"
                _focus={{ borderColor: brand.primaryColor || '#2563eb', boxShadow: `0 0 0 1px ${brand.primaryColor || '#2563eb'}` }}
              />
              <InputRightElement width="6rem">
                <Button type="submit" colorScheme="blue" size="sm">Buscar</Button>
              </InputRightElement>
            </InputGroup>
          </Box>

          {submitted ? (
            <Text color="gray.600">
              Mostrando resultados para <strong>{submitted}</strong>
            </Text>
          ) : (
            <Text color="gray.600">Ingresa un término para buscar productos.</Text>
          )}

          {isFetching && (
            <HStack>
              <Spinner size="sm" />
              <Text color="gray.600">Buscando...</Text>
            </HStack>
          )}

          {!isFetching && submitted && results && results.length === 0 && (
            <Text color="gray.600">No encontramos resultados para “{submitted}”.</Text>
          )}

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {(results || []).map((item) => (
              <Box key={item.id} border="1px solid #e2e8f0" borderRadius="lg" overflow="hidden" bg="white" _hover={{ boxShadow: 'md' }}>
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt={item.name} objectFit="cover" w="100%" h="180px" />
                )}
                <Box p={4}>
                  <ChakraLink as={Link} href={`/store/${store.slug}/producto/${item.slug}`} fontWeight="bold" color="blue.600">
                    {item.name}
                  </ChakraLink>
                  <Text fontSize="sm" color="gray.600" mt={2} noOfLines={3}>
                    {item.description || 'Producto sin descripción'}
                  </Text>
                  {item.category && (
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      {item.category.name}
                    </Text>
                  )}
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </>
  )
}
