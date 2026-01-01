import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import {
  Badge,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  Grid,
  HStack,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Divider,
  SimpleGrid,
  Select,
  Spinner,
  Heading,
  Stack,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { ArrowBackIcon, CheckIcon, RepeatIcon } from '@chakra-ui/icons'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { BrandConfig, defaultBrand } from '@/lib/defaultBrand'
import slugify from 'slugify'
import { FiGlobe, FiHeart, FiMapPin, FiPhone, FiSearch, FiShoppingCart, FiUser } from 'react-icons/fi'

type StoreRow = { id: string; name: string; slug: string; plan: string; brand: any }

export default function StoreEditPage() {
  const router = useRouter()
  const { slug } = router.query
  const supabase = useSupabaseClient()
  const session = useSession()
  const toast = useToast()

  const [store, setStore] = useState<StoreRow | null>(null)
  const [brand, setBrand] = useState<BrandConfig>(defaultBrand)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bgPreview, setBgPreview] = useState<string>(defaultBrand.heroBg)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [editingCta, setEditingCta] = useState(false)
  const [activeField, setActiveField] = useState<'title' | 'subtitle' | null>(null)
  const [basics, setBasics] = useState({ name: '', slug: '' })
  const [savingBasics, setSavingBasics] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const [categories, setCategories] = useState<Array<{ id: string; name: string; description: string | null; slug: string; imageUrl?: string | null }>>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [navSelection, setNavSelection] = useState('classic')
  const [heroSelection, setHeroSelection] = useState('classic')
  const [bestSelection, setBestSelection] = useState('')
  const [bestSellers, setBestSellers] = useState<Array<{ id: string; name: string; description: string | null; slug: string; imageUrl?: string | null; price?: number | null }>>([])
  const [loadingBest, setLoadingBest] = useState(false)
  const [catSelection, setCatSelection] = useState('')
  const [catPageSelection, setCatPageSelection] = useState('grid')
  const [routeSelection, setRouteSelection] = useState<'home' | 'categories' | 'category-products'>('home')
  const bgInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const fonts = [
    { label: 'Default', value: 'inherit' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif' },
    { label: 'Oswald', value: 'Oswald, sans-serif' },
  ]
  const navVariants = [
    { label: 'Clásico', value: 'classic' },
    { label: 'Centrado', value: 'centered' },
    { label: 'Azul con búsqueda', value: 'solid-search' },
    { label: 'Minimal con pill', value: 'minimal-pill' },
    { label: 'Doble barra', value: 'two-row' },
    { label: 'Píldora búsqueda', value: 'pill-search' },
    { label: 'Acciones sólidas', value: 'solid-actions' },
  ]
  const heroVariants = [
    { label: 'Clásico', value: 'classic' },
    { label: 'Banner', value: 'banner' },
    { label: 'Fashion', value: 'fashion' },
    { label: 'Collage', value: 'collage' },
    { label: 'Oscuro', value: 'dark-split' },
    { label: 'Producto', value: 'product-highlight' },
  ]
  const highlightVariants = [
    { label: 'Split', value: 'split' },
    { label: 'Tarjetas', value: 'cards' },
  ]
  const bestVariants = [
    { label: 'Grid', value: 'grid' },
    { label: 'Spotlight', value: 'spotlight' },
    { label: 'Carrusel', value: 'carousel' },
    { label: 'Flash Sale', value: 'flash' },
    { label: 'Signature', value: 'signature' },
  ]
  const categoryVariants = [
    { label: 'Grid', value: 'grid' },
    { label: 'Lista', value: 'list' },
    { label: 'Hero Slider', value: 'hero-slider' },
    { label: 'Dark Showcase', value: 'dark-showcase' },
  ]

  const brandForPreview = useMemo(
    () => ({
      ...defaultBrand,
      ...(brand || {}),
    }),
    [brand]
  )

  const resolveMediaUrl = useCallback(async (pathOrUrl?: string | null) => {
    if (!pathOrUrl) return null
    if (pathOrUrl.startsWith('http')) return pathOrUrl
    const { data, error } = await supabase.storage.from('product-assets').createSignedUrl(pathOrUrl, 60 * 60 * 24)
    if (error) return null
    return data?.signedUrl ?? null
  }, [supabase])

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return
    let cancelled = false
    const fetchStore = async () => {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('stores')
        .select('id, name, slug, plan, brand, created_by')
        .eq('slug', slug)
        .maybeSingle()
      if (cancelled) return
      if (fetchError || !data) {
        setError('No se encontró la tienda o no tienes acceso.')
        setLoading(false)
        return
      }
      setStore(data as StoreRow)
      setBrand({ ...defaultBrand, ...(data.brand || {}) })
      setBasics({ name: data.name || '', slug: data.slug || '' })
      setLoading(false)
    }
    fetchStore()
    return () => {
      cancelled = true
    }
  }, [slug, supabase, router])

  useEffect(() => {
    if (brand?.layoutNav) {
      setNavSelection(brand.layoutNav)
    }
    if (brand?.layoutHero) {
      setHeroSelection(brand.layoutHero)
    }
    if (brand?.layoutBestsellers) {
      setBestSelection(brand.layoutBestsellers)
    }
    if (brand?.layoutCategories) {
      setCatSelection(brand.layoutCategories)
    }
    if (brand?.layoutCategoriesPage) {
      setCatPageSelection(brand.layoutCategoriesPage)
    }
  }, [brand])

  useEffect(() => {
    if (!store?.id) return
    let cancelled = false
    const loadCategories = async () => {
      setLoadingCategories(true)
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description, slug, image_url')
        .eq('store_id', store.id)
        .order('name')
      if (cancelled) return
      if (error || !data) {
        setLoadingCategories(false)
        return
      }
      const withImages = await Promise.all(
        data.map(async (cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          slug: cat.slug,
          imageUrl: await resolveMediaUrl(cat.image_url),
        }))
      )
      setCategories(withImages)
      setLoadingCategories(false)
    }
    loadCategories()
    return () => { cancelled = true }
  }, [store?.id, supabase, resolveMediaUrl])

  useEffect(() => {
    if (!store?.id) return
    let cancelled = false
    const loadBest = async () => {
      setLoadingBest(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, slug, image_url, pricing_tiers (price)')
        .eq('store_id', store.id)
        .eq('is_published', true)
        .order('name')
        .limit(8)
      if (cancelled) return
      if (error || !data) {
        setLoadingBest(false)
        return
      }
      const mapped = await Promise.all(
        data.map(async (p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          slug: p.slug,
          imageUrl: await resolveMediaUrl(p.image_url),
          price: p.pricing_tiers?.[0]?.price ? Number(p.pricing_tiers[0].price) : null,
        }))
      )
      setBestSellers(mapped)
      setLoadingBest(false)
    }
    loadBest()
    return () => { cancelled = true }
  }, [store?.id, supabase, resolveMediaUrl])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const resolved = await resolveMediaUrl(brandForPreview.heroBg)
      if (!cancelled) setBgPreview(resolved || brandForPreview.heroBg || defaultBrand.heroBg)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [brandForPreview.heroBg, resolveMediaUrl, brandForPreview])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const resolved = await resolveMediaUrl(brandForPreview.logoUrl || null)
      if (!cancelled) setLogoPreview(resolved || brandForPreview.logoUrl || null)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [brandForPreview.logoUrl, resolveMediaUrl, brandForPreview])

  const uploadFile = useCallback(async (file: File) => {
    if (!store?.id) throw new Error('Tienda no encontrada')
    const path = `${store.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('product-assets').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })
    if (uploadError) throw uploadError
    await supabase.from('media_assets').insert({
      store_id: store.id,
      bucket: 'product-assets',
      object_path: path,
      content_type: file.type,
      bytes: file.size,
    })
    const { data: signed } = await supabase.storage.from('product-assets').createSignedUrl(path, 60 * 60 * 24 * 7)
    return { path, url: signed?.signedUrl || null }
  }, [store?.id, supabase])

  const deleteFileIfExists = useCallback(async (key?: string | null) => {
    if (!key || key.startsWith('http')) return
    try {
      await supabase.storage.from('product-assets').remove([key])
    } catch (err) {
      console.warn('No se pudo borrar el archivo anterior', err)
    }
  }, [supabase])

  const persistBrand = useCallback(async (nextBrand: BrandConfig, opts?: { silent?: boolean }) => {
    if (!store?.id) return
    if (!session) {
      if (!opts?.silent) {
        toast({ status: 'warning', title: 'Inicia sesión para guardar cambios' })
      }
      return
    }
    const silent = !!opts?.silent
    if (silent) setAutoSaving(true)
    else setSaving(true)
    const { error } = await supabase.from('stores').update({ brand: nextBrand }).eq('id', store.id)
    if (silent) {
      setAutoSaving(false)
    } else {
      setSaving(false)
    }
    if (error) {
      toast({ status: 'error', title: error.message })
      return
    }
    setLastAutoSave(new Date())
    if (!silent) {
      toast({ status: 'success', title: 'Cambios guardados' })
    }
  }, [store?.id, supabase, session, toast])

  const updateBrandField = useCallback((field: keyof BrandConfig, value: string | null) => {
    setBrand((prev) => {
      const next = { ...prev, [field]: value ?? '' } as BrandConfig
      void persistBrand(next, { silent: true })
      return next
    })
  }, [persistBrand])

  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const previous = brand?.logoUrl || null
    try {
      const uploaded = await uploadFile(file)
      if (previous && previous !== uploaded.path) {
        await deleteFileIfExists(previous)
      }
      setBrand((b) => {
        const next = { ...b, logoUrl: uploaded.path }
        void persistBrand(next as BrandConfig, { silent: true })
        return next
      })
      setLogoPreview(uploaded.url || uploaded.path)
      toast({ status: 'success', title: 'Logo actualizado' })
    } catch (err: any) {
      toast({ status: 'error', title: err?.message || 'No se pudo subir el logo' })
    }
  }

  const handleBgChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const uploaded = await uploadFile(file)
      setBrand((b) => {
        const next = { ...b, heroBg: uploaded.path }
        void persistBrand(next as BrandConfig, { silent: true })
        return next
      })
      setBgPreview(uploaded.url || uploaded.path)
      toast({ status: 'success', title: 'Fondo actualizado' })
    } catch (err: any) {
      toast({ status: 'error', title: err?.message || 'No se pudo subir el fondo' })
    }
  }

  const saveBrand = async () => {
    if (!store?.id) return
    await persistBrand(brand)
  }

  const resetBrand = () => setBrand(defaultBrand)

  const saveBasics = async () => {
    if (!store?.id) return
    const normalizedSlug = slugify(basics.slug || store.slug || '', { lower: true, strict: true })
    if (!normalizedSlug) {
      toast({ status: 'warning', title: 'Slug inválido' })
      return
    }
    setSavingBasics(true)
    const { error } = await supabase
      .from('stores')
      .update({ name: basics.name || store.name, slug: normalizedSlug })
      .eq('id', store.id)
    setSavingBasics(false)
    if (error) {
      toast({ status: 'error', title: error.message })
      return
    }
    setStore((s) => s ? { ...s, name: basics.name || s.name, slug: normalizedSlug } : s)
    toast({ status: 'success', title: 'Datos guardados' })
    if (normalizedSlug !== slug) {
      router.replace(`/store/${normalizedSlug}/edit`)
    }
  }

  if (loading) {
    return (
      <Box minH="80vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner />
      </Box>
    )
  }

  if (error) {
    return (
      <Box minH="80vh" display="flex" alignItems="center" justifyContent="center">
        <Text color="red.500">{error}</Text>
      </Box>
    )
  }

  const heroBgUrl = bgPreview || brand.heroBg || defaultBrand.heroBg
  const overlayColor = brand.heroOverlay || 'rgba(0,0,0,0.55)'
  const heroTextColor = !brand.heroTextColor || brand.heroTextColor === '#00f6ff' ? 'white' : brand.heroTextColor
  const primaryColor = brand.primaryColor || '#2563eb'
  const surfaceColor = brand.surfaceColor || '#ffffff'
  const textColor = brand.textColor || '#0f172a'
  const heroTitleText = brand.heroTitle || store?.name || defaultBrand.heroTitle
  const bestsellersTitleText = brand.bestsellersTitle || 'Bestsellers'
  const categoriesTitleText = brand.categoriesTitle || 'Categorías'
  const featuredCategories = categories.slice(0, 3)
  const navTextColor = brand.navTextColor || textColor
  const heroVariantForPreview = brand.layoutHero || heroSelection
  const bestVariantForPreview = bestSelection || brand.layoutBestsellers || 'grid'
  const catVariantForPreview = catSelection || brand.layoutCategories || 'grid'
  const catPageVariantForPreview = catPageSelection || brand.layoutCategoriesPage || 'grid'
  const bestTitle = brand.highlightTitle || 'Bestsellers'

  const renderNavPreview = () => {
    const navLinks = ['Categorías', 'Destacados', 'Ofertas', 'Ayuda']
    switch (navSelection) {
      case 'solid-search':
        return (
          <Box bg={primaryColor} color="white" py={3} px={{ base: 4, md: 8 }}>
            <Flex align="center" gap={6} flexWrap="wrap">
              <HStack spacing={3} flexShrink={0}>
                {logoPreview && <Image src={logoPreview} alt="Logo" boxSize="42px" borderRadius="md" bg="white" p={1} cursor="pointer" onClick={() => logoInputRef.current?.click()} />}
                <Editable value={heroTitleText} onSubmit={(val) => updateBrandField('heroTitle', val || heroTitleText)} submitOnBlur>
                  <EditablePreview fontWeight="bold" fontSize="lg" />
                  <EditableInput />
                </Editable>
              </HStack>
              <HStack spacing={4} flexWrap="wrap">
                {navLinks.map((item) => (
                  <Text key={item} fontWeight="medium">{item}</Text>
                ))}
              </HStack>
              <InputGroup maxW="280px" ml="auto">
                <Input bg="white" color="gray.800" placeholder="Buscar producto" borderRadius="full" _placeholder={{ color: 'gray.500' }} />
                <InputRightElement>
                  <FiSearch color={primaryColor} />
                </InputRightElement>
              </InputGroup>
              <HStack spacing={2}>
                <IconButton aria-label="favoritos" icon={<FiHeart />} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} />
                <IconButton aria-label="perfil" icon={<FiUser />} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} />
                <IconButton aria-label="carrito" icon={<FiShoppingCart />} variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }} />
              </HStack>
            </Flex>
          </Box>
        )
      case 'minimal-pill':
        return (
          <Box bg={brand.navBgColor || 'white'} color={navTextColor} borderBottom="1px solid #e2e8f0" px={{ base: 4, md: 8 }} py={4}>
            <Flex align="center" gap={6} flexWrap="wrap">
              <HStack spacing={3} flexShrink={0}>
                {logoPreview && <Image src={logoPreview} alt="Logo" boxSize="40px" borderRadius="md" cursor="pointer" onClick={() => logoInputRef.current?.click()} />}
                <Editable value={heroTitleText} onSubmit={(val) => updateBrandField('heroTitle', val || heroTitleText)} submitOnBlur>
                  <EditablePreview fontWeight="bold" fontSize="lg" />
                  <EditableInput />
                </Editable>
              </HStack>
              <HStack spacing={4} flexWrap="wrap">
                {navLinks.map((item) => (
                  <Text key={item}>{item}</Text>
                ))}
              </HStack>
              <InputGroup maxW="260px" ml="auto">
                <Input placeholder="Buscar producto" borderRadius="full" />
                <InputRightElement>
                  <FiSearch />
                </InputRightElement>
              </InputGroup>
              <HStack spacing={3}>
                <IconButton aria-label="favoritos" icon={<FiHeart />} variant="ghost" />
                <IconButton aria-label="perfil" icon={<FiUser />} variant="ghost" />
                <IconButton aria-label="carrito" icon={<FiShoppingCart />} variant="ghost" />
              </HStack>
            </Flex>
          </Box>
        )
      case 'two-row':
        return (
          <Box bg="#f8fafc" color={navTextColor}>
            <Box px={{ base: 4, md: 8 }} py={2}>
              <HStack justify="space-between" spacing={4} fontSize="sm" color="gray.600">
                <HStack spacing={2}><FiMapPin /> <Text>Manhattan, New York, USA</Text></HStack>
                <HStack spacing={3}>
                  <HStack spacing={1}><FiPhone /><Text>Soporte</Text></HStack>
                  <HStack spacing={1}><FiGlobe /><Text>EN | USD</Text></HStack>
                </HStack>
              </HStack>
            </Box>
            <Divider />
            <Box px={{ base: 4, md: 8 }} py={3}>
              <Flex align="center" gap={4} flexWrap="wrap">
                <HStack spacing={3} flexShrink={0}>
                  {logoPreview && <Image src={logoPreview} alt="Logo" boxSize="40px" borderRadius="md" cursor="pointer" onClick={() => logoInputRef.current?.click()} />}
                  <Editable value={heroTitleText} onSubmit={(val) => updateBrandField('heroTitle', val || heroTitleText)} submitOnBlur>
                    <EditablePreview fontWeight="bold" fontSize="lg" />
                    <EditableInput />
                  </Editable>
                </HStack>
                <Button variant="outline" size="sm" leftIcon={<FiSearch />}>Categorías</Button>
                <InputGroup flex="1" minW="220px" maxW="360px">
                  <Input placeholder="Buscar producto" />
                  <InputRightElement>
                    <IconButton aria-label="buscar" icon={<FiSearch />} size="sm" variant="ghost" />
                  </InputRightElement>
                </InputGroup>
                <HStack spacing={2}>
                  <Button size="sm" variant="ghost">Iniciar sesión</Button>
                  <Button size="sm" variant="outline">Wishlist</Button>
                  <Button size="sm" variant="outline" leftIcon={<FiShoppingCart />}>Carrito</Button>
                </HStack>
              </Flex>
            </Box>
            <Divider />
            <Box px={{ base: 4, md: 8 }} py={2}>
              <HStack spacing={4} fontSize="sm" color="gray.700" overflowX="auto">
                {['Ofertas', 'Recomendados', 'Novedades', 'Bestsellers', 'Regalos', 'Artículos', 'Más'].map((item) => (
                  <Text key={item}>{item}</Text>
                ))}
              </HStack>
            </Box>
          </Box>
        )
      case 'pill-search':
        return (
          <Box bg="white" borderBottom="1px solid #e5e7eb" color={navTextColor}>
            <Box px={{ base: 4, md: 8 }} py={4}>
              <Flex align="center" gap={5} flexWrap="wrap">
                <HStack spacing={3} flexShrink={0}>
                  {logoPreview && <Image src={logoPreview} alt="Logo" boxSize="40px" borderRadius="md" cursor="pointer" onClick={() => logoInputRef.current?.click()} />}
                  <Editable value={heroTitleText} onSubmit={(val) => updateBrandField('heroTitle', val || heroTitleText)} submitOnBlur>
                    <EditablePreview fontWeight="bold" fontSize="lg" />
                    <EditableInput />
                  </Editable>
                </HStack>
                <Button size="sm" variant="ghost" leftIcon={<FiGlobe />}>Categorías</Button>
                <InputGroup maxW="360px" flex="1">
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.500" />
                  </InputLeftElement>
                  <Input placeholder="Buscar producto" borderRadius="full" />
                  <InputRightElement>
                    <Button size="sm" colorScheme="blue" borderRadius="full">Buscar</Button>
                  </InputRightElement>
                </InputGroup>
                <HStack spacing={4}>
                  <Text fontSize="sm">Órdenes</Text>
                  <FiHeart />
                  <FiShoppingCart />
                  <FiUser />
                </HStack>
              </Flex>
            </Box>
            <Box px={{ base: 4, md: 8 }} pb={3}>
              <HStack spacing={4} fontSize="sm" color="gray.700" overflowX="auto">
                {['Nueva York, USA', 'Electrónica', 'Autopartes', 'Bestsellers', 'Ropa', 'Regalos', 'Más'].map((item) => (
                  <Text key={item}>{item}</Text>
                ))}
              </HStack>
            </Box>
          </Box>
        )
      case 'solid-actions':
        return (
          <Box bg={primaryColor} color="white">
            <Box px={{ base: 4, md: 8 }} py={4}>
              <Flex align="center" gap={4} flexWrap="wrap">
                <HStack spacing={3} flexShrink={0}>
                  {logoPreview && <Image src={logoPreview} alt="Logo" boxSize="40px" borderRadius="md" bg="white" p={1} cursor="pointer" onClick={() => logoInputRef.current?.click()} />}
                  <Editable value={heroTitleText} onSubmit={(val) => updateBrandField('heroTitle', val || heroTitleText)} submitOnBlur>
                    <EditablePreview fontWeight="bold" fontSize="lg" />
                    <EditableInput />
                  </Editable>
                </HStack>
                <Button size="sm" variant="outline" color="white" borderColor="whiteAlpha.500" leftIcon={<FiGlobe />}>
                  Estados Unidos
                </Button>
                <InputGroup maxW="360px" flex="1">
                  <Input placeholder="Buscar producto" bg="white" color="gray.800" borderRadius="full" />
                  <InputRightElement>
                    <IconButton aria-label="buscar" icon={<FiSearch />} size="sm" bg="white" color={primaryColor} borderRadius="full" />
                  </InputRightElement>
                </InputGroup>
                <HStack spacing={4}>
                  <HStack spacing={1}><FiHeart /><Text fontSize="sm">Guardados</Text></HStack>
                  <HStack spacing={1}><FiUser /><Text fontSize="sm">Cuenta</Text></HStack>
                  <HStack spacing={1}><FiShoppingCart /><Text fontSize="sm">Carrito</Text></HStack>
                </HStack>
              </Flex>
            </Box>
            <Box bg="white">
              <Box px={{ base: 4, md: 8 }} py={3}>
                <HStack spacing={4} color="gray.800" fontSize="sm" overflowX="auto">
                  {['Todas las categorías', 'Electrónica', 'Autopartes', 'Bestsellers', 'Ropa', 'Regalos', 'Más'].map((item) => (
                    <Text key={item}>{item}</Text>
                  ))}
                </HStack>
              </Box>
            </Box>
          </Box>
        )
      case 'centered':
        return (
          <Box bg={brand.navBgColor || 'white'} borderBottom="1px solid #e2e8f0" color={navTextColor} px={{ base: 4, md: 8 }} py={4}>
            <Flex align="center" justify="center" gap={8} flexWrap="wrap">
              <Editable value={heroTitleText} onSubmit={(val) => updateBrandField('heroTitle', val || heroTitleText)} submitOnBlur>
                <EditablePreview fontWeight="bold" fontSize="lg" />
                <EditableInput />
              </Editable>
              <HStack spacing={4}>
                {navLinks.map((item) => (
                  <Text key={item}>{item}</Text>
                ))}
              </HStack>
            </Flex>
          </Box>
        )
      default:
        return (
          <Box bg={brand.navBgColor || 'white'} borderBottom="1px solid #e2e8f0" color={navTextColor} px={{ base: 4, md: 8 }} py={4}>
            <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
              <HStack spacing={3}>
                {logoPreview && (
                  <Image
                    src={logoPreview}
                    alt="Logo"
                    boxSize="42px"
                    borderRadius="md"
                    cursor="pointer"
                    onClick={() => logoInputRef.current?.click()}
                  />
                )}
                <Editable
                  value={heroTitleText}
                  onSubmit={(val) => updateBrandField('heroTitle', val || heroTitleText)}
                  submitOnBlur
                >
                  <EditablePreview fontWeight="bold" fontSize="lg" />
                  <EditableInput />
                </Editable>
              </HStack>
              <HStack spacing={{ base: 3, md: 5 }}>
                {navLinks.map((item) => (
                  <Text key={item}>{item}</Text>
                ))}
                <Editable
                  value={brand.heroCta || defaultBrand.heroCta}
                  onSubmit={(val) => updateBrandField('heroCta', val || defaultBrand.heroCta)}
                  submitOnBlur
                >
                  <EditablePreview
                    as={Button}
                    size="sm"
                    bg={primaryColor}
                    color="white"
                    _hover={{ opacity: 0.9 }}
                    cursor="pointer"
                  />
                  <EditableInput />
                </Editable>
              </HStack>
            </Flex>
          </Box>
        )
    }
  }

  const renderHeroPreview = () => {
    switch (heroVariantForPreview) {
      case 'fashion':
        return (
          <Box bg="#faf5f0" position="relative" py={{ base: 10, md: 14 }} px={{ base: 4, md: 8 }}>
            <Flex gap={10} align="center" direction={{ base: 'column', md: 'row' }}>
              <VStack align="start" spacing={4} flex="1">
                <Editable value={heroTitleText} onSubmit={(val) => updateBrandField('heroTitle', val || heroTitleText)} submitOnBlur>
                  <EditablePreview fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold" lineHeight="short" color="#b45309" />
                  <EditableInput />
                </Editable>
                <Editable value={brand.heroSubtitle || defaultBrand.heroSubtitle} onSubmit={(val) => updateBrandField('heroSubtitle', val || defaultBrand.heroSubtitle)} submitOnBlur>
                  <EditablePreview fontSize="lg" color="#7c2d12" />
                  <EditableInput />
                </Editable>
                <HStack spacing={3}>
                  <Button size="lg" bg="#b91c1c" color="white" _hover={{ bg: '#991b1b' }}>{brand.heroCta || 'Comprar ahora'}</Button>
                  <Button variant="outline" colorScheme="orange">Ver catálogo</Button>
                </HStack>
              </VStack>
              <Box flex="1" position="relative" maxW="520px">
                <Box borderRadius="3xl" overflow="hidden" boxShadow="2xl" bgGradient="linear(to-br, #f97316, #fb7185)" p={3}>
                  <Box borderRadius="2xl" overflow="hidden" bg="white">
                    <Image src={heroBgUrl} alt="Hero" objectFit="cover" w="100%" h="360px" />
                  </Box>
                </Box>
              </Box>
            </Flex>
          </Box>
        )
      case 'collage':
        return (
          <Box bg="#fdfcf8" py={{ base: 10, md: 14 }} px={{ base: 4, md: 8 }}>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} alignItems="center">
              <VStack align="start" spacing={4}>
                <Editable value={heroTitleText} onSubmit={(val) => updateBrandField('heroTitle', val || heroTitleText)} submitOnBlur>
                  <EditablePreview fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold" color="#14532d" />
                  <EditableInput />
                </Editable>
                <Editable value={brand.heroSubtitle || defaultBrand.heroSubtitle} onSubmit={(val) => updateBrandField('heroSubtitle', val || defaultBrand.heroSubtitle)} submitOnBlur>
                  <EditablePreview fontSize="lg" color="#166534" />
                  <EditableInput />
                </Editable>
                <Button bg="#16a34a" color="white" size="lg" _hover={{ bg: '#15803d' }}>{brand.heroCta || 'Ver bouquets'}</Button>
              </VStack>
              <SimpleGrid columns={2} gap={4}>
                {[heroBgUrl, heroBgUrl, heroBgUrl, heroBgUrl].map((img, idx) => (
                  <Box key={idx} borderRadius="xl" overflow="hidden" boxShadow="lg">
                    <Image src={img} alt="Collage" objectFit="cover" w="100%" h="200px" />
                  </Box>
                ))}
              </SimpleGrid>
            </SimpleGrid>
          </Box>
        )
      case 'dark-split':
        return (
          <Box position="relative" color="white" bg="#0f172a" py={{ base: 12, md: 16 }}>
            <Box position="absolute" inset={0} bgImage={`url(${heroBgUrl})`} bgSize="cover" bgPos="center" opacity={0.35} />
            <Container maxW="6xl" position="relative">
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} alignItems="center">
                <VStack align="start" spacing={4}>
                  <Editable value={heroTitleText} onSubmit={(val) => updateBrandField('heroTitle', val || heroTitleText)} submitOnBlur>
                    <EditablePreview fontSize={{ base: '3xl', md: '4xl' }} fontWeight="extrabold" />
                    <EditableInput />
                  </Editable>
                  <Editable value={brand.heroSubtitle || defaultBrand.heroSubtitle} onSubmit={(val) => updateBrandField('heroSubtitle', val || defaultBrand.heroSubtitle)} submitOnBlur>
                    <EditablePreview fontSize="lg" color="gray.200" />
                    <EditableInput />
                  </Editable>
                  <HStack spacing={3}>
                    <Button size="lg" bg="white" color="#0f172a" _hover={{ opacity: 0.9 }}>{brand.heroCta || 'Explorar'}</Button>
                    <Button size="lg" variant="outline" colorScheme="whiteAlpha">Aprender más</Button>
                  </HStack>
                </VStack>
                <Box borderRadius="2xl" overflow="hidden" boxShadow="2xl">
                  <Image src={heroBgUrl} alt="Hero" objectFit="cover" w="100%" h={{ base: '240px', md: '320px' }} />
                </Box>
              </SimpleGrid>
            </Container>
          </Box>
        )
      case 'product-highlight':
        return (
          <Box bg="#f8fafc" py={{ base: 10, md: 14 }} px={{ base: 4, md: 8 }}>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} alignItems="center">
              <VStack align="start" spacing={3}>
                <Text fontSize="sm" color="gray.500" letterSpacing="wide" textTransform="uppercase">Edición destacada</Text>
                <Editable value={heroTitleText} onSubmit={(val) => updateBrandField('heroTitle', val || heroTitleText)} submitOnBlur>
                  <EditablePreview fontSize={{ base: '3xl', md: '4xl' }} fontWeight="black" color="#0f172a" />
                  <EditableInput />
                </Editable>
                <Editable value={brand.heroSubtitle || defaultBrand.heroSubtitle} onSubmit={(val) => updateBrandField('heroSubtitle', val || defaultBrand.heroSubtitle)} submitOnBlur>
                  <EditablePreview fontSize="md" color="gray.600" />
                  <EditableInput />
                </Editable>
                <HStack spacing={3} flexWrap="wrap">
                  <Button size="lg" colorScheme="blue">{brand.heroCta || 'Comprar ahora'}</Button>
                  <Button variant="ghost" colorScheme="gray">Ver specs</Button>
                </HStack>
              </VStack>
              <Box position="relative">
                <Box borderRadius="2xl" overflow="hidden" boxShadow="xl" bg="white">
                  <Image src={heroBgUrl} alt="Producto" objectFit="cover" w="100%" h={{ base: '220px', md: '320px' }} />
                </Box>
                <Box position="absolute" top={4} left={4} bg="white" borderRadius="full" px={4} py={2} boxShadow="md" fontWeight="bold">
                  Nuevo
                </Box>
              </Box>
            </SimpleGrid>
          </Box>
        )
      default:
        return (
          <Box
            bgImage={`url(${heroBgUrl})`}
            bgSize="cover"
            bgPos="center"
            position="relative"
            py={16}
          >
            <Box position="absolute" inset={0} bgGradient={`linear(to-r, ${overlayColor}, rgba(0,0,0,0.2))`} />
            <Container maxW="6xl" position="relative">
              <VStack align="start" spacing={4} color={heroTextColor} maxW="520px">
                <Editable value={heroTitleText} onSubmit={(val) => updateBrandField('heroTitle', val || heroTitleText)} submitOnBlur>
                  <EditablePreview fontSize="3xl" fontWeight="extrabold" color={heroTextColor} />
                  <EditableInput />
                </Editable>
                <Editable value={brand.heroSubtitle || defaultBrand.heroSubtitle} onSubmit={(val) => updateBrandField('heroSubtitle', val || defaultBrand.heroSubtitle)} submitOnBlur>
                  <EditablePreview fontSize="lg" color="gray.200" />
                  <EditableInput />
                </Editable>
                <Button bg={primaryColor} color="white" size="lg" _hover={{ opacity: 0.9 }}>{brand.heroCta || 'Comprar ahora'}</Button>
              </VStack>
            </Container>
          </Box>
        )
    }
  }

  const renderBestPreview = () => {
    if (loadingBest) {
      return (
        <HStack><Spinner size="sm" /><Text>Cargando productos...</Text></HStack>
      )
    }
    if (!bestSellers.length) {
      return <Text color="gray.500">No hay productos publicados para mostrar.</Text>
    }

    const Card = ({ p }: any) => (
      <Box border="1px solid #e2e8f0" borderRadius="lg" p={4} bg="white" boxShadow="sm">
        {p.imageUrl && <Image src={p.imageUrl} alt={p.name} objectFit="cover" w="100%" h="140px" mb={3} />}
        <Text fontWeight="semibold">{p.name}</Text>
        <Text fontSize="sm" color="gray.600" noOfLines={2}>{p.description || 'Producto destacado'}</Text>
        {p.price != null && <Text fontWeight="bold" mt={2}>${p.price.toFixed(2)}</Text>}
      </Box>
    )

    switch (bestVariantForPreview) {
      case 'spotlight':
        return (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {bestSellers.slice(0, 3).map((p) => <Card key={p.id} p={p} />)}
          </SimpleGrid>
        )
      case 'carousel':
        return (
          <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={3}>
            {bestSellers.slice(0, 8).map((p) => (
              <Box key={p.id} border="1px solid #e2e8f0" borderRadius="lg" p={3} bg="white">
                {p.imageUrl && <Image src={p.imageUrl} alt={p.name} w="100%" h="120px" objectFit="cover" borderRadius="md" mb={2} />}
                <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>{p.name}</Text>
                {p.price != null && <Text color="gray.700" fontSize="sm">${p.price.toFixed(2)}</Text>}
              </Box>
            ))}
          </Grid>
        )
      case 'flash':
        return (
          <Box>
            <HStack spacing={2} mb={3}>
              {['02', '35', '40', '40'].map((t, idx) => (
                <Box key={idx} bg="gray.900" color="white" px={3} py={1} borderRadius="md" fontWeight="bold" fontSize="sm">
                  {t}
                </Box>
              ))}
            </HStack>
            <HStack spacing={2} mb={3} flexWrap="wrap">
              {['Tecnología', 'Moda', 'Accesorios', 'Hogar', 'Deportes'].map((chip, idx) => (
                <Button key={chip} size="xs" variant={idx === 1 ? 'solid' : 'ghost'} colorScheme={idx === 1 ? 'red' : 'gray'}>
                  {chip}
                </Button>
              ))}
            </HStack>
            <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={3}>
              {bestSellers.slice(0, 8).map((p, idx) => (
                <Box key={p.id} border="1px solid #e5e7eb" borderRadius="lg" p={3} bg="white" position="relative" _hover={{ boxShadow: 'md' }}>
                  {idx < 2 && (
                    <Badge colorScheme="red" borderRadius="md" position="absolute" top={2} left={2}>
                      Hot
                    </Badge>
                  )}
                  {p.imageUrl && <Image src={p.imageUrl} alt={p.name} w="100%" h="140px" objectFit="cover" borderRadius="md" mb={2} />}
                  <Text fontSize="xs" color="gray.500" noOfLines={1}>Marca destacada</Text>
                  <Text fontWeight="semibold" fontSize="sm" noOfLines={2}>{p.name}</Text>
                  <HStack spacing={2} mt={2}>
                    {p.price != null && <Text fontWeight="bold">${p.price.toFixed(2)}</Text>}
                    <Text fontSize="xs" color="gray.500" textDecor="line-through">${(p.price ? p.price * 1.1 : 0).toFixed(2)}</Text>
                  </HStack>
                </Box>
              ))}
            </Grid>
          </Box>
        )
      case 'signature':
        return (
          <Box bg="#f8f1e9" p={4} borderRadius="xl">
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              {bestSellers.slice(0, 3).map((p) => (
                <Box key={p.id} bg="white" border="1px solid #e5ded4" borderRadius="lg" overflow="hidden" p={4} textAlign="center" boxShadow="sm" _hover={{ boxShadow: 'md' }}>
                  {p.imageUrl && <Image src={p.imageUrl} alt={p.name} w="100%" h="160px" objectFit="contain" mb={3} />}
                  <Text fontWeight="extrabold" letterSpacing="wide" textTransform="uppercase" fontSize="sm">{p.name}</Text>
                  <Text fontSize="xs" color="gray.600" mt={1}>{p.description || 'Disponible'}</Text>
                  <Button size="sm" variant="outline" mt={3} borderRadius="full">Ver</Button>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )
      default:
        return (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {bestSellers.slice(0, 6).map((p) => <Card key={p.id} p={p} />)}
          </SimpleGrid>
        )
    }
  }

  const renderCategoryPagePreview = () => {
    if (loadingCategories) {
      return (
        <Box p={6}>
          <HStack><Spinner size="sm" /><Text>Cargando categorías...</Text></HStack>
        </Box>
      )
    }
    if (!categories.length) {
      return (
        <Box p={6}>
          <Text color="gray.500">No hay categorías para previsualizar.</Text>
        </Box>
      )
    }

    if (catPageVariantForPreview === 'magazine') {
      return (
        <Box color={textColor} pointerEvents="none">
          <HStack justify="space-between" align="center" mb={4} flexWrap="wrap">
            <Text fontWeight="semibold" color="gray.600">Filtra y explora las categorías disponibles</Text>
            <Text fontSize="sm" color="gray.500">{categories.length} categorías</Text>
          </HStack>
          <Heading as="h2" size="xl" mb={4} color={textColor}>{brand.categoriesTitle || 'Categorías'}</Heading>
          <SimpleGrid
            columns={{ base: 1, sm: Math.min(categories.length, 2) || 1, md: Math.min(categories.length, 3) || 1 }}
            spacing={5}
            justifyItems={categories.length < 3 ? 'center' : 'stretch'}
          >
            {categories.map((cat) => (
              <Box
                key={cat.id}
                bg="white"
                borderRadius="lg"
                border="1px solid #e5e7eb"
                overflow="hidden"
                maxW="360px"
                w="100%"
                justifySelf={categories.length < 3 ? 'center' : 'stretch'}
              >
                {cat.imageUrl && <Image src={cat.imageUrl} alt={cat.name} w="100%" h="160px" objectFit="cover" />}
                <Box p={4}>
                  <Text fontSize="md" fontWeight="bold" mb={1}>{cat.name}</Text>
                  <Text fontSize="sm" color="gray.600" noOfLines={2}>{cat.description || 'Explora esta categoría'}</Text>
                  <Button mt={3} size="sm" variant="ghost" colorScheme="blue">Ver productos</Button>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )
    }

    if (catPageVariantForPreview === 'catalog-grid') {
      return (
        <Flex gap={6} direction={{ base: 'column', md: 'row' }} pointerEvents="none">
          <Box
            w={{ base: '100%', md: '240px' }}
            bg="white"
            border="1px solid #e5e7eb"
            borderRadius="lg"
            p={4}
            h="fit-content"
          >
            <Text fontWeight="bold" mb={3} color={textColor}>Categorías</Text>
            <Stack spacing={2}>
              {categories.slice(0, 8).map((cat) => (
                <Text key={cat.id} fontSize="sm" color="gray.700">{cat.name}</Text>
              ))}
            </Stack>
          </Box>
          <Box flex="1">
            <HStack justify="space-between" mb={3} align="center">
              <Text fontSize="sm" color="gray.600">Listado de categorías</Text>
              <Text fontSize="sm" color="gray.500">{categories.length} items</Text>
            </HStack>
            <Divider mb={4} />
            <SimpleGrid
              columns={{ base: 1, sm: Math.min(categories.length, 2) || 1, md: Math.min(categories.length, 3) || 1 }}
              spacing={5}
              justifyItems={categories.length < 3 ? 'center' : 'stretch'}
            >
              {categories.map((cat) => (
                <Box
                  key={cat.id}
                  bg="white"
                  borderRadius="lg"
                  border="1px solid #e5e7eb"
                  overflow="hidden"
                  maxW="360px"
                  w="100%"
                  justifySelf={categories.length < 3 ? 'center' : 'stretch'}
                >
                  {cat.imageUrl && <Image src={cat.imageUrl} alt={cat.name} w="100%" h="160px" objectFit="cover" />}
                  <Box p={4}>
                    <Text fontSize="md" fontWeight="bold" mb={1}>{cat.name}</Text>
                    <Text fontSize="sm" color="gray.600" noOfLines={2}>{cat.description || 'Explora esta categoría'}</Text>
                    <Button mt={3} size="sm" variant="ghost" colorScheme="blue">Ver productos</Button>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </Flex>
      )
    }

    // default grid preview
    return (
      <SimpleGrid
        columns={{ base: 1, sm: Math.min(categories.length, 2) || 1, md: Math.min(categories.length, 3) || 1 }}
        spacing={5}
        pointerEvents="none"
        justifyItems={categories.length < 3 ? 'center' : 'stretch'}
      >
        {categories.map((cat) => (
          <Box
            key={cat.id}
            border="1px solid #e5e7eb"
            borderRadius="lg"
            bg="white"
            overflow="hidden"
            _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
            transition="all 0.15s ease"
            maxW="360px"
            w="100%"
            justifySelf={categories.length < 3 ? 'center' : 'stretch'}
          >
            {cat.imageUrl && (
              <Image src={cat.imageUrl} alt={cat.name} w="100%" h="180px" objectFit="cover" />
            )}
            <VStack align="stretch" spacing={3} p={4}>
              <Stack spacing={1}>
                <Text fontWeight="bold" fontSize="lg">{cat.name}</Text>
                <Text color="gray.600" fontSize="sm" noOfLines={2}>{cat.description || 'Explora esta categoría'}</Text>
              </Stack>
              <Button colorScheme="blue" size="sm" alignSelf="flex-start">Ver productos</Button>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    )
  }

  const renderCategoryProductsPreview = () => {
    const sampleProducts = bestSellers.length
      ? bestSellers
      : categories.length
      ? categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, imageUrl: c.imageUrl }))
      : [{ id: 'demo', name: 'Producto demo', slug: 'producto-demo', description: 'Descripción de ejemplo', imageUrl: null }]

    const renderCards = (asMagazine: boolean) => (
      <SimpleGrid
        columns={{ base: 1, sm: Math.min(sampleProducts.length, 2) || 1, md: Math.min(sampleProducts.length, 3) || 1 }}
        spacing={5}
        justifyItems={sampleProducts.length < 3 ? 'center' : 'stretch'}
      >
        {sampleProducts.map((p) => (
          <Box
            key={p.id}
            bg="white"
            borderRadius="lg"
            border="1px solid #e5e7eb"
            overflow="hidden"
            maxW="360px"
            w="100%"
            justifySelf={sampleProducts.length < 3 ? 'center' : 'stretch'}
            _hover={{ shadow: asMagazine ? 'md' : undefined, transform: asMagazine ? undefined : 'translateY(-2px)' }}
            transition="all 0.15s ease"
          >
            {p.imageUrl && <Image src={p.imageUrl} alt={p.name} w="100%" h="180px" objectFit="cover" />}
            <Box p={4}>
              <Text fontSize="md" fontWeight="bold" mb={1} color={textColor}>{p.name}</Text>
              <Text fontSize="sm" color="gray.600" noOfLines={2}>{p.description || 'Sin descripción'}</Text>
              <Button mt={3} size="sm" variant={asMagazine ? 'ghost' : 'solid'} colorScheme="blue">
                Ver producto
              </Button>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    )

    if ((catPageVariantForPreview || brand.layoutCategoriesPage) === 'magazine') {
      return (
        <Box color={textColor} pointerEvents="none">
          <HStack justify="space-between" align="center" mb={4} flexWrap="wrap">
            <Text fontWeight="semibold" color="gray.600">Productos de esta categoría</Text>
            <Text fontSize="sm" color="gray.500">{sampleProducts.length} productos</Text>
          </HStack>
          <Heading as="h2" size="xl" mb={4} color={textColor}>{brand.categoriesTitle || 'Categoría'}</Heading>
          {renderCards(true)}
        </Box>
      )
    }

    if ((catPageVariantForPreview || brand.layoutCategoriesPage) === 'catalog-grid') {
      return (
        <Flex gap={6} direction={{ base: 'column', md: 'row' }} pointerEvents="none">
          <Box
            w={{ base: '100%', md: '240px' }}
            bg="white"
            border="1px solid #e5e7eb"
            borderRadius="lg"
            p={4}
            h="fit-content"
          >
            <Text fontWeight="bold" mb={3} color={textColor}>Filtrar</Text>
            <Stack spacing={2}>
              <Text fontSize="sm" color="gray.700">Precio</Text>
              <Text fontSize="sm" color="gray.700">Marca</Text>
              <Text fontSize="sm" color="gray.700">Disponibilidad</Text>
            </Stack>
          </Box>
          <Box flex="1">
            <HStack justify="space-between" mb={3} align="center">
              <Text fontSize="sm" color="gray.600">Listado de productos</Text>
              <Text fontSize="sm" color="gray.500">{sampleProducts.length} productos</Text>
            </HStack>
            <Divider mb={4} />
            {renderCards(true)}
          </Box>
        </Flex>
      )
    }

    return renderCards(false)
  }

  return (
    <>
      <Head>
        <title>Editar portada | {store?.name || 'Tienda'}</title>
      </Head>
      <Container maxW="7xl" py={6}>
        <HStack justify="space-between" align="center">
          <Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={() => router.push(`/store/${slug}`)}>
            Ver tienda
          </Button>
          <HStack spacing={3}>
            <Button leftIcon={<RepeatIcon />} variant="outline" onClick={resetBrand}>
              Usar demo
            </Button>
            <Button
              leftIcon={<CheckIcon />}
              colorScheme="blue"
              onClick={saveBrand}
              isLoading={saving}
              isDisabled={!session}
            >
              Guardar cambios
            </Button>
          </HStack>
        </HStack>
        {store?.plan === 'free' && (
          <Box bg="yellow.100" color="yellow.900" borderRadius="md" p={3} mt={4}>
            Estás en plan gratuito: puedes editar para probar, pero la plantilla pública sigue usando el demo.
          </Box>
        )}
        <Box
          mt={6}
          border="1px solid #1f2937"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="lg"
          bg={brand.pageBg || '#f8fafc'}
        >
          <Flex px={{ base: 4, md: 6 }} py={4} align="center" justify="space-between" bg="#0b0d13" color="white">
            <Box>
              <Text fontWeight="bold">Vista previa editable</Text>
              <Text fontSize="sm" color="gray.300">Haz clic en textos o imágenes para editarlos. Los cambios se guardan automáticamente en Supabase.</Text>
            </Box>
            <HStack spacing={3} align="center">
              <HStack spacing={2}>
                <Text fontSize="sm" color="gray.300">Sección</Text>
                <Select
                  size="sm"
                  value={routeSelection}
                  onChange={(e) => setRouteSelection(e.target.value as 'home' | 'categories')}
                  bg="#111827"
                  borderColor="#1f2937"
                  color="white"
                >
                  <option value="home">Home</option>
                  <option value="categories">Categorías</option>
                  <option value="category-products">Productos de categoría</option>
                </Select>
              </HStack>
              <HStack spacing={2}>
                <Text fontSize="sm" color="gray.300">Navbar</Text>
                <Select
                  size="sm"
                  value={navSelection}
                  onChange={(e) => {
                    const val = e.target.value
                    setNavSelection(val)
                    setBrand((b) => ({ ...b, layoutNav: val }))
                  }}
                  bg="#111827"
                  borderColor="#1f2937"
                  color="white"
                >
                  {navVariants.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </Select>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => updateBrandField('layoutNav', navSelection)}
                  isDisabled={autoSaving}
                >
                  Aplicar
                </Button>
              </HStack>
              {routeSelection === 'home' && (
                <>
                  <HStack spacing={2}>
                    <Text fontSize="sm" color="gray.300">Hero</Text>
                    <Select
                      size="sm"
                      value={heroSelection}
                      onChange={(e) => {
                        const val = e.target.value
                        setHeroSelection(val)
                        setBrand((b) => ({ ...b, layoutHero: val }))
                      }}
                      bg="#111827"
                      borderColor="#1f2937"
                      color="white"
                    >
                      {heroVariants.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </Select>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => updateBrandField('layoutHero', heroSelection)}
                      isDisabled={autoSaving}
                    >
                      Aplicar
                    </Button>
                  </HStack>
                  <HStack spacing={2}>
                    <Text fontSize="sm" color="gray.300">Bestsellers</Text>
                    <Select
                      size="sm"
                      value={bestSelection || brand.layoutBestsellers || 'grid'}
                      onChange={(e) => {
                        const val = e.target.value
                        setBestSelection(val)
                        setBrand((b) => ({ ...b, layoutBestsellers: val }))
                      }}
                      bg="#111827"
                      borderColor="#1f2937"
                      color="white"
                    >
                      {bestVariants.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </Select>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => updateBrandField('layoutBestsellers', bestSelection)}
                      isDisabled={autoSaving}
                    >
                      Aplicar
                    </Button>
                  </HStack>
                  <HStack spacing={2}>
                    <Text fontSize="sm" color="gray.300">Categorías</Text>
                    <Select
                      size="sm"
                      value={catSelection || brand.layoutCategories || 'grid'}
                      onChange={(e) => {
                        const val = e.target.value
                        setCatSelection(val)
                        setBrand((b) => ({ ...b, layoutCategories: val }))
                      }}
                      bg="#111827"
                      borderColor="#1f2937"
                      color="white"
                    >
                      {categoryVariants.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </Select>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => updateBrandField('layoutCategories', catSelection || 'grid')}
                      isDisabled={autoSaving}
                    >
                      Aplicar
                    </Button>
                  </HStack>
                </>
              )}
              {(routeSelection === 'categories' || routeSelection === 'category-products') && (
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.300">Tema página categorías</Text>
                  <Select
                    size="sm"
                    value={catPageSelection || brand.layoutCategoriesPage || 'grid'}
                    onChange={(e) => {
                      const val = e.target.value
                      setCatPageSelection(val)
                      setBrand((b) => ({ ...b, layoutCategoriesPage: val }))
                    }}
                    bg="#111827"
                    borderColor="#1f2937"
                    color="white"
                  >
                  <option value="grid">Grid clásico</option>
                  <option value="magazine">Estilo catálogo</option>
                  <option value="catalog-grid">Catálogo ecommerce</option>
                </Select>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => updateBrandField('layoutCategoriesPage', catPageSelection || 'grid')}
                    isDisabled={autoSaving}
                  >
                    Aplicar
                  </Button>
                </HStack>
              )}
              {autoSaving && (
                <HStack spacing={2}>
                  <Spinner size="sm" />
                  <Text fontSize="sm">Guardando...</Text>
                </HStack>
              )}
              {!autoSaving && lastAutoSave && (
                <Text fontSize="sm" color="green.200">
                  Guardado {lastAutoSave.toLocaleTimeString()}
                </Text>
              )}
            </HStack>
          </Flex>

          {routeSelection === 'home' ? (
            <>
              {renderNavPreview()}

              <Box position="relative">
                <Button
                  size="sm"
                  position="absolute"
                  top={4}
                  right={4}
                  onClick={() => bgInputRef.current?.click()}
                  zIndex={2}
                  bg="white"
                  color="gray.800"
                  _hover={{ bg: 'gray.100' }}
                >
                  Cambiar fondo
                </Button>
                {renderHeroPreview()}
              </Box>

              <Box bg={surfaceColor} color={textColor}>
                <Container key={`best-${bestVariantForPreview}`} maxW="6xl" py={10}>
                  <HStack justify="space-between" mb={4}>
                    <Editable
                      value={bestsellersTitleText}
                      onSubmit={(val) => updateBrandField('bestsellersTitle', val || bestsellersTitleText)}
                      submitOnBlur
                    >
                      <EditablePreview fontSize="2xl" fontWeight="bold" />
                      <EditableInput />
                    </Editable>
                    <Text fontSize="sm" color="gray.600">Configura los productos destacados desde tu catálogo.</Text>
                  </HStack>
                  <Box display="flex" justifyContent={bestSellers.length <= 2 ? 'center' : 'flex-start'} pointerEvents="none">
                    {renderBestPreview()}
                  </Box>
                </Container>
              </Box>

              <Box bg={brand.pageBg || '#f8fafc'} color={textColor}>
              <Container key={`cat-${catVariantForPreview}`} maxW="6xl" py={10} pointerEvents="none">
                <Editable
                  value={categoriesTitleText}
                  onSubmit={(val) => updateBrandField('categoriesTitle', val || categoriesTitleText)}
                  submitOnBlur
                >
                  <EditablePreview fontSize="2xl" fontWeight="bold" />
                  <EditableInput />
                </Editable>
                <Box mt={4}>
                  {loadingCategories ? (
                    <HStack><Spinner size="sm" /><Text>Cargando categorías...</Text></HStack>
                  ) : categories.length === 0 ? (
                    <Text color="gray.500">No tienes categorías aún.</Text>
                  ) : (
                    <>
                      {catVariantForPreview === 'hero-slider' && (
                        <Grid templateColumns={{ base: '1fr', md: '1.2fr 1fr' }} gap={6} alignItems="center">
                          {categories[0] && (
                            <Box borderRadius="xl" overflow="hidden" boxShadow="xl" border="1px solid #e5e7eb" bg="white">
                              {categories[0].imageUrl && <Image src={categories[0].imageUrl} alt={categories[0].name} w="100%" h="320px" objectFit="cover" />}
                              <Box p={5}>
                                <Text fontSize="xl" fontWeight="black" mb={2}>{categories[0].name}</Text>
                                <Text color="gray.600" mb={3}>{categories[0].description || 'Descubre esta categoría'}</Text>
                                <Button size="sm" colorScheme="blue">Ver categoría</Button>
                              </Box>
                            </Box>
                          )}
                          <SimpleGrid columns={{ base: 2, md: 1 }} spacing={4}>
                            {categories.slice(1, 5).map((cat) => (
                              <Box key={cat.id} border="1px solid #e5e7eb" borderRadius="lg" p={4} bg="white" _hover={{ boxShadow: 'md' }}>
                                <Text fontWeight="bold" mb={2}>{cat.name}</Text>
                                <Text fontSize="sm" color="gray.600" noOfLines={2}>{cat.description || 'Explora'}</Text>
                                <Button size="sm" mt={3} variant="outline">Ver</Button>
                              </Box>
                            ))}
                          </SimpleGrid>
                        </Grid>
                      )}
                      {catVariantForPreview === 'dark-showcase' && (
                        <Box bg="#0f1117" color="white" p={4} borderRadius="xl">
                          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                            {categories.slice(0, 6).map((cat) => (
                              <Box key={cat.id} borderRadius="lg" overflow="hidden" position="relative" border="1px solid #1f2937" _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }} transition="all 0.2s ease">
                                {cat.imageUrl && (
                                  <Image src={cat.imageUrl} alt={cat.name} w="100%" h="220px" objectFit="cover" opacity={0.9} />
                                )}
                                <Box position="absolute" inset={0} bgGradient="linear(to-b, rgba(0,0,0,0.2), rgba(0,0,0,0.85))" />
                                <Box position="absolute" bottom={0} p={4}>
                                  <Text fontWeight="bold" fontSize="lg">{cat.name}</Text>
                                  <Text fontSize="sm" color="gray.300" noOfLines={2}>{cat.description || 'Explora esta categoría'}</Text>
                                  <Button size="sm" mt={2} colorScheme="pink" variant="solid">Ver detalles</Button>
                                </Box>
                              </Box>
                            ))}
                          </Grid>
                        </Box>
                      )}
                      {catVariantForPreview === 'grid' || catVariantForPreview === 'list' ? (
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                          {categories.map((cat) => (
                            <Box key={cat.id} border="1px solid #e2e8f0" borderRadius="lg" overflow="hidden" bg="white">
                              {cat.imageUrl && (
                                <Image src={cat.imageUrl} alt={cat.name} objectFit="cover" w="100%" h="140px" />
                              )}
                              <Box p={3}>
                                <Text fontWeight="semibold">{cat.name}</Text>
                                <Text fontSize="sm" color="gray.600">{cat.description || 'Categoría sin descripción'}</Text>
                              </Box>
                            </Box>
                          ))}
                        </SimpleGrid>
                      ) : null}
                    </>
                  )}
                </Box>
              </Container>
              </Box>
            </>
          ) : routeSelection === 'categories' ? (
            <Box bg={brand.pageBg || '#f8fafc'} color={textColor} py={10}>
              <Container maxW="6xl">
                <Editable
                  value={brand.categoriesTitle || 'Categorías'}
                  onSubmit={(val) => updateBrandField('categoriesTitle', val || brand.categoriesTitle || 'Categorías')}
                  submitOnBlur
                >
                  <EditablePreview as="h2" fontSize="2xl" fontWeight="bold" />
                  <EditableInput />
                </Editable>
                <Box mt={4}>
                  {renderCategoryPagePreview()}
                </Box>
              </Container>
            </Box>
          ) : (
            <Box bg={brand.pageBg || '#f8fafc'} color={textColor} py={10}>
              <Container maxW="6xl" pointerEvents="none">
                <Editable
                  value={brand.categoriesTitle || 'Categoría'}
                  onSubmit={(val) => updateBrandField('categoriesTitle', val || brand.categoriesTitle || 'Categoría')}
                  submitOnBlur
                >
                  <EditablePreview as="h2" fontSize="2xl" fontWeight="bold" />
                  <EditableInput />
                </Editable>
                <Box mt={4}>
                  {renderCategoryProductsPreview()}
                </Box>
              </Container>
            </Box>
          )}
        </Box>
        <Box
          mt={10}
          bg="white"
          borderRadius="xl"
          p={5}
          boxShadow="md"
          border="1px solid #1f2937"
          maxW="620px"
          color="black"
        >
          <FormControl>
            <FormLabel fontWeight="semibold">Datos de tienda</FormLabel>
            <Text fontSize="sm" color="gray.600" mb={3}>Edita el nombre y la URL (slug) de tu tienda.</Text>
            <VStack align="stretch" spacing={3}>
              <FormControl>
                <FormLabel fontSize="sm">Nombre</FormLabel>
                <Input
                  value={basics.name}
                  onChange={(e) => setBasics((f) => ({ ...f, name: e.target.value }))}
                  borderColor="#1f2937"
                  _focus={{ borderColor: '#111827', boxShadow: '0 0 0 1px #111827' }}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Slug</FormLabel>
                <Input
                  value={basics.slug}
                  onChange={(e) => setBasics((f) => ({ ...f, slug: e.target.value }))}
                  borderColor="#1f2937"
                  _focus={{ borderColor: '#111827', boxShadow: '0 0 0 1px #111827' }}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Navbar</FormLabel>
                <Select value={brand.layoutNav || 'classic'} onChange={(e) => setBrand((b) => ({ ...b, layoutNav: e.target.value }))}>
                  {navVariants.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Hero</FormLabel>
                <Select value={brand.layoutHero || 'classic'} onChange={(e) => setBrand((b) => ({ ...b, layoutHero: e.target.value }))}>
                  {heroVariants.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Destacados</FormLabel>
                <Select value={brand.layoutHighlight || 'split'} onChange={(e) => setBrand((b) => ({ ...b, layoutHighlight: e.target.value }))}>
                  {highlightVariants.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Categorías</FormLabel>
                <Select value={brand.layoutCategories || 'grid'} onChange={(e) => setBrand((b) => ({ ...b, layoutCategories: e.target.value }))}>
                  {categoryVariants.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </Select>
              </FormControl>
              <HStack justify="flex-end">
                <Button colorScheme="blue" onClick={saveBasics} isLoading={savingBasics}>Guardar datos</Button>
              </HStack>
            </VStack>
          </FormControl>
        </Box>
        <Box mt={6}>
          <FormControl maxW="480px">
            <FormLabel>Texto de pie de página</FormLabel>
            <Input
              value={brand.footerText || ''}
              onChange={(e) => setBrand((b) => ({ ...b, footerText: e.target.value }))}
              placeholder="Ej. © 2025 Mi tienda. Todos los derechos reservados."
            />
          </FormControl>
        </Box>
        <Box mt={6}>
          <FormControl maxW="620px">
            <FormLabel>Colores principales</FormLabel>
            <VStack align="stretch" spacing={3}>
              <HStack spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">Primario</FormLabel>
                  <Input type="color" value={brand.primaryColor || '#2563eb'} onChange={(e) => setBrand((b) => ({ ...b, primaryColor: e.target.value }))} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Texto</FormLabel>
                  <Input type="color" value={brand.textColor || '#0f172a'} onChange={(e) => setBrand((b) => ({ ...b, textColor: e.target.value }))} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Fondo página</FormLabel>
                  <Input type="color" value={brand.pageBg || '#f8fafc'} onChange={(e) => setBrand((b) => ({ ...b, pageBg: e.target.value }))} />
                </FormControl>
              </HStack>
              <HStack spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">Superficie</FormLabel>
                  <Input type="color" value={brand.surfaceColor || '#ffffff'} onChange={(e) => setBrand((b) => ({ ...b, surfaceColor: e.target.value }))} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Navbar fondo</FormLabel>
                  <Input type="color" value={brand.navBgColor || '#ffffff'} onChange={(e) => setBrand((b) => ({ ...b, navBgColor: e.target.value }))} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Navbar texto</FormLabel>
                  <Input type="color" value={brand.navTextColor || '#0f172a'} onChange={(e) => setBrand((b) => ({ ...b, navTextColor: e.target.value }))} />
                </FormControl>
              </HStack>
            </VStack>
          </FormControl>
        </Box>
      </Container>

      <Input ref={logoInputRef} type="file" accept="image/*" display="none" onChange={handleLogoChange} />
      <Input ref={bgInputRef} type="file" accept="image/*" display="none" onChange={handleBgChange} />
    </>
  )
}
