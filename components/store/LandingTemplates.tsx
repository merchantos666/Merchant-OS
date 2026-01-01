import { Box, Button, Container, Flex, Grid, GridItem, HStack, Image, Stack, Text, VStack, Divider, SimpleGrid, Icon, Badge } from '@chakra-ui/react'
import Link from 'next/link'
import { BrandConfig } from '@/lib/defaultBrand'
import { StoreNavbar } from './StoreNavbar'
import { FiShoppingBag } from 'react-icons/fi'

type LandingProps = {
  brand: BrandConfig
  store: { name: string; slug: string }
  categories: { id: string; name: string; description?: string | null; imageUrl?: string | null; slug: string }[]
  bestSellers?: { id: string; name: string; description?: string | null; slug: string; imageUrl?: string | null; price?: number | null }[]
}

export function LandingPage({ brand, store, categories, bestSellers = [] }: LandingProps) {
  const navVariant = brand.layoutNav || 'classic'
  const heroVariant = brand.layoutHero || 'classic'
  const highlightVariant = brand.layoutHighlight || 'split'
  const categoriesVariant = brand.layoutCategories || 'grid'
  const bestVariant = brand.layoutBestsellers || 'grid'
  const primary = brand.primaryColor || '#2563eb'
  const text = brand.textColor || '#0f172a'
  const surface = brand.surfaceColor || '#ffffff'
  const pageBg = brand.pageBg || '#f8fafc'

  return (
    <Box bg={pageBg} minH="100vh" color={text}>
      <StoreNavbar brand={{ ...brand, layoutNav: navVariant }} store={store} />
      {renderHero(heroVariant, brand, store, primary)}
      {renderBestsellers(bestVariant, brand, bestSellers, primary, surface, text, store)}
      {renderCategories(categoriesVariant, brand, categories, store, surface, text)}
      <Container maxW="6xl" py={10}>
        <Text textAlign="center" color="gray.500" fontSize="sm">
          {brand.footerText || `© ${new Date().getFullYear()} ${store.name}. Todos los derechos reservados.`}
        </Text>
      </Container>
    </Box>
  )
}

