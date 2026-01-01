'use client';

import { Box, Text, Flex, Icon } from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

type Props = { category: Category; basePath?: string }

const CategoryCard = ({ category, basePath = '/categoria' }: Props) => {
  return (
    <Link href={`${basePath}/${category.slug}`} passHref>
      <Box
        as="a"
        position="relative"
        h={{ base: "170px", md:"300px" }}
        w="full"
        overflow="hidden"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="black"
        _hover={{ opacity: 0.92 }}
      >
        {/* Imagen de fondo */}
        <Box
          position="absolute"
          top={0}
          left={0}
          w="full"
          h="full"
          bgImage={`url(${category.imageUrl || '/placeholder.png'})`}
          bgSize="cover"
          bgPosition="center"
          filter="brightness(0.55)"
        />

        {/* Título */}
        <Text
          zIndex={1}
          fontSize={{ base: "2xl", md:"5xl"}}
          fontWeight="extrabold"
          color="white"
          textAlign="center"
          textTransform="uppercase"
          letterSpacing="wide"
          textShadow="0 0 4px #00f6ff, 0 0 8px #00f6ff"
          px={6}
        >
          {category.name}
        </Text>

        {/* Flecha derecha */}
        <Flex
          position="absolute"
          right={4}
          top="50%"
          transform="translateY(-50%)"
          zIndex={1}
        >
          <Icon as={ChevronRightIcon} boxSize={7} color="#00f6ff" />
        </Flex>
      </Box>
    </Link>
  );
};

export default CategoryCard;
