import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { Box, Container, SimpleGrid, Text, Image, VStack, Heading, Stack, Button, HStack } from '@chakra-ui/react'
import { defaultBrand } from '@/lib/defaultBrand'
import { StoreNavbar } from '@/components/store/StoreNavbar'

type Category = {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
}

type CategoriesPageProps = {
  store: any
  categories: Category[]
}

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  const slug = params?.slug as string
  const host = req.headers.host
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`
  const cookie = req.headers.cookie || ''

  try {
    const [storeRes, catRes] = await Promise.all([
      fetch(`${baseUrl}/api/store-page/${slug}`, { headers: { cookie } }),
      fetch(`${baseUrl}/api/categorias?store=${slug}`, { headers: { cookie } }),
    ])

    if (!storeRes.ok) return { notFound: true }
    const store = await storeRes.json()
    const categories = catRes.ok ? await catRes.json() : []

    return { props: { store, categories } }
  } catch (error) {
    console.error('store categories page error', error)
    return { notFound: true }
  }
}

export default function StoreCategoriesPage({ store, categories }: CategoriesPageProps) {
  const brand = { ...defaultBrand, ...(store?.brand || {}) }
  const pageText = brand.textColor || '#0f172a'
  const pageVariant = brand.layoutCategoriesPage || 'grid'
  const titleText = brand.categoriesTitle || `${store?.name} · Categorías`

  const renderGrid = () => (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={5}>
      {categories.map((cat) => (
        <Box
          key={cat.id}
          border="1px solid #e5e7eb"
          borderRadius="lg"
          bg="white"
          overflow="hidden"
          _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
          transition="all 0.15s ease"
        >
          {cat.imageUrl && (
            <Image src={cat.imageUrl} alt={cat.name} w="100%" h="180px" objectFit="cover" />
          )}
          <VStack align="stretch" spacing={3} p={4}>
            <Stack spacing={1}>
              <Text fontWeight="bold" fontSize="lg">{cat.name}</Text>
              <Text color="gray.600" fontSize="sm" noOfLines={2}>{cat.description || 'Explora esta categoría'}</Text>
            </Stack>
            <Button
              as={Link}
              href={`/store/${store.slug}/categoria/${cat.slug}`}
              colorScheme="blue"
              size="sm"
              alignSelf="flex-start"
            >
              Ver productos
            </Button>
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  )

  const renderMagazine = () => (
    <Box>
      <HStack justify="space-between" align="center" mb={4} flexWrap="wrap">
        <Text fontWeight="semibold" color="gray.600">Filtra y explora las categorías disponibles</Text>
        <Text fontSize="sm" color="gray.500">{categories.length} categorías</Text>
      </HStack>
      <Heading as="h2" size="xl" mb={4} color={pageText}>{titleText}</Heading>
      <SimpleGrid
        columns={{ base: 1, sm: Math.min(categories.length, 2) || 1, md: Math.min(categories.length, 3) || 1 }}
        spacing={5}
        justifyItems={categories.length < 3 ? 'center' : 'stretch'}
      >
        {categories.map((cat) => (
          <Box
            key={cat.id}
            bg="white"
            borderRadius="lg"
            border="1px solid #e5e7eb"
            overflow="hidden"
            _hover={{ boxShadow: 'md' }}
            maxW="360px"
            w="100%"
            justifySelf={categories.length < 3 ? 'center' : 'stretch'}
          >
            {cat.imageUrl && (
              <Image src={cat.imageUrl} alt={cat.name} w="100%" h="160px" objectFit="cover" />
            )}
            <Box p={4}>
              <Text fontSize="md" fontWeight="bold" mb={1}>{cat.name}</Text>
              <Text fontSize="sm" color="gray.600" noOfLines={2}>{cat.description || 'Explora esta categoría'}</Text>
              <Button
                as={Link}
                href={`/store/${store.slug}/categoria/${cat.slug}`}
                mt={3}
                size="sm"
                variant="ghost"
                colorScheme="blue"
              >
                Ver productos
              </Button>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )

  return (
    <>
      <Head>
        <title>Categorías | {store?.name}</title>
        <meta name="description" content={`Explora las categorías de ${store?.name}`} />
      </Head>
      <StoreNavbar brand={brand} store={store} />
      <Box bg={brand.pageBg || '#f8fafc'} minH="100vh" py={10} color={pageText}>
        <Container maxW="6xl">
          <Heading as="h1" size="lg" mb={6} color={pageText}>{titleText}</Heading>
          {categories.length === 0 ? (
            <Box p={6} border="1px dashed #e5e7eb" borderRadius="lg" bg="white">
              <Text color="gray.600">No hay categorías publicadas.</Text>
            </Box>
          ) : pageVariant === 'magazine' ? (
            renderMagazine()
          ) : (
            renderGrid()
          )}
        </Container>
      </Box>
    </>
  )
}