function renderNav(variant: string, brand: BrandConfig, store: { name: string; slug: string }, primary: string, text: string) {
  const navBg = brand.navBgColor || '#ffffff'
  const navText = brand.navTextColor || text
  const navCta = brand.heroCta || 'Ver catálogo'
const navLinks = ['Categorías', 'Destacados', 'Ofertas', 'Ayuda']
  switch (variant) {
    case 'solid-search':
      return (
        <Box bg={primary} color="white" py={3}>
          <Container maxW="6xl">
            <Flex align="center" gap={6} flexWrap="wrap">
              <HStack spacing={3} flexShrink={0}>
                {brand.logoUrl && <Image src={brand.logoUrl} alt="Logo" boxSize="42px" borderRadius="md" bg="white" p={1} />}
                <Text fontWeight="bold" fontSize="lg">{brand.heroTitle || store.name}</Text>
              </HStack>
              <HStack spacing={4} flexWrap="wrap">
                {navLinks.map((item) => (
                  <Link key={item} href={`#${item.toLowerCase()}`}>{item}</Link>
                ))}
              </HStack>
              <Box as="form" action={`/store/${store.slug}/buscar`} method="get" maxW="280px" w="100%" ml="auto">
                <InputGroup>
                  <Input
                    name="q"
                    type="search"
                    bg="white"
                    color="gray.800"
                    placeholder="Buscar producto"
                    borderRadius="full"
                    _placeholder={{ color: 'gray.500' }}
                  />
                  <InputRightElement>
                    <IconButton aria-label="Buscar" icon={<FiSearch color="#1d4ed8" />} type="submit" size="sm" variant="ghost" />
                  </InputRightElement>
                </InputGroup>
              </Box>
              <HStack spacing={3}>
                <IconButton aria-label="notificaciones" icon={<FiBell />} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} />
                <IconButton aria-label="favoritos" icon={<FiHeart />} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} />
                <IconButton aria-label="perfil" icon={<FiUser />} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} />
                <IconButton aria-label="carrito" icon={<FiShoppingCart />} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} />
              </HStack>
            </Flex>
          </Container>
        </Box>
      )
    case 'minimal-pill':
      return (
        <Box bg={navBg} borderBottom="1px solid #e2e8f0" color={navText}>
          <Container maxW="6xl" py={4}>
            <Flex align="center" gap={6} flexWrap="wrap">
              <HStack spacing={3} flexShrink={0}>
                {brand.logoUrl && <Image src={brand.logoUrl} alt="Logo" boxSize="40px" borderRadius="md" />}
                <Text fontWeight="bold" fontSize="lg">{brand.heroTitle || store.name}</Text>
              </HStack>
              <HStack spacing={4}>
                {navLinks.map((item) => (
                  <Link key={item} href={`#${item.toLowerCase()}`}>{item}</Link>
                ))}
              </HStack>
              <Box as="form" action={`/store/${store.slug}/buscar`} method="get" maxW="260px" w="100%" ml="auto">
                <InputGroup>
                  <Input name="q" type="search" placeholder="Buscar producto" borderRadius="full" />
                  <InputRightElement>
                    <IconButton aria-label="Buscar" icon={<FiSearch />} type="submit" size="sm" variant="ghost" />
                  </InputRightElement>
                </InputGroup>
              </Box>
              <HStack spacing={3}>
                <IconButton aria-label="favoritos" icon={<FiHeart />} variant="ghost" />
                <IconButton aria-label="perfil" icon={<FiUser />} variant="ghost" />
                <IconButton aria-label="carrito" icon={<FiShoppingCart />} variant="ghost" />
              </HStack>
            </Flex>
          </Container>
        </Box>
      )
    case 'two-row':
      return (
        <Box bg="#f8fafc" color={text}>
          <Container maxW="6xl" py={2}>
            <HStack justify="space-between" spacing={4} fontSize="sm" color="gray.600">
              <HStack spacing={2}><FiMapPin /> <Text>Manhattan, New York, USA</Text></HStack>
              <HStack spacing={3}>
                <HStack spacing={1}><FiPhone /><Text>Soporte</Text></HStack>
                <HStack spacing={1}><FiGlobe /><Text>EN | USD</Text></HStack>
              </HStack>
            </HStack>
          </Container>
          <Divider />
          <Container maxW="6xl" py={3}>
            <Flex align="center" gap={4} flexWrap="wrap">
              <HStack spacing={3} flexShrink={0}>
                {brand.logoUrl && <Image src={brand.logoUrl} alt="Logo" boxSize="40px" borderRadius="md" />}
                <Text fontWeight="bold" fontSize="lg">{brand.heroTitle || store.name}</Text>
              </HStack>
              <Button variant="outline" size="sm" leftIcon={<FiSearch />}>Categorías</Button>
              <Box as="form" action={`/store/${store.slug}/buscar`} method="get" flex="1" minW="220px" maxW="360px">
                <InputGroup>
                  <Input name="q" type="search" placeholder="Buscar producto" />
                  <InputRightElement>
                    <IconButton aria-label="buscar" icon={<FiSearch />} size="sm" variant="ghost" type="submit" />
                  </InputRightElement>
                </InputGroup>
              </Box>
              <HStack spacing={2}>
                <Button size="sm" variant="ghost">Iniciar sesión</Button>
                <Button size="sm" variant="outline">Wishlist</Button>
                <Button size="sm" variant="outline" leftIcon={<FiShoppingCart />}>Carrito</Button>
              </HStack>
            </Flex>
          </Container>
          <Divider />
          <Container maxW="6xl" py={2}>
            <HStack spacing={4} fontSize="sm" color="gray.700" overflowX="auto">
              {['Ofertas', 'Recomendados', 'Novedades', 'Bestsellers', 'Regalos', 'Artículos', 'Más'].map((item) => (
                <Link key={item} href={`#${item.toLowerCase()}`}>{item}</Link>
              ))}
            </HStack>
          </Container>
        </Box>
      )
    case 'pill-search':
      return (
        <Box bg="white" borderBottom="1px solid #e5e7eb" color={text}>
          <Container maxW="6xl" py={4}>
            <Flex align="center" gap={5} flexWrap="wrap">
              <HStack spacing={3} flexShrink={0}>
                {brand.logoUrl && <Image src={brand.logoUrl} alt="Logo" boxSize="40px" borderRadius="md" />}
                <Text fontWeight="bold" fontSize="lg">{brand.heroTitle || store.name}</Text>
              </HStack>
              <Button size="sm" variant="ghost" leftIcon={<FiMenu />}>Categorías</Button>
              <Box as="form" action={`/store/${store.slug}/buscar`} method="get" maxW="360px" flex="1">
                <InputGroup>
                  <InputLeftElement pointerEvents="none" children={<FiSearch color="gray.500" />} />
                  <Input name="q" type="search" placeholder="Buscar producto" borderRadius="full" />
                  <InputRightElement>
                    <Button size="sm" colorScheme="blue" borderRadius="full" type="submit">Buscar</Button>
                  </InputRightElement>
                </InputGroup>
              </Box>
              <HStack spacing={4}>
                <Text fontSize="sm">Órdenes</Text>
                <FiHeart />
                <FiShoppingCart />
                <FiUser />
              </HStack>
            </Flex>
          </Container>
          <Container maxW="6xl" pb={3}>
            <HStack spacing={4} fontSize="sm" color="gray.700" overflowX="auto">
              {['Nueva York, USA', 'Electrónica', 'Autopartes', 'Bestsellers', 'Ropa', 'Regalos', 'Más'].map((item) => (
                <Link key={item} href={`#${item.toLowerCase()}`}>{item}</Link>
              ))}
            </HStack>
          </Container>
        </Box>
      )
    case 'solid-actions':
      return (
        <Box bg={primary} color="white">
          <Container maxW="6xl" py={4}>
            <Flex align="center" gap={4} flexWrap="wrap">
              <HStack spacing={3} flexShrink={0}>
                {brand.logoUrl && <Image src={brand.logoUrl} alt="Logo" boxSize="40px" borderRadius="md" bg="white" p={1} />}
                <Text fontWeight="bold" fontSize="lg">{brand.heroTitle || store.name}</Text>
              </HStack>
              <Button size="sm" variant="outline" color="white" borderColor="whiteAlpha.500" leftIcon={<FiGlobe />}>
                Estados Unidos
              </Button>
              <Box as="form" action={`/store/${store.slug}/buscar`} method="get" maxW="360px" flex="1">
                <InputGroup>
                  <Input name="q" type="search" placeholder="Buscar producto" bg="white" color="gray.800" borderRadius="full" />
                  <InputRightElement>
                    <IconButton aria-label="buscar" icon={<FiSearch />} size="sm" bg="white" color={primary} borderRadius="full" type="submit" />
                  </InputRightElement>
                </InputGroup>
              </Box>
              <HStack spacing={4}>
                <HStack spacing={1}><FiHeart /><Text fontSize="sm">Guardados</Text></HStack>
                <HStack spacing={1}><FiUser /><Text fontSize="sm">Cuenta</Text></HStack>
                <HStack spacing={1}><FiShoppingCart /><Text fontSize="sm">Carrito</Text></HStack>
              </HStack>
            </Flex>
          </Container>
          <Box bg="white">
            <Container maxW="6xl" py={3}>
              <HStack spacing={4} color="gray.800" fontSize="sm" overflowX="auto">
                {['Todas las categorías', 'Electrónica', 'Autopartes', 'Bestsellers', 'Ropa', 'Regalos', 'Más'].map((item) => (
                  <Link key={item} href={`#${item.toLowerCase()}`}>{item}</Link>
                ))}
              </HStack>
            </Container>
          </Box>
        </Box>
      )
    case 'centered':
      return (
        <Box bg={navBg} borderBottom="1px solid #e2e8f0" color={navText}>
          <Container maxW="6xl" py={4}>
            <Flex align="center" justify="center" gap={8}>
              <Text fontWeight="bold" fontSize="lg">{brand.heroTitle || store.name}</Text>
              <HStack spacing={4}>
                <Link href="#categorias">Categorías</Link>
                <Link href="#destacados">Destacados</Link>
                <Link href="#contacto">Contacto</Link>
              </HStack>
            </Flex>
          </Container>
        </Box>
      )
    default:
      return (
        <Box bg={navBg} borderBottom="1px solid #e2e8f0" color={navText}>
          <Container maxW="6xl" py={4}>
            <Flex align="center" justify="space-between">
              <HStack spacing={3}>
                {brand.logoUrl && <Image src={brand.logoUrl} alt="Logo" boxSize="40px" borderRadius="md" />}
                <Text fontWeight="bold" fontSize="lg">{brand.heroTitle || store.name}</Text>
              </HStack>
              <HStack spacing={4}>
                <Link href="#categorias">Categorías</Link>
                <Link href="#destacados">Destacados</Link>
                <Button as={Link} href="#catalogo" bg={primary} color="white" size="sm" _hover={{ bg: primary }}>{navCta}</Button>
              </HStack>
            </Flex>
          </Container>
        </Box>
      )
  }
}

