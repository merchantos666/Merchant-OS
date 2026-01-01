import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  LinkBox,
  LinkOverlay,
  Image,
  Badge,
  Button,
  Container,
} from '@chakra-ui/react';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import path from 'path';
import fs from 'fs';
import { getBaseUrl } from '../../../lib/getBaseUrl';

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  try {
    if (!params?.slug) return { notFound: true };
    const slug = params.slug as string;
    const baseUrl = getBaseUrl(req);

    const res = await fetch(`${baseUrl}/api/categorias/${slug}`);
    if (!res.ok) throw new Error('Failed to fetch category');
    const category = await res.json();
    const makeAbs = (u: string | null | undefined) => (u && u.startsWith('/') ? `${baseUrl}${u}` : u);
    if (category?.products?.length) {
      category.products = category.products.map((p: any) => ({
        ...p,
        imageUrl: makeAbs(p.imageUrl),
      }))
    }
    if (!category) return { notFound: true };

    const heroDir = path.join(process.cwd(), 'public/category-heroes');
    const heroImage =
      fs.existsSync(path.join(heroDir, `${slug}.png`)) ? `${slug}.png` :
      fs.existsSync(path.join(heroDir, `${slug}.jpg`)) ? `${slug}.jpg` :
      null;

    const bgDir = path.join(process.cwd(), 'public/category-backgrounds');
    const bgImage =
      fs.existsSync(path.join(bgDir, `${slug}-bg.png`)) ? `${slug}-bg.png` :
      fs.existsSync(path.join(bgDir, `${slug}-bg.jpg`)) ? `${slug}-bg.jpg` :
      null;

    return {
      props: {
        category,
        heroImage,
        bgImage,
      },
    };
  } catch (error) {
    console.error('❌ Error al cargar categoría:', error);
    return { notFound: true };
  }
};

export default function DemoCategoryPage({ category }: any) {
  return (
    <>
      <Box
        bgImage={"/bg.png"}
        bgSize="cover"
        bgPosition="center"
        bgRepeat="no-repeat"
        py={12}
        px={4}
      >
        <Container maxW="6xl" mb={6}>
          <Heading size="2xl" color="white" textShadow="0 0 12px rgba(0,0,0,0.6)">{category.name}</Heading>
          {category.description && (
            <Text color="gray.200" mt={2}>{category.description}</Text>
          )}
        </Container>

        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6} maxW="6xl" mx="auto">
          {category.products.map((product: any) => (
            <LinkBox
              key={product.id}
              bg="gray.900"
              color="white"
              p={5}
              rounded="2xl"
              shadow="xl"
              transition="all 0.3s"
              _hover={{ transform: 'scale(1.03)', shadow: '2xl' }}
            >
              <Image
                src={product.imageUrl || '/placeholder.png'}
                alt={product.name}
                mb={4}
                rounded="xl"
                objectFit="cover"
                h="200px"
                w="100%"
                fallbackSrc="/placeholder.png"
              />
              <Heading size="md" mb={2} fontFamily="Montserrat, sans-serif">
                <Link href={`/demo/producto/${product.slug}`} passHref>
                  <LinkOverlay>{product.name}</LinkOverlay>
                </Link>
              </Heading>

              {product.pricingTiers?.[0] && (
                <Badge colorScheme="green" fontSize="sm" mb={2}>
                  Desde ${product.pricingTiers[0].price}
                </Badge>
              )}

              {product.description && (
                <Text fontSize="sm" mb={2} color="gray.300">
                  {product.description}
                </Text>
              )}

              <Button
                mt={2}
                size="sm"
                colorScheme="whatsapp"
                as="a"
                href={`https://wa.me/524423816049?text=Hola!%20Estoy%20interesado%20en%20el%20producto:%20${encodeURIComponent(
                  product.name
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Pedir por WhatsApp
              </Button>
            </LinkBox>
          ))}
        </SimpleGrid>
      </Box>
    </>
  );
}
