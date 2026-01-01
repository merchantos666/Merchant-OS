// components/Layout.tsx
import {
  Box,
  Container,
  Text,
  IconButton,
  VStack,
  Button,
  Badge,
  useOutsideClick,
  Link as ChakraLink,
  usePrefersReducedMotion,
  useColorModeValue,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerFooter,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { FaTrash } from 'react-icons/fa';
import { FiMessageCircle, FiShoppingBag, FiX, FiPlus, FiMinus, FiCreditCard, FiDollarSign } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { useEffect, useRef, useState, useCallback } from 'react';

const NEON = '#e060ff';

type LayoutProps = {
  children: React.ReactNode
  showStoreUi?: boolean
  menuTitle?: string
  menuHomeHref?: string
  menuCategoriesHref?: string
  footerText?: string
  hideFooter?: boolean
}

export default function Layout({
  children,
  showStoreUi = true,
  menuTitle = 'Tienda',
  menuHomeHref = '/',
  menuCategoriesHref = '/categorias',
  footerText,
  hideFooter = false,
}: LayoutProps) {
  const { cart, removeFromCart, clearCart, updateQuantity } = useCart();
  const [openCart, setOpenCart] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const prefersReduced = usePrefersReducedMotion();
  const drawerBg = useColorModeValue('white', '#0f172a');
  const drawerText = useColorModeValue('gray.800', 'gray.100');
  const drawerSubtext = useColorModeValue('gray.600', 'gray.300');
  const promoBg = useColorModeValue('#ecf8f5', 'rgba(16,185,129,0.15)');
  const promoBorder = useColorModeValue('#c4e2d9', 'rgba(16,185,129,0.35)');
  const footerBg = useColorModeValue('#f6f8fb', '#0d111a');

  // Cerrar carrito con ESC
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpenCart(false);
    }
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  // Toggle carrito desde otros componentes (navbar)
  useEffect(() => {
    const handler = () => setOpenCart((v) => !v);
    window.addEventListener('toggle-cart', handler as any);
    return () => window.removeEventListener('toggle-cart', handler as any);
  }, []);

  const phoneNumber = '5214423816049';

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const message = cart
      .map((item) => `• ${item.name} x${item.quantity} - $${item.price * item.quantity}`)
      .join('\n');
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const whatsappMessage = encodeURIComponent(
      `Hola, quiero hacer un pedido:\n${message}\n\nTotal: $${total}`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${whatsappMessage}`, '_blank');
  };

  return (
    <Box minH="100%" display="flex" flexDirection="column" position="relative">
      {/* Main */}
      <Box as="main" flex="1">
        {children}
      </Box>

      {/* Footer */}
      {!hideFooter && (
        <Box bg="gray.100" py={6} mt={0}>
          <Container maxW="6xl" textAlign="center">
            <Text fontSize="sm">
              &copy; {new Date().getFullYear()} {footerText || menuTitle || 'Tu tienda'}. Todos los derechos reservados.
            </Text>
          </Container>
        </Box>
      )}

      {/* WhatsApp (bottom-left) */}
      {showStoreUi && (
        <IconButton
          aria-label="WhatsApp"
          icon={<FiMessageCircle />}
          colorScheme="teal"
          size="lg"
          isRound
          position="fixed"
          bottom="80px"
          left="20px"
          onClick={() => window.open(`https://wa.me/${phoneNumber}`, '_blank')}
          shadow="lg"
          zIndex={1400}
        />
      )}

      {/* Panel carrito estilo drawer */}
      <Drawer isOpen={showStoreUi && openCart} placement="right" onClose={() => setOpenCart(false)} size="md">
        <DrawerOverlay />
        <DrawerContent bg={drawerBg} color={drawerText}>
          <DrawerHeader borderBottomWidth="1px" bg={footerBg}>
            <HStack justify="space-between">
              <Text fontWeight="bold" fontSize="lg">Carrito</Text>
              <IconButton aria-label="Cerrar" size="sm" onClick={() => setOpenCart(false)} icon={<FiX />} variant="ghost" />
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            <Box bg={promoBg} border={`1px solid ${promoBorder}`} borderRadius="md" p={3} mb={4}>
              <Text fontSize="sm" color={useColorModeValue('#0f5132', 'teal.200')}>Agrega productos para envío gratis.</Text>
            </Box>
            {cart.length === 0 ? (
              <Text color={drawerSubtext} mt={4}>Tu carrito está vacío. ¡Agrega algo!</Text>
            ) : (
              <VStack align="stretch" spacing={4}>
                {cart.map((item) => (
                  <Box key={item.id} borderBottom="1px solid #e2e8f0" pb={3}>
                    <HStack align="flex-start" spacing={3}>
                      <Box w="70px" h="70px" borderRadius="md" bg="#f8fafc" border="1px solid #e2e8f0" />
                      <Box flex="1">
                        <Text fontWeight="semibold">{item.name}</Text>
                        <Text fontSize="sm" color={drawerSubtext}>Subtotal: ${(item.price * item.quantity).toFixed(2)}</Text>
                        <HStack mt={2} spacing={2}>
                          <IconButton aria-label="menos" size="sm" icon={<FiMinus />} onClick={() => updateQuantity(item.id, item.quantity - 1)} />
                          <Text>{item.quantity}</Text>
                          <IconButton aria-label="más" size="sm" icon={<FiPlus />} onClick={() => updateQuantity(item.id, item.quantity + 1)} />
                        </HStack>
                      </Box>
                      <IconButton
                        aria-label="Eliminar"
                        icon={<FaTrash />}
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                      />
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </DrawerBody>
          <Divider />
          <DrawerFooter bg={footerBg}>
            <VStack w="full" spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text color={drawerSubtext}>Subtotal</Text>
                <Text fontWeight="semibold">${cart.reduce((a, c) => a + c.price * c.quantity, 0).toFixed(2)}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text color={drawerSubtext}>Envío</Text>
                <Text fontWeight="semibold">$4.95</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="bold">Total</Text>
                <Text fontWeight="bold">${(cart.reduce((a, c) => a + c.price * c.quantity, 0) + 4.95).toFixed(2)}</Text>
              </HStack>
              <Button w="full" colorScheme="teal" onClick={handleCheckout} isDisabled={cart.length === 0} borderRadius="full">
                Finalizar compra
              </Button>
              <HStack spacing={2} justify="center">
                <IconButton aria-label="Visa" size="sm" icon={<FiCreditCard />} bg={useColorModeValue('blue.50', '#1d2a44')} color={useColorModeValue('blue.700', 'blue.200')} _hover={{ bg: useColorModeValue('blue.100', '#223154') }} />
                <IconButton aria-label="Mastercard" size="sm" icon={<FiCreditCard />} bg={useColorModeValue('orange.50', '#402715')} color={useColorModeValue('orange.700', 'orange.200')} _hover={{ bg: useColorModeValue('orange.100', '#4a2f1b') }} />
                <IconButton aria-label="Amex" size="sm" icon={<FiCreditCard />} bg={useColorModeValue('teal.50', '#12333b')} color={useColorModeValue('teal.700', 'teal.200')} _hover={{ bg: useColorModeValue('teal.100', '#18424c') }} />
                <IconButton aria-label="PayPal" size="sm" icon={<FiDollarSign />} bg={useColorModeValue('yellow.50', '#3a3417')} color={useColorModeValue('yellow.700', 'yellow.200')} _hover={{ bg: useColorModeValue('yellow.100', '#463f1e') }} />
              </HStack>
            </VStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Menú fullscreen removido */}
    </Box>
  );
}