function renderHero(variant: string, brand: BrandConfig, store: { name: string; slug: string }, primary: string) {
  const overlay = brand.heroOverlay || 'rgba(0,0,0,0.6)'
  const heroText = !brand.heroTextColor || brand.heroTextColor === '#00f6ff' ? 'white' : brand.heroTextColor
  const secondaryImg = brand.heroSecondaryImage || brand.logoUrl || brand.heroBg
  switch (variant) {
    case 'fashion':
      return (
        <Box bg="#faf5f0" position="relative" py={{ base: 10, md: 14 }} px={{ base: 4, md: 0 }}>
          <Container maxW="6xl">
            <Flex gap={10} align="center" direction={{ base: 'column', md: 'row' }}>
              <VStack align="start" spacing={4} flex="1">
                <Text fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold" lineHeight="short" color="#b45309">
                  {brand.heroTitle || store.name}
                </Text>
                <Text fontSize="lg" color="#7c2d12">{brand.heroSubtitle || 'Calidad y estilo en cada compra.'}</Text>
                <HStack spacing={3}>
                  <Button size="lg" bg="#b91c1c" color="white" _hover={{ bg: '#991b1b' }}>{brand.heroCta || 'Comprar ahora'}</Button>
                  <Button variant="outline" colorScheme="orange">Ver catálogo</Button>
                </HStack>
              </VStack>
              <Box flex="1" position="relative" maxW="520px">
                <Box
                  borderRadius="3xl"
                  overflow="hidden"
                  boxShadow="2xl"
                  bgGradient="linear(to-br, #f97316, #fb7185)"
                  p={3}
                >
                  <Box borderRadius="2xl" overflow="hidden" bg="white">
                    <Image src={brand.heroBg || '/bg.png'} alt="Hero" objectFit="cover" w="100%" h="360px" />
                  </Box>
                </Box>
                {secondaryImg && (
                  <Box position="absolute" bottom={-8} left={-8} w="140px" borderRadius="2xl" overflow="hidden" boxShadow="xl" border="6px solid white">
                    <Image src={secondaryImg} alt="Colección" objectFit="cover" w="100%" h="140px" />
                  </Box>
                )}
              </Box>
            </Flex>
          </Container>
        </Box>
      )
    case 'collage':
      return (
        <Box bg="#fdfcf8" py={{ base: 10, md: 14 }} px={{ base: 4, md: 0 }}>
          <Container maxW="6xl">
            <Grid templateColumns={{ base: '1fr', md: '1.2fr 1fr' }} gap={8} alignItems="center">
              <VStack align="start" spacing={4}>
                <Text fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold" color="#14532d" letterSpacing="-0.5px">
                  {brand.heroTitle || 'Blooming Beauty'}
                </Text>
                <Text fontSize="lg" color="#166534">{brand.heroSubtitle || 'Arreglos únicos para momentos especiales.'}</Text>
                <Button bg="#16a34a" color="white" size="lg" _hover={{ bg: '#15803d' }}>{brand.heroCta || 'Ver bouquets'}</Button>
              </VStack>
              <Grid templateColumns={{ base: '1fr 1fr' }} gap={4}>
                <Box borderRadius="xl" overflow="hidden" boxShadow="lg">
                  <Image src={brand.heroBg || '/bg.png'} alt="Principal" objectFit="cover" w="100%" h="220px" />
                </Box>
                <Box borderRadius="xl" overflow="hidden" boxShadow="lg">
                  <Image src={secondaryImg || brand.heroBg || '/bg.png'} alt="Secundaria" objectFit="cover" w="100%" h="220px" />
                </Box>
                <Box borderRadius="xl" overflow="hidden" boxShadow="lg">
                  <Image src={brand.heroBg || '/bg.png'} alt="Detalle" objectFit="cover" w="100%" h="220px" />
                </Box>
                <Box borderRadius="xl" overflow="hidden" boxShadow="lg">
                  <Image src={secondaryImg || brand.heroBg || '/bg.png'} alt="Detalle" objectFit="cover" w="100%" h="220px" />
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      )
    case 'dark-split':
      return (
        <Box position="relative" color="white" bg="#0f172a" py={{ base: 12, md: 16 }}>
          <Flex position="absolute" inset={0} _before={{ content: '""', position: 'absolute', inset: 0, bg: '#0f172a', opacity: 0.7 }} />
          <Box
            position="absolute"
            inset={0}
            bgImage={`url(${brand.heroBg || '/bg.png'})`}
            bgSize="cover"
            bgPos="center"
            filter="blur(2px)"
            opacity={0.4}
          />
          <Container maxW="6xl" position="relative">
            <Grid templateColumns={{ base: '1fr', md: '1.1fr 0.9fr' }} gap={8} alignItems="center">
              <VStack align="start" spacing={4}>
                <Text fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold">{brand.heroTitle || store.name}</Text>
                <Text fontSize="lg" color="gray.200">{brand.heroSubtitle || 'Confianza y desempeño.'}</Text>
                <HStack spacing={3}>
                  <Button size="lg" bg="white" color="#0f172a" _hover={{ opacity: 0.9 }}>{brand.heroCta || 'Explorar'}</Button>
                  <Button size="lg" variant="outline" colorScheme="whiteAlpha">Aprender más</Button>
                </HStack>
              </VStack>
              <Box borderRadius="2xl" overflow="hidden" boxShadow="2xl">
                <Image src={brand.heroBg || '/bg.png'} alt="Hero" objectFit="cover" w="100%" h={{ base: '240px', md: '320px' }} />
              </Box>
            </Grid>
          </Container>
        </Box>
      )
    case 'product-highlight':
      return (
        <Box bg="#f8fafc" py={{ base: 10, md: 14 }} px={{ base: 4, md: 0 }}>
          <Container maxW="6xl">
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={8} alignItems="center">
              <VStack align="start" spacing={3}>
                <Text fontSize="sm" color="gray.500" letterSpacing="wide" textTransform="uppercase">Edición destacada</Text>
                <Text fontSize={{ base: '3xl', md: '4xl' }} fontWeight="black" color="#0f172a">{brand.heroTitle || store.name}</Text>
                <Text fontSize="md" color="gray.600">{brand.heroSubtitle || 'Rendimiento sin distracciones.'}</Text>
                <HStack spacing={3} flexWrap="wrap">
                  <Button size="lg" colorScheme="blue">{brand.heroCta || 'Comprar ahora'}</Button>
                  <Button variant="ghost" colorScheme="gray">Ver specs</Button>
                </HStack>
              </VStack>
              <Box position="relative">
                <Box borderRadius="2xl" overflow="hidden" boxShadow="xl" bg="white">
                  <Image src={brand.heroBg || '/bg.png'} alt="Producto" objectFit="cover" w="100%" h={{ base: '220px', md: '320px' }} />
                </Box>
                <Box position="absolute" top={4} left={4} bg="white" borderRadius="full" px={4} py={2} boxShadow="md" fontWeight="bold">
                  Nuevo
                </Box>
              </Box>
            </Grid>
          </Container>
        </Box>
      )
    case 'banner':
      return (
        <Box bg="blue.900" color="white" py={12} id="catalogo">
          <Container maxW="6xl">
            <HStack spacing={8} align="center">
              <VStack align="start" spacing={3} flex="1">
                <Text fontSize="3xl" fontWeight="extrabold">{brand.heroTitle || store.name}</Text>
                <Text fontSize="lg" color="blue.100">{brand.heroSubtitle || 'Explora nuestros productos'}</Text>
                <Button bg={primary} color="white" size="lg" _hover={{ opacity: 0.9 }}>{brand.heroCta || 'Comprar ahora'}</Button>
              </VStack>
              {brand.heroBg && (
                <Box flex="1" borderRadius="lg" overflow="hidden" boxShadow="lg">
                  <Image src={brand.heroBg} alt="Hero" objectFit="cover" w="100%" h="260px" />
                </Box>
              )}
            </HStack>
          </Container>
        </Box>
      )
    default:
      return (
        <Box
          bgImage={`url(${brand.heroBg || '/bg.png'})`}
          bgSize="cover"
          bgPos="center"
          position="relative"
          py={16}
          id="catalogo"
        >
          <Box position="absolute" inset={0} bgGradient={`linear(to-r, ${overlay}, rgba(0,0,0,0.2))`} />
          <Container maxW="6xl" position="relative">
            <VStack align="start" spacing={4} color={heroText} maxW="520px">
              <Text fontSize="3xl" fontWeight="extrabold" color={heroText}>{brand.heroTitle || store.name}</Text>
              <Text fontSize="lg" color="gray.200">{brand.heroSubtitle || 'Explora nuestros productos'}</Text>
              <Button bg={primary} color="white" size="lg" _hover={{ opacity: 0.9 }}>{brand.heroCta || 'Comprar ahora'}</Button>
            </VStack>
          </Container>
        </Box>
      )
  }
}

