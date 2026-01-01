import Head from 'next/head'
import { LandingPage } from '@/components/store/LandingTemplates'
import { defaultBrand } from '@/lib/defaultBrand'

const demoCategories = [
  { id: 'cat-1', name: 'Streetwear', slug: 'streetwear', description: 'Prendas urbanas listas para destacar.', imageUrl: '/bg.png' },
  { id: 'cat-2', name: 'Sneakers', slug: 'sneakers', description: 'Modelos icónicos y ediciones limitadas.', imageUrl: '/bg.png' },
  { id: 'cat-3', name: 'Accesorios', slug: 'accesorios', description: 'Complementos para cerrar tu outfit.', imageUrl: '/bg.png' },
]

const demoBest = [
  { id: 'best-1', name: 'Yeezy 350 V2', slug: 'yeezy-350', description: 'Edición de ejemplo', imageUrl: '/bg.png', price: 1850 },
  { id: 'best-2', name: 'Air Jordan 1 Retro', slug: 'aj1', description: 'Colorway clásico', imageUrl: '/bg.png', price: 1450 },
  { id: 'best-3', name: 'New Balance 550', slug: 'nb550', description: 'Estética retro', imageUrl: '/bg.png', price: 980 },
]

export default function DemoHome() {
  const brand = {
    ...defaultBrand,
    heroTitle: 'Store test',
    heroSubtitle: 'Catálogo de ejemplo listo para explorar.',
    heroCta: 'Ver catálogo',
    heroBg: '/bg.png',
    layoutNav: 'solid-search',
    layoutHero: 'classic',
    layoutCategories: 'grid',
    layoutBestsellers: 'grid',
    bestsellersTitle: 'Bestsellers',
  }

  const store = { name: 'Demo Store', slug: 'demo' }

  return (
    <>
      <Head>
        <title>Demo Store | Plantilla</title>
        <meta name="description" content="Explora la demo de nuestra plantilla de tienda." />
      </Head>
      <LandingPage brand={brand} store={store} categories={demoCategories} bestSellers={demoBest} />
    </>
  )
}
