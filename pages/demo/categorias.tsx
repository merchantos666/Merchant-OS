import {
  Box,
  Text,
  Image,
  Container,
  Flex,
  VStack,
} from '@chakra-ui/react';
import Head from 'next/head';
import CategoryCard from '@/components/CategoryCard';
import { GetServerSideProps } from 'next';
import fs from 'fs';
import path from 'path';

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const host = req.headers.host;
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const res = await fetch(`${protocol}://${host}/api/categorias`);

    if (!res.ok) throw new Error('Failed to fetch categories');

    const categories = await res.json();

    const heroesPath = path.join(process.cwd(), 'public/category-heroes');

    const categoriesWithImages = categories.map((cat: any) => {
      const slug = cat.slug;
      const jpgPath = path.join(heroesPath, `${slug}.jpg`);
      const pngPath = path.join(heroesPath, `${slug}.png`);

      const imageUrl = fs.existsSync(pngPath)
        ? `/category-heroes/${slug}.png`
        : fs.existsSync(jpgPath)
        ? `/category-heroes/${slug}.jpg`
        : '/placeholder.png';

      return {
        ...cat,
        imageUrl,
      };
    });

    return { props: { categories: categoriesWithImages } };
  } catch (error) {
    console.error('❌ Error en getServerSideProps /demo/categorias:', error);
    return { props: { categories: [] } };
  }
};

export default function DemoCategorias({ categories }: any) {
  return (
    <>
      <Head>
        <title>Categorías | Demo Store</title>
        <meta
          name="description"
          content="Explora las categorías de la Demo Store."
        />
      </Head>

      <Container px={0} mt={0} maxW="100%" py={0} id="categorias">
        <Flex
          bg="black"
          color="white"
          align="center"
          justify="space-between"
          px={4}
          py={6}
          w="full"
        >
          <Box ml={12}>
            <Text
              fontSize="3xl"
              fontWeight="extrabold"
              lineHeight="short"
              textShadow="0 0 8px #00f6ff, 0 0 16px #00f6ff"
              color="#00f6ff"
            >
              DEMO <br /> STORE
            </Text>
            <Text fontSize="sm" mt={2} color="purple.400" fontWeight="semibold">
              Selecciona una categoría
            </Text>
          </Box>

          <Box textAlign="center">
            <Image
              src="/catalogo-tactil-icon.png"
              alt="Catálogo táctil"
              boxSize="50px"
              mx="auto"
            />
            <Text fontSize="xs" mt={2} fontWeight="bold" color="white">
              CATÁLOGO TÁCTIL
            </Text>
          </Box>
        </Flex>

        <VStack spacing={0} align="stretch">
          {categories.map((cat: any) => (
            <CategoryCard key={cat.id} category={cat} basePath="/demo/categoria" />
          ))}
        </VStack>
      </Container>
    </>
  );
}
