import { Box, Button, Container, Flex, Heading, HStack, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react'
import Head from 'next/head'
import Link from 'next/link'

export default function Landing() {
  return (
    <>
      <Head>
        <title>MerchantOS | Crea tu tienda en minutos</title>
        <meta name="description" content="MerchantOS: lanza tu catálogo, gestiona productos y comparte tu tienda en minutos. Sin código, con Supabase y un demo listo para ver." />
      </Head>

      <Box bgGradient="linear(to-b, gray.900, gray.800)" color="white" minH="100vh" pb={0}>
        <Container maxW="6xl" pt={16} pb={12}>
          <Flex direction={{ base: 'column', md: 'row' }} align="center" gap={10}>
            <VStack align="start" spacing={6} flex="1">
              <Button size="sm" colorScheme="purple" variant="outline" rounded="full">
                SaaS multi‑tienda
              </Button>
              <Heading as="h1" size="2xl" lineHeight="1.1">
                MerchantOS: crea tu tienda, carga tus productos y vende en minutos.
              </Heading>
              <Text fontSize="lg" color="gray.200">
                Registro rápido, catálogo privado por defecto y demo pública para que veas cómo se ve. Sin código, con Supabase y panel listo para tu equipo.
              </Text>
              <HStack spacing={4}>
                <Button as={Link} href="/admin/signup" colorScheme="blue" size="lg">
                  Crear mi tienda
                </Button>
                <Button as={Link} href="/demo" variant="outline" colorScheme="whiteAlpha" size="lg">
                  Ver demo
                </Button>
              </HStack>
              <HStack spacing={8} color="gray.300">
                <Text>✓ Multi‑usuario con roles</Text>
                <Text>✓ Catálogo y precios por cantidad</Text>
                <Text>✓ Imágenes seguras en Supabase</Text>
              </HStack>
            </VStack>
            <Box flex="1" w="full" bg="whiteAlpha.100" borderWidth="1px" borderColor="whiteAlpha.200" rounded="2xl" p={6} shadow="2xl">
              <Heading size="md" mb={4}>Así se ve tu panel</Heading>
              <SimpleGrid columns={2} spacing={4}>
                <FeatureCard title="Categorías" desc="Organiza tu catálogo y publícalo cuando esté listo." />
                <FeatureCard title="Productos" desc="Galería, precios por rango y metadatos personalizables." />
                <FeatureCard title="Medios" desc="Sube imágenes a un bucket privado por tienda." />
                <FeatureCard title="Roles" desc="Owner, admin y editor con RLS en Supabase." />
              </SimpleGrid>
              <Button as={Link} href="/admin/login" mt={6} w="full" colorScheme="blue">
                Entrar al panel
              </Button>
            </Box>
          </Flex>
        </Container>

        <Container maxW="6xl">
          <Stack spacing={12}>
            <Section
              title="Onboarding rápido"
              body="Crea tu cuenta, define el nombre y slug de tu tienda y listo. Te damos un demo para inspirarte y RLS para proteger tus datos."
            />
            <Section
              title="Catálogo público o privado"
              body="Publica cuando quieras. Los productos y categorías usan permisos por tienda, y las imágenes se firman con URLs seguras."
            />
            <Section
              title="Demo accesible"
              body="Visita el demo para ver cómo se verá tu tienda. Todo separado por store slug para que puedas experimentar sin afectar tus datos."
              cta={{ label: 'Abrir demo', href: '/demo' }}
            />
          </Stack>
        </Container>

        <Box bg="gray.900" mt={20} pt={10} pb={12} borderTop="1px solid rgba(255,255,255,0.08)">
          <Container maxW="6xl">
            <Flex direction={{ base: 'column', md: 'row' }} gap={10} mb={8}>
              <Box flex="1">
                <Heading size="md" mb={3}>MerchantOS: crea tu tienda en minutos</Heading>
                <Text color="gray.300" maxW="sm">
                  SaaS multi‑tienda con catálogos separados, RLS en Supabase y demo pública para iterar sin riesgo.
                </Text>
              </Box>
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} flex="1">
                <FooterLink href="/demo" label="Ver demo" />
                <FooterLink href="/admin/login" label="Entrar al panel" />
                <FooterLink href="/admin/signup" label="Crear tienda" />
                <FooterLink href="/store/testdemo2" label="Ejemplo de tienda" />
                <FooterLink href="/store/testdemo2/categorias" label="Categorías demo" />
                <FooterLink href="/store/testdemo2/producto/testproduct" label="Producto demo" />
              </SimpleGrid>
            </Flex>
            <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3}>
              <Text color="gray.400" fontSize="sm">© {new Date().getFullYear()} MerchantOS. Todos los derechos reservados.</Text>
              <HStack spacing={4} color="gray.400" fontSize="sm">
                <Link href="/demo">Demo</Link>
                <Link href="/store/testdemo2">Tienda</Link>
                <Link href="/store/testdemo2/categorias">Categorías</Link>
              </HStack>
            </Flex>
          </Container>
        </Box>
      </Box>
    </>
  )
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <Box bg="whiteAlpha.100" borderWidth="1px" borderColor="whiteAlpha.200" rounded="lg" p={4}>
      <Heading size="sm" mb={2}>{title}</Heading>
      <Text fontSize="sm" color="gray.200">{desc}</Text>
    </Box>
  )
}

function Section({ title, body, cta }: { title: string; body: string; cta?: { label: string; href: string } }) {
  return (
    <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'start', md: 'center' }} gap={6}>
      <Box flex="1">
        <Heading size="lg" mb={3}>{title}</Heading>
        <Text color="gray.200" fontSize="md">{body}</Text>
      </Box>
      {cta && (
        <Button as={Link} href={cta.href} colorScheme="blue" size="md">
          {cta.label}
        </Button>
      )}
    </Flex>
  )
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Button as={Link} href={href} variant="ghost" justifyContent="flex-start" colorScheme="whiteAlpha" size="sm">
      {label}
    </Button>
  )
}