function renderHighlight(variant: string, brand: BrandConfig, categories: any[], surface: string, text: string) {
  const featured = categories.slice(0, 3)
  const highlightTitle = brand.highlightTitle || `Lo mejor de ${brand.heroTitle || 'la tienda'}`
  const highlightSubtitle = brand.highlightSubtitle || 'Explora nuestras categorías más populares y agrega tus favoritos al carrito.'
  switch (variant) {
    case 'cards':
      return (
        <Container maxW="6xl" py={10} id="destacados">
          <Text fontSize="2xl" fontWeight="bold" mb={4}>{highlightTitle}</Text>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
            {featured.map((cat) => (
              <Box key={cat.id} border="1px solid #e2e8f0" borderRadius="lg" p={4} bg={surface} color={text}>
                <Text fontWeight="bold" mb={2}>{cat.name}</Text>
                <Text fontSize="sm" color="gray.600">{cat.description || 'Descubre esta categoría'}</Text>
              </Box>
            ))}
            {!featured.length && <Text color="gray.500">Configura categorías para ver destacados.</Text>}
          </Grid>
        </Container>
      )
    default:
      return (
        <Container maxW="6xl" py={10} id="destacados">
          <Grid templateColumns={{ base: '1fr', md: '2fr 3fr' }} gap={6} alignItems="center">
            <Box>
              <Text fontSize="2xl" fontWeight="bold" mb={3}>{highlightTitle}</Text>
              <Text color="gray.600">{highlightSubtitle}</Text>
            </Box>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
              {featured.map((cat) => (
                <Box key={cat.id} bg="white" border="1px solid #e2e8f0" borderRadius="lg" p={3} textAlign="center">
                  <Text fontWeight="semibold">{cat.name}</Text>
                </Box>
              ))}
              {!featured.length && <Text color="gray.500">Añade categorías para mostrarlas aquí.</Text>}
            </Grid>
          </Grid>
        </Container>
      )
  }
}

