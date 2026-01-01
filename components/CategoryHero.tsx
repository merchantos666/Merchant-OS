// components/CategoryHero.tsx
import { Box, Heading, Text } from '@chakra-ui/react';

interface CategoryHeroProps {
  name: string;
  description?: string;
  heroImage: string;
}

const CategoryHero = ({ name, description, heroImage }: CategoryHeroProps) => {
  const imageUrl = `/category-heroes/${heroImage}`;

  return (
    <Box
      bgImage={`url(${imageUrl})`}
      bgSize="cover"
      bgPosition="center"
      py={24}
      px={6}
      textAlign="center"
      color="white"
    >
      <Heading
        as="h1"
        fontSize={{ base: '3xl', md: '5xl' }}
        fontFamily="Montserrat, sans-serif"
        fontWeight="extrabold"
        textShadow="2px 2px 6px rgba(0,0,0,0.7)"
      >
        {name}
      </Heading>
      {description && (
        <Text mt={4} fontSize="lg" textShadow="1px 1px 4px rgba(0,0,0,0.6)">
          {description}
        </Text>
      )}
    </Box>
  );
};

export default CategoryHero;
