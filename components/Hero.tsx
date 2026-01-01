import {
  Box,
  Container,
  Stack,
  Image,
  Text,
  Button,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface HeroProps {
  title?: string;
  subtitle?: string;
  image: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  logoUrl?: string | null;
  textColor?: string;
  subtitleColor?: string;
  fontFamily?: string;
  overlayColor?: string;
}

const MotionImage = motion(Image);
const MotionText = motion(Text);

const Hero = ({
  title = 'REY DEL HUMO',
  subtitle = '',
  image,
  ctaLabel,
  onCtaClick,
  logoUrl,
  textColor = '#e060ff',
  subtitleColor,
  fontFamily,
  overlayColor = 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.75) 100%)',
}: HeroProps) => {
  return (
    <Box
      as="section"
      position="relative"
      minH="100vh"
      w="full"
      overflow="hidden"
      bg="black"
      color="white"
    >
      {/* Fondo */}
      <Image
        src={image}
        alt="Fondo principal"
        position="absolute"
        inset={0}
        w="100%"
        h="100%"
        objectFit="cover"
        zIndex={0}
      />
      {/* Overlay */}
      <Box
        position="absolute"
        inset={0}
        bg={overlayColor}
        zIndex={0}
      />

      <Container maxW="6xl" position="relative" zIndex={1} h="100%">
        <Stack
          align="center"
          justify="center"
          textAlign="center"
          spacing={6}
          minH="100vh"
        >
          {/* Logo */}
          <MotionImage
            src={logoUrl || '/logo.png'}
            alt="Logo"
            boxSize={{ base: '120px', md: '220px' }}
            objectFit="contain"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />

          {/* Título */}
          <MotionText
            fontSize={{ base: '4xl', md: '6xl' }}
            fontWeight="extrabold"
            letterSpacing="widest"
            textTransform="uppercase"
            color="transparent"
            fontFamily={fontFamily || 'inherit'}
            sx={{ WebkitTextStroke: `1.2px ${textColor}` }}
            textShadow={`
              0 0 8px ${textColor},
              0 0 16px ${textColor},
              0 0 24px ${textColor},
              0 0 32px ${textColor}aa,
              0 0 40px ${textColor}99
            `}
          >
            {title}
          </MotionText>


          {/* Subtítulo */}
          <MotionText
            fontSize={{ base: 'md', md: 'xl' }}
            fontWeight="bold"
            color={subtitleColor || textColor}
            fontFamily={fontFamily || 'inherit'}
            textShadow={`0 0 8px ${subtitleColor || textColor}`}
          >
            {subtitle}
          </MotionText>

          {ctaLabel ? (
            <Button size="lg" colorScheme="cyan" onClick={onCtaClick}>
              {ctaLabel}
            </Button>
          ) : (
            <MotionImage
              src="/botonEntrar.png"
              alt="Botón Entrar"
              w={{ base: '200px', md: '300px' }}
              cursor="pointer"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCtaClick}
            />
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default Hero;