function renderCategories(variant: string, brand: BrandConfig, categories: any[], store: { slug: string }, surface: string, text: string) {
  if (!categories.length) return null
  const basePath = `/store/${store.slug}/categoria`
  const categoriesTitle = brand.categoriesTitle || 'Categorías'
  switch (variant) {
    case 'list':
      return (
        <Container maxW="6xl" py={10} id="categorias">
          <Text fontSize="2xl" fontWeight="bold" mb={4}>{categoriesTitle}</Text>
          <VStack align="stretch" spacing={3}>
            {categories.map((cat) => (
              <Flex key={cat.id} border="1px solid #e2e8f0" borderRadius="lg" p={3} align="center" justify="space-between" bg={surface} color={text}>
                <Text fontWeight="semibold">{cat.name}</Text>
                <Button as={Link} href={`${basePath}/${cat.slug}`} size="sm" variant="outline">Ver</Button>
              </Flex>
            ))}
          </VStack>
        </Container>
      )
    default:
      return (
        <Container maxW="6xl" py={10} id="categorias">
          <Text fontSize="2xl" fontWeight="bold" mb={4}>{categoriesTitle}</Text>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
            {categories.map((cat) => (
              <GridItem key={cat.id} as={Link} href={`${basePath}/${cat.slug}`}>
                <Box border="1px solid #e2e8f0" borderRadius="lg" bg={surface} color={text} overflow="hidden" transition="all 0.2s" _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}>
                  {cat.imageUrl && (
                    <Image src={cat.imageUrl} alt={cat.name} objectFit="cover" w="100%" h="140px" />
                  )}
                  <Box p={3}>
                    <Text fontWeight="semibold">{cat.name}</Text>
                    <Text fontSize="sm" color="gray.600">{cat.description || 'Explora esta categoría'}</Text>
                  </Box>
                </Box>
              </GridItem>
            ))}
          </Grid>
        </Container>
      )
    case 'hero-slider':
      return (
        <Container maxW="6xl" py={12}>
          <Text fontSize="2xl" fontWeight="bold" mb={6}>{categoriesTitle}</Text>
          <Grid templateColumns={{ base: '1fr', md: '1.2fr 1fr' }} gap={6} alignItems="center">
            {categories[0] && (
              <Box borderRadius="xl" overflow="hidden" boxShadow="xl" border="1px solid #e5e7eb" bg="white">
                {categories[0].imageUrl && <Image src={categories[0].imageUrl} alt={categories[0].name} w="100%" h="320px" objectFit="cover" />}
                <Box p={5}>
                  <Text fontSize="xl" fontWeight="black" mb={2}>{categories[0].name}</Text>
                  <Text color="gray.600" mb={3}>{categories[0].description || 'Descubre esta categoría'}</Text>
                  <Button as={Link} href={`${basePath}/${categories[0].slug}`} colorScheme="blue">Ver categoría</Button>
                </Box>
              </Box>
            )}
            <SimpleGrid columns={{ base: 2, md: 1 }} spacing={4}>
              {categories.slice(1, 5).map((cat) => (
                <Box key={cat.id} border="1px solid #e5e7eb" borderRadius="lg" p={4} bg="white" _hover={{ boxShadow: 'md' }}>
                  <Text fontWeight="bold" mb={2}>{cat.name}</Text>
                  <Text fontSize="sm" color="gray.600" noOfLines={2}>{cat.description || 'Explora'}</Text>
                  <Button as={Link} href={`${basePath}/${cat.slug}`} size="sm" mt={3} variant="outline">Ver</Button>
                </Box>
              ))}
            </SimpleGrid>
          </Grid>
        </Container>
      )
    case 'dark-showcase':
      return (
        <Box bg="#0f1117" color="white" py={12}>
          <Container maxW="6xl">
            <Text fontSize="2xl" fontWeight="bold" mb={6}>{categoriesTitle}</Text>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
              {categories.slice(0, 6).map((cat) => (
                <Box key={cat.id} borderRadius="lg" overflow="hidden" position="relative" border="1px solid #1f2937" _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }} transition="all 0.2s ease">
                  {cat.imageUrl && (
                    <Image src={cat.imageUrl} alt={cat.name} w="100%" h="220px" objectFit="cover" opacity={0.9} />
                  )}
                  <Box position="absolute" inset={0} bgGradient="linear(to-b, rgba(0,0,0,0.2), rgba(0,0,0,0.85))" />
                  <Box position="absolute" bottom={0} p={4}>
                    <Text fontWeight="bold" fontSize="lg">{cat.name}</Text>
                    <Text fontSize="sm" color="gray.300" noOfLines={2}>{cat.description || 'Explora esta categoría'}</Text>
                    <Button as={Link} href={`${basePath}/${cat.slug}`} size="sm" mt={2} colorScheme="pink" variant="solid">Ver detalles</Button>
                  </Box>
                </Box>
              ))}
            </Grid>
          </Container>
        </Box>
      )
  }
}

