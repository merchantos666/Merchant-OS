import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { LandingPage } from '@/components/store/LandingTemplates'

type StorePageProps = {
  store: { id: string; name: string; slug: string; plan: string; brand: any }
  categories: any[]
  bestSellers: any[]
}

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  const slug = params?.slug as string
  const host = req.headers.host
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`
  const cookie = req.headers.cookie || ''

  try {
    const [storeRes, catRes, bestRes] = await Promise.all([
      fetch(`${baseUrl}/api/store-page/${slug}`, { headers: { cookie } }),
      fetch(`${baseUrl}/api/categorias?store=${slug}`, { headers: { cookie } }),
      fetch(`${baseUrl}/api/bestsellers?store=${slug}`, { headers: { cookie } }),
    ])

    if (!storeRes.ok) return { notFound: true }
    const store = await storeRes.json()
    const categories = catRes.ok ? await catRes.json() : []
    const bestSellers = bestRes.ok ? (await bestRes.json())?.results || [] : []

    return { props: { store, categories, bestSellers } }
  } catch (error) {
    console.error('store page error', error)
    return { notFound: true }
  }
}

export default function StoreHome({ store, categories, bestSellers }: StorePageProps) {
  const brand = store.brand || {}

  return (
    <>
      <Head>
        <title>{store.name}</title>
        <meta name="description" content={brand.heroSubtitle || 'Catálogo'} />
      </Head>
      <LandingPage brand={brand} store={store} categories={categories} bestSellers={bestSellers} />
    </>
  )
}
