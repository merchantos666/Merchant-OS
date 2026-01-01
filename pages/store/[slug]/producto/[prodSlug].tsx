import {
  Box,
  Heading,
  Text,
  Image,
  Stack,
  Divider,
  List,
  ListItem,
  Container,
  Badge,
  HStack,
  Icon,
  IconButton,
  Button,
  Tag,
  TagLabel,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import { useMemo, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { FaClock, FaFireAlt, FaMinus, FaPlus, FaShieldAlt } from 'react-icons/fa';
import { defaultBrand } from '@/lib/defaultBrand';
import { StoreNavbar } from '@/components/store/StoreNavbar';

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  const slug = params?.slug as string
  const prodSlug = params?.prodSlug as string
  const host = req.headers.host!
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`
  const cookie = req.headers.cookie || ''
  try {
    const [storeRes, prodRes] = await Promise.all([
      fetch(`${baseUrl}/api/store-page/${slug}`, { headers: { cookie } }),
      fetch(`${baseUrl}/api/productos/${prodSlug}?store=${slug}`, { headers: { cookie } }),
    ])
    if (!storeRes.ok || !prodRes.ok) return { notFound: true }
    const store = await storeRes.json()
    const product = await prodRes.json()
    const makeAbs = (u: string | null | undefined) => (u && u.startsWith('/') ? `${baseUrl}${u}` : u);
    product.imageUrl = makeAbs(product.imageUrl) || null
    product.secondaryImageUrl = makeAbs(product.secondaryImageUrl) || null
    return { props: { product, store } };
  } catch (error) {
    console.error('❌ Error al obtener producto:', error);
    return { notFound: true };
  }
};

type PricingTier = {
  id: string;
  minQty?: number | null;
  maxQty?: number | null;
  price: number;
};

export default function StoreProductPage({ product, store }: any) {
  const cardBg = useColorModeValue('#0f0f12', '#0f0f12');
  const panelBg = useColorModeValue('white', 'gray.800');
  const brand = { ...defaultBrand, ...(store?.brand || {}) };
  const footerCopy = brand.footerText || `© ${new Date().getFullYear()} ${store?.name || ''}. Todos los derechos reservados.`;
  const productLayout = brand.layoutProductPage || 'classic';

  const { addToCart } = useCart();
  const [qty, setQty] = useState<number>(1);

  const unitPrice: number = useMemo(() => {
    const tiers: PricingTier[] = product?.pricingTiers || [];
    if (!tiers.length) return 0;
    const found =
      tiers.find((t) => {
        const min = t.minQty ?? 1;
        const max = t.maxQty ?? Infinity;
        return qty >= min && qty <= max;
      }) ||
      [...tiers].sort((a, b) => (a.minQty ?? 0) - (b.minQty ?? 0)).pop();

    return found ? found.price : tiers[0].price;
  }, [product?.pricingTiers, qty]);

  const total = useMemo(() => unitPrice * qty, [unitPrice, qty]);

  const handleAdd = () => setQty((q) => Math.min(999, q + 1));
  const handleSub = () => setQty((q) => Math.max(1, q - 1));

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: unitPrice,
      quantity: qty,
    });
  };

  const categoryName = product?.category?.name?.toUpperCase?.() || 'PRODUCTO';

  const renderClassic = () => (
    <Box bg="#0a0a0c" minH="100vh" display="flex" flexDirection="column">
      <StoreNavbar brand={brand} store={store} />
      <Box as="main" flex="1" py={{ base: 6, md: 10 }}>
        <Container maxW="6xl">
          <Box bg="black" color="white" borderRadius="lg" p={4} mb={4}>
            <Text fontWeight="bold">{store?.name}</Text>
          </Box>
          <Box
            bg={cardBg}
            borderRadius="2xl"
            overflow="hidden"
            position="relative"
            shadow="xl"
          >
            <Badge
              color="white"
              bg="#1f1f25"
              borderRadius="full"
              px={4}
              py={2}
              position="absolute"
              top={4}
              left={4}
              fontWeight="bold"
              letterSpacing="wide"
              textTransform="uppercase"
            >
              {categoryName}
            </Badge>

            {product?.badgeUrl && (
              <Image
                src={product.badgeUrl}
                alt="Sello"
                position="absolute"
                top={4}
                right={4}
                boxSize={{ base: '64px', md: '80px' }}
              />
            )}

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={0}>
              <Box p={{ base: 5, md: 8 }} display="grid" gap={4}>
                {product.imageUrl && (
                  <Box
                    bg="#18181c"
                    borderRadius="xl"
                    p={3}
                    overflow="hidden"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width="100%"
                      maxH="420px"
                      objectFit="cover"
                      borderRadius="lg"
                    />
                  </Box>
                )}

                {product.secondaryImageUrl && (
                  <Box
                    bg="#18181c"
                    borderRadius="xl"
                    p={3}
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    <Image
                      src={product.secondaryImageUrl}
                      alt={`${product.name} detalle`}
                      width="100%"
                      objectFit="cover"
                      borderRadius="lg"
                    />
                  </Box>
                )}
              </Box>

              <Box
                bg={panelBg}
                borderLeft={{ base: 'none', md: '1px solid' }}
                borderTop={{ base: '1px solid', md: 'none' }}
                borderColor="blackAlpha.200"
                p={{ base: 5, md: 8 }}
              >
                <Stack spacing={4}>
                  <Heading
                    size="lg"
                    color="#00f6ff"
                    textShadow="0 0 10px rgba(0,246,255,.6)"
                  >
                    {product.name}
                  </Heading>

                  {product.description && (
                    <Box>
                      <Text fontWeight="bold" mb={1}>
                        Descripción:
                      </Text>
                      <Text color="gray.700">{product.description}</Text>
                    </Box>
                  )}

                  <Divider />

                  <Stack direction="row" spacing={4} align="center">
                    <HStack>
                      <Icon as={FaClock} color="gray.500" />
                      <Text color="gray.600">
                        {product.durationSeconds ? `${product.durationSeconds}s` : 'Duración no especificada'}
                      </Text>
                    </HStack>
                    {product.ignitionMethod && (
                      <HStack>
                        <Icon as={FaFireAlt} color="orange.400" />
                        <Text color="gray.600">{product.ignitionMethod}</Text>
                      </HStack>
                    )}
                  </Stack>

                  {product.colorsAvailable?.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Colores disponibles:
                      </Text>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        {product.colorsAvailable.map((color: string) => (
                          <Tag key={color} variant="subtle" colorScheme="cyan">
                            <TagLabel>{color}</TagLabel>
                          </Tag>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {product.ageRestriction && (
                    <HStack color="red.500">
                      <Icon as={FaShieldAlt} />
                      <Text fontWeight="semibold">{product.ageRestriction}</Text>
                    </HStack>
                  )}

                  <Divider />

                  <Stack direction="row" align="center" spacing={4}>
                    <IconButton aria-label="Restar" icon={<FaMinus />} onClick={handleSub} />
                    <Text fontSize="xl" fontWeight="bold">
                      {qty}
                    </Text>
                    <IconButton aria-label="Sumar" icon={<FaPlus />} onClick={handleAdd} />
                  </Stack>

                  <Stack direction="row" align="center" spacing={4}>
                    <Text fontSize="2xl" fontWeight="bold">
                      ${unitPrice.toFixed(2)}
                    </Text>
                    <Text color="gray.600">Total: ${total.toFixed(2)}</Text>
                  </Stack>

                  <List spacing={2} color="gray.600">
                    {product.features?.map((feature: string, idx: number) => (
                      <ListItem key={idx}>• {feature}</ListItem>
                    ))}
                  </List>

                  <Button colorScheme="teal" size="lg" onClick={handleAddToCart}>
                    Agregar al carrito
                  </Button>
                </Stack>
              </Box>
            </SimpleGrid>
          </Box>
        </Container>
      </Box>
      <Box as="footer" bg="#0a0a0c" color="gray.300" borderTop="1px solid rgba(255,255,255,0.08)" py={6}>
        <Container maxW="6xl">
          <Text fontWeight="bold" color="white">{store?.name}</Text>
          <Text fontSize="sm" color="gray.400">{footerCopy}</Text>
        </Container>
      </Box>
    </Box>
  );

  const renderShowcase = () => (
    <Box bg="#f5f7fb" minH="100vh" display="flex" flexDirection="column">
      <StoreNavbar brand={brand} store={store} />
      <Box as="main" flex="1" py={{ base: 6, md: 10 }}>
        <Container maxW="7xl">
          <VStack spacing={2} align="center" mb={6}>
            <Text fontSize="sm" color="gray.500" letterSpacing="widest">{categoryName}</Text>
            <Heading size="2xl" color={textColor} textAlign="center" textTransform="uppercase">
              {product.name}
            </Heading>
          </VStack>
          <SimpleGrid columns={{ base: 1, md: 12 }} gap={6} alignItems="stretch">
            <Box gridColumn={{ base: '1 / -1', md: '1 / span 7' }}>
              <Box bg="white" borderRadius="lg" border="1px solid #e5e7eb" overflow="hidden" shadow="sm">
                {product.imageUrl && (
                  <Image src={product.imageUrl} alt={product.name} w="100%" h={{ base: 'auto', md: '460px' }} objectFit="cover" />
                )}
              </Box>
            </Box>
            <Box
              gridColumn={{ base: '1 / -1', md: 'span 5 / -1' }}
              bg="white"
              borderRadius="lg"
              border="1px solid #e5e7eb"
              p={{ base: 4, md: 6 }}
              shadow="sm"
            >
              <Stack spacing={4}>
                <HStack justify="space-between">
                  <Text fontWeight="bold" textTransform="uppercase" color="gray.600">{product.brand || 'Producto'}</Text>
                  <Badge colorScheme="yellow">Nuevo</Badge>
                </HStack>
                <Heading size="lg" color={textColor}>{product.name}</Heading>
                {product.description && <Text color="gray.700">{product.description}</Text>}
                <Divider />
                <Text fontSize="3xl" fontWeight="bold" color={textColor}>{`$${unitPrice.toFixed(2)}`}</Text>
                <Stack direction="row" spacing={4} align="center">
                  <IconButton aria-label="Restar" icon={<FaMinus />} onClick={handleSub} />
                  <Text fontSize="xl" fontWeight="bold">{qty}</Text>
                  <IconButton aria-label="Sumar" icon={<FaPlus />} onClick={handleAdd} />
                  <Text color="gray.500">Total: ${total.toFixed(2)}</Text>
                </Stack>
                <Button colorScheme="blue" size="lg" onClick={handleAddToCart}>Agregar al carrito</Button>
                {product.colorsAvailable?.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Colores</Text>
                    <Stack direction="row" spacing={2}>
                      {product.colorsAvailable.map((c: string) => (
                        <Tag key={c} variant="subtle" colorScheme="cyan"><TagLabel>{c}</TagLabel></Tag>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>
      <Box as="footer" bg="#e2e8f0" color="gray.700" borderTop="1px solid #cbd5e1" py={6}>
        <Container maxW="7xl">
          <Text fontWeight="bold">{store?.name}</Text>
          <Text fontSize="sm" color="gray.600">{footerCopy}</Text>
        </Container>
      </Box>
    </Box>
  )

  if (productLayout === 'showcase') {
    return renderShowcase()
  }

  return renderClassic()
}

(StoreProductPage as any).hideLayoutFooter = true;
