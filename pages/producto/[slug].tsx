// pages/producto/[slug].tsx
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

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  try {
    const host = req.headers.host!;
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const res = await fetch(`${baseUrl}/api/productos/${params?.slug}`);
    if (!res.ok) throw new Error('Producto no encontrado');
    const product = await res.json();
    const makeAbs = (u: string | null | undefined) => (u && u.startsWith('/') ? `${baseUrl}${u}` : u);
    product.imageUrl = makeAbs(product.imageUrl) || null
    product.secondaryImageUrl = makeAbs(product.secondaryImageUrl) || null
    return { props: { product } };
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

export default function ProductPage({ product }: any) {
  const cardBg = useColorModeValue('#0f0f12', '#0f0f12');
  const panelBg = useColorModeValue('white', 'gray.800');

  const { addToCart } = useCart();
  const [qty, setQty] = useState<number>(1);

  // Obtiene el precio unitario correcto según la cantidad y los tiers
  const unitPrice: number = useMemo(() => {
    const tiers: PricingTier[] = product?.pricingTiers || [];
    if (!tiers.length) return 0;
    // Busca el tier cuyo rango contenga la qty actual
    const found =
      tiers.find((t) => {
        const min = t.minQty ?? 1;
        const max = t.maxQty ?? Infinity;
        return qty >= min && qty <= max;
      }) ||
      // Si no coincide exactamente, toma el de mayor minQty (último escalón)
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

  const categoryName =
    product?.category?.name?.toUpperCase?.() || 'PRODUCTO';

  return (
    <Box bg="#0a0a0c" minH="100vh" py={{ base: 6, md: 10 }}>
      <Container maxW="6xl">
        {/* Tarjeta principal */}
        <Box
          bg={cardBg}
          borderRadius="2xl"
          overflow="hidden"
          position="relative"
          shadow="xl"
        >
          {/* Badge de categoría */}
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

          {/* Sello (si tienes una imagen de sello) */}
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
            {/* Columna izquierda: fotos */}
            <Box p={{ base: 5, md: 8 }} display="grid" gap={4}>
              {/* Imagen grande */}
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

              {/* Si tienes una imagen secundaria o video thumbnail */}
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

            {/* Columna derecha: info */}
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

                {/* Descripción */}
                {product.description && (
                  <Box>
                    <Text fontWeight="bold" mb={1}>
                      Descripción:
                    </Text>
                    <Text color="gray.700">{product.description}</Text>
                  </Box>
                )}

                {/* Specs con iconos */}
                <HStack spacing={6} wrap="wrap">
                  {product.ignitionMethod && (
                    <Tag size="lg" variant="subtle" colorScheme="purple" borderRadius="full">
                      <Icon as={FaFireAlt} mr={2} />
                      <TagLabel>Encendido: {product.ignitionMethod}</TagLabel>
                    </Tag>
                  )}
                  {product.durationSeconds !== null && (
                    <Tag size="lg" variant="subtle" colorScheme="cyan" borderRadius="full">
                      <Icon as={FaClock} mr={2} />
                      <TagLabel>Duración: {product.durationSeconds} seg</TagLabel>
                    </Tag>
                  )}
                  {product.forOutdoorUse !== null && (
                    <Tag
                      size="lg"
                      variant="subtle"
                      colorScheme={product.forOutdoorUse ? 'green' : 'orange'}
                      borderRadius="full"
                    >
                      <Icon as={FaShieldAlt} mr={2} />
                      <TagLabel>Uso exterior: {product.forOutdoorUse ? 'Sí' : 'No'}</TagLabel>
                    </Tag>
                  )}
                </HStack>

                {/* Colores disponibles */}
                {product.colorsAvailable?.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Colores disponibles:
                    </Text>
                    <HStack spacing={2} wrap="wrap">
                      {product.colorsAvailable.map((c: string) => (
                        <Tag key={c} size="md" borderRadius="full" variant="solid" bg="#1f1f25" color="white">
                          {c}
                        </Tag>
                      ))}
                    </HStack>
                  </Box>
                )}

                {/* Lista metadata extra */}
                {product.metadata && Object.keys(product.metadata).length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={1}>
                      Especificaciones:
                    </Text>
                    <List spacing={1}>
                      {Object.keys(product.metadata).map((key) => (
                        <ListItem key={key}>
                          <b>{key}:</b> {String(product.metadata[key])}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                <Divider />

                {/* Precios por tramos */}
                {product.pricingTiers?.length > 0 && (
                  <Box>
                    <Heading size="sm" mb={2}>
                      Precios por cantidad
                    </Heading>
                    <List spacing={1}>
                      {product.pricingTiers.map((tier: PricingTier) => (
                        <ListItem key={tier.id}>
                          <Text>
                            {tier.minQty ?? 1}
                            {tier.maxQty ? `–${tier.maxQty}` : '+'}: ${tier.price.toFixed(2)} c/u
                          </Text>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Selector de cantidad + total + agregar */}
                <Box
                  border="1px solid"
                  borderColor="blackAlpha.200"
                  borderRadius="lg"
                  p={4}
                  bg={useColorModeValue('white', 'gray.900')}
                >
                  <HStack justify="space-between" align="center" mb={3}>
                    <Text fontWeight="bold">Cantidad</Text>
                    <HStack>
                      <IconButton
                        aria-label="Disminuir"
                        icon={<FaMinus />}
                        size="sm"
                        onClick={handleSub}
                        variant="outline"
                      />
                      <Text w="40px" textAlign="center" fontWeight="bold">
                        {qty}
                      </Text>
                      <IconButton
                        aria-label="Aumentar"
                        icon={<FaPlus />}
                        size="sm"
                        onClick={handleAdd}
                        variant="outline"
                      />
                    </HStack>
                  </HStack>

                  <HStack justify="space-between" mb={2}>
                    <Text color="gray.600">Precio unitario</Text>
                    <Text fontWeight="bold">${unitPrice.toFixed(2)}</Text>
                  </HStack>

                  <HStack justify="space-between" mb={4}>
                    <Text color="gray.600">Total</Text>
                    <Text fontWeight="extrabold" fontSize="xl">
                      ${total.toFixed(2)}
                    </Text>
                  </HStack>

                  <Button
                    w="full"
                    size="lg"
                    colorScheme="purple"
                    onClick={handleAddToCart}
                  >
                    Agregar al carrito
                  </Button>
                </Box>

                {/* Etiquetas finales tipo “Para uso exterior · +18” */}
                <HStack spacing={3} pt={2}>
                  {product.forOutdoorUse && (
                    <Tag borderRadius="full" bg="#101018" color="white">
                      PARA USO EXTERIOR
                    </Tag>
                  )}
                  {product.ageRestriction && (
                    <Tag borderRadius="full" bg="#101018" color="white">
                      {product.ageRestriction}
                    </Tag>
                  )}
                </HStack>
              </Stack>
            </Box>
          </SimpleGrid>
        </Box>
      </Container>
    </Box>
  );
}
