import { useMemo, useState } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import {
  Box,
  Container,
  Flex,
  Text,
  VStack,
  Image,
  SimpleGrid,
  Card,
  CardBody,
  Heading,
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  Stack,
  Divider,
} from '@chakra-ui/react'
import Link from 'next/link'
import { FiSearch } from 'react-icons/fi'
import { defaultBrand } from '@/lib/defaultBrand'
import { StoreNavbar } from '@/components/store/StoreNavbar'

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  const slug = params?.slug as string
  const catSlug = params?.catSlug as string
  const host = req.headers.host
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`
  const cookie = req.headers.cookie || ''

  try {
    const [storeRes, catRes, catListRes] = await Promise.all([
      fetch(`${baseUrl}/api/store-page/${slug}`, { headers: { cookie } }),
      fetch(`${baseUrl}/api/categorias/${catSlug}?store=${slug}`, { headers: { cookie } }),
      fetch(`${baseUrl}/api/categorias?store=${slug}`, { headers: { cookie } }),
    ])

    if (!storeRes.ok || !catRes.ok) return { notFound: true }
    const store = await storeRes.json()
    const category = await catRes.json()
    const categoriesNav = catListRes.ok ? await catListRes.json() : []
    return { props: { store, category, categoriesNav } }
  } catch (error) {
    console.error('store category error', error)
    return { notFound: true }
  }
}

export default function StoreCategory({ store, category, categoriesNav = [] }: any) {
  const brand = { ...defaultBrand, ...(store.brand || {}) }
  const pageBg = brand.pageBg || '#f8fafc'
  const textColor = brand.textColor || '#0f172a'
  const surface = brand.surfaceColor || '#ffffff'
  const pageVariant = brand.layoutCategoriesPage || 'grid'
  const products = category.products || []
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'relevance' | 'price-asc' | 'price-desc'>('relevance')

  const priceRange = useMemo(() => {
    const prices = products
      .map((p: any) => Number(p.price ?? p.pricing_tiers?.[0]?.price ?? 0))
      .filter((n: number) => !Number.isNaN(n) && n > 0)
    if (!prices.length) return { min: 0, max: 0 }
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }, [products])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    let list = products.map((p: any) => {
      const price = Number(p.price ?? p.pricing_tiers?.[0]?.price ?? 0)
      return { ...p, price }
    })
    if (term) {
      list = list.filter((p: any) => p.name?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term))
    }
    if (sort === 'price-asc') list = list.sort((a: any, b: any) => (a.price || 0) - (b.price || 0))
    if (sort === 'price-desc') list = list.sort((a: any, b: any) => (b.price || 0) - (a.price || 0))
    return list
  }, [products, search, sort])

  const formatPrice = (n?: number) => {
    if (n == null || Number.isNaN(n) || n === 0) return ''
    return `$${n.toFixed(2)}`
  }

  const renderGrid = (items: any[]) => (
    <SimpleGrid
      columns={{ base: 1, sm: Math.min(items.length, 2) || 1, md: Math.min(items.length, 3) || 1 }}
      spacing={5}
      justifyItems={items.length < 3 ? 'center' : 'stretch'}
    >
      {items.map((p: any) => {
        const img = p.imageUrl || p.image_url
        return (
          <Card
            key={p.id}
            border="1px solid #e2e8f0"
            borderRadius="lg"
            overflow="hidden"
            bg={surface}
            maxW="360px"
            w="100%"
            shadow="sm"
            _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
            transition="all 0.15s ease"
            position="relative"
          >
            {img && (
              <Image src={img} alt={p.name} w="100%" h="180px" objectFit="cover" />
            )}
            <CardBody>
              <Heading size="md" mb={2} color={textColor}>{p.name}</Heading>
              <Text color="gray.600" noOfLines={3}>{p.description || 'Sin descripción'}</Text>
              {formatPrice(p.price) && (
                <Text mt={2} fontWeight="semibold" color={textColor}>{formatPrice(p.price)}</Text>
              )}
              {p.badge && (
                <Badge position="absolute" top={3} right={3} colorScheme="purple">{p.badge}</Badge>
              )}
              <Button as={Link} href={`/store/${store.slug}/producto/${p.slug}`} mt={4} size="sm" colorScheme="blue">
                Ver producto
              </Button>
            </CardBody>
          </Card>
        )
      })}
    </SimpleGrid>
  )

  const renderMagazine = (items: any[]) => (
    <Flex gap={6} direction={{ base: 'column', md: 'row' }}>
      <Box
        w={{ base: '100%', md: '240px' }}
        bg="white"
        border="1px solid #e5e7eb"
        borderRadius="lg"
        p={4}
        h="fit-content"
      >
        <Text fontWeight="bold" mb={3} color={textColor}>Filtrar</Text>
        <Stack spacing={3}>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>Buscar</Text>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="#94a3b8" />
              </InputLeftElement>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o descripción"
                bg="#f8fafc"
              />
            </InputGroup>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.600" mb={1}>Ordenar</Text>
            <Select value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="relevance">Relevancia</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
            </Select>
          </Box>
          <Box fontSize="xs" color="gray.500">
            Rango de precios: {priceRange.min ? `$${priceRange.min.toFixed(2)}` : 'N/D'} - {priceRange.max ? `$${priceRange.max.toFixed(2)}` : 'N/D'}
          </Box>
        </Stack>
      </Box>
      <Box flex="1">
        <HStack justify="space-between" mb={3} align="center">
          <Text fontSize="sm" color="gray.600">Productos de esta categoría</Text>
          <Text fontSize="sm" color="gray.500">{items.length} productos</Text>
        </HStack>
        <Divider mb={4} />
        {renderGrid(items)}
      </Box>
    </Flex>
  )

  const renderCatalogGrid = (items: any[]) => (
    <Flex gap={6} direction={{ base: 'column', md: 'row' }}>
      <Box
        w={{ base: '100%', md: '240px' }}
        bg="white"
        border="1px solid #e5e7eb"
        borderRadius="lg"
        p={4}
        h="fit-content"
      >
        <Text fontWeight="bold" mb={3} color={textColor}>Categorías</Text>
        <Stack spacing={2} mb={4}>
          {categoriesNav.slice(0, 10).map((cat: any) => (
            <HStack key={cat.id} justify="space-between">
              <Text fontSize="sm" color="gray.700">{cat.name}</Text>
              <Badge colorScheme="gray">{cat.productsCount ?? ''}</Badge>
            </HStack>
          ))}
        </Stack>
        <Divider my={3} />
        <Text fontWeight="bold" mb={2} color={textColor}>Filtrar</Text>
        <Stack spacing={3}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="#94a3b8" />
            </InputLeftElement>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto"
              bg="#f8fafc"
            />
          </InputGroup>
          <Select value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="relevance">Relevancia</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
          </Select>
        </Stack>
      </Box>
      <Box flex="1">
        <HStack justify="space-between" mb={3} align="center">
          <Text fontSize="sm" color="gray.600">Productos de esta categoría</Text>
          <Text fontSize="sm" color="gray.500">{items.length} productos</Text>
        </HStack>
        <Divider mb={4} />
        {renderGrid(items)}
      </Box>
    </Flex>
  )

  return (
    <>
      <Head>
        <title>{category.name} | {store.name}</title>
      </Head>
      <StoreNavbar brand={brand} store={store} />
      <Box bg={pageBg} color={textColor} minH="100vh" py={8}>
        <Container maxW="7xl">
          <VStack align="stretch" spacing={3} mb={6}>
            <Text fontSize="sm" color="gray.600">Categoría</Text>
            <Heading as="h1" size="xl">{category.name}</Heading>
            <Text color="gray.600">{category.description || 'Explora los productos de esta categoría.'}</Text>
          </VStack>
          {products.length === 0 ? (
            <Box p={6} border="1px dashed #e5e7eb" borderRadius="lg" bg={surface}>
              <Text color="gray.600">Sin productos publicados.</Text>
            </Box>
          ) : pageVariant === 'magazine' ? (
            renderMagazine(filtered)
          ) : pageVariant === 'catalog-grid' ? (
            renderCatalogGrid(filtered)
          ) : (
            renderGrid(filtered)
          )}
        </Container>
      </Box>
    </>
  )
}
