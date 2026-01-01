'use client';

import {
  Box,
  VStack,
  Image,
  Text,
  Icon,
  Button,
  HStack,
  Link,
} from '@chakra-ui/react';
import { FaBitcoin, FaFacebook, FaInstagram, FaTiktok, FaYoutube, FaWhatsapp, FaDownload } from 'react-icons/fa';
import { SiTether, SiLitecoin } from 'react-icons/si';
import { MdOutlinePayments } from 'react-icons/md';

export default function ReyDelHumoLanding() {
  return (
    <Box
    bgImage="url('/bg.png')" // <-- tu imagen de fondo
    bgSize="cover"
    bgPosition="center"
    bgRepeat="no-repeat"
    minH="100vh"
    color="white"
    textAlign="center"
    py={6}
    px={4}
    fontFamily="heading"
    position="relative"
    _before={{
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bg: 'linear-gradient(to-b, rgba(0,0,0,0.7), rgba(0,0,0,0.9))', // overlay oscuro
      zIndex: 0,
    }}
  >
    

      
  
      <Text fontSize="lg" color="blackAlpha.800" fontWeight="bold" mt={2}>
        ACEPTAMOS PAGOS CON
      </Text>

      {/* Iconos de pago */}
      <HStack spacing={6} justify="center" mt={4}>
        <Icon as={FaBitcoin} boxSize={20} color="orange.400" />
        <Icon as={MdOutlinePayments} boxSize={20} color="white" />
        <Icon as={SiTether} boxSize={20} color="green.400" />
      </HStack>

      {/* Redes sociales */}
      <Text fontSize="md" mt={10}color="blackAlpha.800" fontWeight="bold">
  SÍGUENOS EN NUESTRAS REDES SOCIALES
</Text>

<Box
  mt={4}
  display="grid"
  gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
  gap={3}
  maxW="md"
  mx="auto"
>
  <SocialCard icon={FaFacebook} label="FACEBOOK RDH" link="#" />
  <SocialCard icon={FaTiktok} label="TIKTOK RDH" link="#" />
  <SocialCard icon={FaInstagram} label="INSTAGRAM RDH" link="#" />
  <SocialCard icon={FaYoutube} label="YOUTUBE RDH" link="#" />
</Box>

      {/* WhatsApp */}
      <Text fontSize="md" mt={10} color="cyan.300" fontWeight="bold">
        ESCRÍBENOS Y HAZ TU PEDIDO POR WHATSAPP
      </Text>
      <Button
        leftIcon={<FaWhatsapp />}
        colorScheme="purple"
        variant="solid"
        size="lg"
        mt={4}
        px={8}
        as={Link}
        href="https://wa.me/524423816049"
        target="_blank"
      >
        QRO: 442-381-6049
      </Button>
      
      {/* Descargar catálogo */}
<Text fontSize="md" mt={8} color="#00f6ff" fontWeight="bold">
  DESCARGA NUESTRO CATÁLOGO DIGITAL
</Text>
<Button
  leftIcon={<FaDownload />}
  colorScheme="purple"
  variant="solid"
  size="lg"
  mt={4}
  px={8}
  as={Link}
  href="/catalogo.pdf"
  download
>
  <Text fontWeight="bold" color="#00f6ff">
    DESCARGAR CATÁLOGO
  </Text>
</Button>


      <Text fontSize="xs" mt={4} color="gray.400">
        ESTAMOS DISPONIBLES TODOS LOS DÍAS DE 9:00 AM A 8:00PM.
      </Text>
    </Box>
  );
}

// Botón reutilizable para redes sociales
function SocialCard({
    icon,
    label,
    link,
  }: {
    icon: any;
    label: string;
    link: string;
  }) {
    return (
      <Link
        href={link}
        target="_blank"
        _hover={{ textDecoration: 'none' }}
      >
        <HStack
          bg="purple.500"
          color="white"
          px={4}
          py={3}
          borderRadius="md"
          justify="space-between"
          transition="all 0.2s"
          _hover={{ bg: 'purple.600' }}
        >
          <HStack spacing={3}>
            <Icon as={icon} boxSize={5} />
            <Text fontWeight="bold" fontSize="sm" color="#00f6ff">
              {label}
            </Text>
          </HStack>
          <Text fontSize="xl" color="white" fontWeight="bold">
            →
          </Text>
        </HStack>
      </Link>
    );
  }
  