function renderBestsellers(variant: string, brand: BrandConfig, products: any[], primary: string, surface: string, text: string, store?: { slug: string }) {
  if (!products.length) return null
  const title = brand.bestsellersTitle || 'Bestsellers'
  const productBase = store?.slug ? `/store/${store.slug}/producto` : '#'

  const Card = ({ p }: any) => (
    <Link href={`${productBase}/${p.slug}`} passHref legacyBehavior>
      <Box
        as="a"
        border="1px solid #eef2f7"
        borderRadius="lg"
        p={4}
        bg={surface}
        color={text}
        boxShadow="sm"
        _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
        transition="all 0.15s ease"
      >
        {p.imageUrl && (
          <Box borderRadius="md" overflow="hidden" mb={3} bg="#f8fafc">
            <Image src={p.imageUrl} alt={p.name} objectFit="contain" w="100%" h="220px" />
          </Box>
        )}
        <Text fontWeight="bold" mb={1}>{p.name}</Text>
        <Text fontSize="sm" color="gray.600" noOfLines={2}>{p.description || 'Producto destacado'}</Text>
        {p.price != null && (
          <Text fontWeight="semibold" mt={2}>${p.price.toFixed(2)}</Text>
        )}
      </Box>
    </Link>
  )

  switch (variant) {
    case 'spotlight':
      return (
        <Container maxW="6xl" py={10}>
          <HStack justify="space-between" mb={4}>
            <Text fontSize="2xl" fontWeight="bold">{title}</Text>
            <Button variant="ghost" rightIcon={<FiShoppingBag />}>Ver todo</Button>
          </HStack>
          <SimpleGrid columns={{ base: 1, sm: Math.min(products.length, 2), md: Math.min(products.length, 3) }} spacing={4} justifyItems="center">
            {products.slice(0, 3).map((p) => <Card key={p.id} p={p} />)}
          </SimpleGrid>
        </Container>
      )
    case 'carousel':
      return (
        <Container maxW="6xl" py={10}>
          <Text fontSize="2xl" fontWeight="bold" mb={4}>Lo más popular</Text>
          <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={3}>
            {products.slice(0, 8).map((p) => (
              <Box key={p.id} border="1px solid #e2e8f0" borderRadius="lg" p={3} bg={surface}>
                {p.imageUrl && <Image src={p.imageUrl} alt={p.name} w="100%" h="120px" objectFit="cover" borderRadius="md" mb={2} />}
                <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>{p.name}</Text>
                {p.price != null && <Text color="gray.700" fontSize="sm">${p.price.toFixed(2)}</Text>}
              </Box>
            ))}
          </Grid>
        </Container>
      )
    case 'flash':
      return (
        <Container maxW="6xl" py={10}>
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontSize="2xl" fontWeight="bold">Flash Sale</Text>
            <HStack spacing={2}>
              {['02', '35', '40', '40'].map((t, idx) => (
                <Box key={idx} bg="gray.900" color="white" px={3} py={1} borderRadius="md" fontWeight="bold">
                  {t}
                </Box>
              ))}
            </HStack>
          </Flex>
          <HStack spacing={3} mb={4} flexWrap="wrap">
            {['Tecnología', 'Moda', 'Accesorios', 'Hogar', 'Deportes'].map((chip, idx) => (
              <Button key={chip} size="sm" variant={idx === 1 ? 'solid' : 'ghost'} colorScheme={idx === 1 ? 'red' : 'gray'}>
                {chip}
              </Button>
            ))}
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
            {products.slice(0, 8).map((p, idx) => (
              <Box key={p.id} border="1px solid #e5e7eb" borderRadius="lg" p={3} bg="white" position="relative" _hover={{ boxShadow: 'md' }}>
                {idx < 2 && (
                  <Badge colorScheme="red" borderRadius="md" position="absolute" top={2} left={2}>
                    Hot
                  </Badge>
                )}
                {p.imageUrl && <Image src={p.imageUrl} alt={p.name} w="100%" h="140px" objectFit="cover" borderRadius="md" mb={2} />}
                <Text fontSize="xs" color="gray.500" noOfLines={1}>Marca destacada</Text>
                <Text fontWeight="semibold" fontSize="sm" noOfLines={2}>{p.name}</Text>
                <HStack spacing={2} mt={2}>
                  {p.price != null && <Text fontWeight="bold">${p.price.toFixed(2)}</Text>}
                  <Text fontSize="xs" color="gray.500" textDecor="line-through">${(p.price ? p.price * 1.1 : 0).toFixed(2)}</Text>
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
          <HStack spacing={2} mt={4} justify="center">
            {[0, 1, 2].map((i) => (
              <Box key={i} w={2} h={2} borderRadius="full" bg={i === 0 ? primary : '#cbd5e1'} />
            ))}
          </HStack>
        </Container>
      )
    case 'signature':
      return (
        <Container maxW="6xl" py={10} bg="#f8f1e9" borderRadius="2xl">
          <Flex justify="space-between" align="center" mb={4} px={{ base: 2, md: 0 }}>
            <Text fontSize="xl" fontWeight="extrabold" letterSpacing="wide" textTransform="uppercase">Our Signature Categories</Text>
            <Button size="sm" variant="outline" borderRadius="full">View All</Button>
          </Flex>
          <SimpleGrid columns={{ base: 1, sm: Math.min(products.length, 2), md: Math.min(products.length, 3) }} spacing={5} justifyItems="center">
            {products.slice(0, 3).map((p) => (
              <Link key={p.id} href={`${productBase}/${p.slug}`} passHref legacyBehavior>
                <Box
                  as="a"
                  bg="white"
                  border="1px solid #e5ded4"
                  borderRadius="lg"
                  overflow="hidden"
                  p={4}
                  textAlign="center"
                  boxShadow="sm"
                  _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                  transition="all 0.15s ease"
                  maxW="280px"
                  cursor="pointer"
                >
                  {p.imageUrl && <Image src={p.imageUrl} alt={p.name} w="100%" h="120px" objectFit="contain" mb={3} />}
                  <Text fontWeight="extrabold" letterSpacing="wide" textTransform="uppercase" fontSize="sm">{p.name}</Text>
                  <Text fontSize="xs" color="gray.600" mt={1}>{p.itemsAvailable ? `${p.itemsAvailable} items available` : 'Disponible'}</Text>
                  <Button as="span" size="sm" variant="outline" mt={3} borderRadius="full">View Item</Button>
                </Box>
              </Link>
            ))}
          </SimpleGrid>
        </Container>
      )
    default:
      return (
        <Container maxW="6xl" py={10}>
          <HStack justify="space-between" mb={6}>
            <Text fontSize="2xl" fontWeight="bold">{title}</Text>
            <Button size="sm" variant="ghost" rightIcon={<FiShoppingBag />}>Descubrir</Button>
          </HStack>
          <SimpleGrid columns={{ base: 1, sm: Math.min(products.length, 2), md: Math.min(products.length, 3) }} spacing={6} justifyItems="center">
            {products.slice(0, 6).map((p) => <Card key={p.id} p={p} />)}
          </SimpleGrid>
        </Container>
      )
  }
}
