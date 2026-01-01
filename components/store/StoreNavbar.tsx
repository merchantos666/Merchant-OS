import { Box, Button, Container, Divider, Flex, HStack, IconButton, Input, InputGroup, InputLeftElement, InputRightElement, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { BrandConfig } from '@/lib/defaultBrand'
import { FiBell, FiGlobe, FiHeart, FiMapPin, FiMenu, FiPhone, FiSearch, FiShoppingBag, FiUser } from 'react-icons/fi'

type Props = {
  brand: BrandConfig
  store: { name: string; slug: string }
}

const toggleCart = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('toggle-cart'))
  }
}

const getNavLinks = (slug: string) => ([
  { label: 'Categorías', href: `/store/${slug}/categorias` },
  { label: 'Destacados', href: '#destacados' },
  { label: 'Ofertas', href: '#ofertas' },
  { label: 'Ayuda', href: '#ayuda' },
])

export function StoreNavbar({ brand, store }: Props) {
  const variant = brand.layoutNav || 'classic'
  const navBg = brand.navBgColor || '#ffffff'
  const navText = brand.navTextColor || brand.textColor || '#0f172a'
  const primary = brand.primaryColor || '#2563eb'
  const storeHome = `/store/${store.slug}`
  const title = brand.heroTitle || store.name
  const TitleText = (textProps: any) => (
    <Link href={storeHome} style={{ textDecoration: 'none' }}>
      <Text {...textProps}>{title}</Text>
    </Link>
  )
  const navLinks = getNavLinks(store.slug)

  const searchForm = (maxW = '280px', bg = 'white', color = 'gray.800', radius = 'full') => (
    <Box as="form" action={`/store/${store.slug}/buscar`} method="get" maxW={maxW} w="100%">
      <InputGroup>
        <Input
          name="q"
          type="search"
          placeholder="Buscar producto"
          bg={bg}
          color={color}
          borderRadius={radius}
          _placeholder={{ color: 'gray.500' }}
        />
        <InputRightElement>
          <IconButton aria-label="Buscar" icon={<FiSearch />} type="submit" size="sm" variant="ghost" color={color} />
        </InputRightElement>
      </InputGroup>
    </Box>
  )

  switch (variant) {
    case 'solid-search':
      return (
        <Box bg={primary} color="white" py={3}>
          <Container maxW="6xl">
            <Flex align="center" gap={6} flexWrap="wrap">
              <HStack spacing={3} flexShrink={0}>
                {brand.logoUrl && <Box as="img" src={brand.logoUrl} alt="Logo" style={{ width: 42, height: 42, borderRadius: 8, padding: 4, background: 'white' }} />}
                <TitleText fontWeight="bold" fontSize="lg" />
              </HStack>
              <HStack spacing={4} flexWrap="wrap">
                {navLinks.map((item) => (
                  <Link key={item.href} href={item.href}>{item.label}</Link>
                ))}
              </HStack>
              <Box ml="auto" maxW="280px" w="100%">
                {searchForm('280px', 'white', 'gray.800')}
              </Box>
              <HStack spacing={3}>
                <IconButton aria-label="notificaciones" icon={<FiBell />} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} />
                <IconButton aria-label="favoritos" icon={<FiHeart />} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} />
                <IconButton aria-label="perfil" icon={<FiUser />} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} />
                <IconButton aria-label="carrito" icon={<FiShoppingBag />} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} onClick={toggleCart} />
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
                {brand.logoUrl && <Box as="img" src={brand.logoUrl} alt="Logo" style={{ width: 40, height: 40, borderRadius: 8 }} />}
                <TitleText fontWeight="bold" fontSize="lg" />
              </HStack>
              <HStack spacing={4}>
                {navLinks.map((item) => (
                  <Link key={item.href} href={item.href}>{item.label}</Link>
                ))}
              </HStack>
              <Box ml="auto" maxW="260px" w="100%">{searchForm('260px')}</Box>
              <HStack spacing={3}>
                <IconButton aria-label="favoritos" icon={<FiHeart />} variant="ghost" />
                <IconButton aria-label="perfil" icon={<FiUser />} variant="ghost" />
                <IconButton aria-label="carrito" icon={<FiShoppingBag />} variant="ghost" onClick={toggleCart} />
              </HStack>
            </Flex>
          </Container>
        </Box>
      )
    case 'two-row':
      return (
        <Box bg="#f8fafc" color={navText}>
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
                {brand.logoUrl && <Box as="img" src={brand.logoUrl} alt="Logo" style={{ width: 40, height: 40, borderRadius: 8 }} />}
                <TitleText fontWeight="bold" fontSize="lg" />
              </HStack>
              <Button variant="outline" size="sm" leftIcon={<FiSearch />}>Categorías</Button>
              <Box flex="1" minW="220px" maxW="360px">{searchForm('100%')}</Box>
              <HStack spacing={2}>
                <Button size="sm" variant="ghost">Iniciar sesión</Button>
                <Button size="sm" variant="outline">Wishlist</Button>
                <Button size="sm" variant="outline" leftIcon={<FiShoppingBag />} onClick={toggleCart}>Carrito</Button>
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
        <Box bg="white" borderBottom="1px solid #e5e7eb" color={navText}>
          <Container maxW="6xl" py={4}>
            <Flex align="center" gap={5} flexWrap="wrap">
              <HStack spacing={3} flexShrink={0}>
                {brand.logoUrl && <Box as="img" src={brand.logoUrl} alt="Logo" style={{ width: 40, height: 40, borderRadius: 8 }} />}
                <TitleText fontWeight="bold" fontSize="lg" />
              </HStack>
              <Button size="sm" variant="ghost" leftIcon={<FiMenu />}>Categorías</Button>
              <Box maxW="360px" flex="1">{searchForm('100%')}</Box>
              <HStack spacing={4}>
                <Text fontSize="sm">Órdenes</Text>
                <FiHeart />
                <IconButton aria-label="Carrito" icon={<FiShoppingBag />} size="sm" variant="ghost" onClick={toggleCart} />
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
                {brand.logoUrl && <Box as="img" src={brand.logoUrl} alt="Logo" style={{ width: 40, height: 40, borderRadius: 8, background: 'white', padding: 4 }} />}
                <TitleText fontWeight="bold" fontSize="lg" />
              </HStack>
              <Button size="sm" variant="outline" color="white" borderColor="whiteAlpha.500" leftIcon={<FiGlobe />}>
                Estados Unidos
              </Button>
              <Box maxW="360px" flex="1">{searchForm('100%', 'white', 'gray.800')}</Box>
              <HStack spacing={4}>
                <HStack spacing={1}><FiHeart /><Text fontSize="sm">Guardados</Text></HStack>
                <HStack spacing={1}><FiUser /><Text fontSize="sm">Cuenta</Text></HStack>
                <HStack spacing={1} cursor="pointer" onClick={toggleCart}><FiShoppingBag /><Text fontSize="sm">Carrito</Text></HStack>
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
              <TitleText fontWeight="bold" fontSize="lg" />
              <HStack spacing={4}>
                {navLinks.map((item) => (
                  <Link key={item.href} href={item.href}>{item.label}</Link>
                ))}
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
                {brand.logoUrl && <Box as="img" src={brand.logoUrl} alt="Logo" style={{ width: 40, height: 40, borderRadius: 8 }} />}
                <TitleText fontWeight="bold" fontSize="lg" />
              </HStack>
              <HStack spacing={4}>
                {navLinks.map((item) => (
                  <Link key={item.href} href={item.href}>{item.label}</Link>
                ))}
                <Button as={Link} href="#catalogo" bg={primary} color="white" size="sm" _hover={{ bg: primary }}>{brand.heroCta || 'Ver catálogo'}</Button>
              </HStack>
            </Flex>
          </Container>
        </Box>
      )
  }
}
