import { useCallback, useEffect, useMemo, useState, useRef, type ChangeEvent } from 'react'
import {
  Box, Button, Heading, HStack, VStack, Input, List, ListItem, Text, Spinner, useToast,
  Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure,
  FormControl, FormLabel, Textarea, NumberInput, NumberInputField, Select,
  SimpleGrid, Card, CardHeader, CardBody, IconButton, Divider, Image, Badge
} from '@chakra-ui/react'
import { DeleteIcon, EditIcon, AddIcon, CheckCircleIcon } from '@chakra-ui/icons'
import slugify from 'slugify'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { useAdminStore } from '@/lib/useAdminStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { uiColors } from '@/components/admin/uiColors'

type Category = { id: string; name: string; slug: string; description?: string | null; imageUrl?: string | null; productsCount?: number | null }
type Product = {
  id: string
  name: string
  slug: string
  description?: string | null
  categoryId?: string
  imageUrl?: string | null
  rawImagePath?: string | null
  metadata?: any
  specifications?: { label: string; value: string }[]
  quantity?: number | null
  basePrice?: number | null
}

export default function AdminContentPage() {
  const toast = useToast()
  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { store, loading: guardLoading, error: guardError, membershipRole } = useAdminStore()
  const [catFilter, setCatFilter] = useState('')
  const [activeCat, setActiveCat] = useState<Category | null>(null)
  const [storePlan, setStorePlan] = useState<'free' | 'paid'>('free')
  const [storeForm, setStoreForm] = useState<{ name: string; slug: string }>({ name: '', slug: '' })
  const [billingLoading, setBillingLoading] = useState(false)
  const [confirmingBilling, setConfirmingBilling] = useState(false)
  const inputStyles = {
    bg: uiColors.surface,
    borderColor: uiColors.border,
    _focus: { borderColor: uiColors.accent, boxShadow: `0 0 0 1px ${uiColors.accent}` },
  }

  const resolveImageUrl = useCallback(async (pathOrUrl: string | null | undefined) => {
    if (!pathOrUrl) return null
    if (pathOrUrl.startsWith('http')) return pathOrUrl
    const { data, error } = await supabase.storage.from('product-assets').createSignedUrl(pathOrUrl, 60 * 60 * 24)
    if (error) return null
    return data?.signedUrl ?? null
  }, [supabase])

  const categoriesQuery = useQuery({
    queryKey: ['categories', store?.id],
    enabled: !!store?.id,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, image_url, is_published, products(count)')
        .eq('store_id', store?.id)
        .order('name')
      if (error) throw error
      return (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.image_url,
        productsCount: c.products?.[0]?.count ?? null,
      }))
    },
    staleTime: 1000 * 30,
  })

  const productsQuery = useQuery({
    queryKey: ['products', store?.id, activeCat?.id],
    enabled: !!store?.id && !!activeCat?.id,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, description, category_id, image_url, metadata, is_published, pricing_tiers (id, min_qty, max_qty, price)')
        .eq('store_id', store?.id)
        .eq('category_id', activeCat?.id)
        .order('name')
      if (error) throw error
      return Promise.all(
        (data || []).map(async (p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          categoryId: p.category_id,
          imageUrl: await resolveImageUrl(p.image_url),
          rawImagePath: p.image_url,
          metadata: p.metadata,
          specifications: Array.isArray(p.metadata?.specifications) ? p.metadata.specifications : [],
          quantity: typeof p.metadata?.quantity === 'number' ? p.metadata.quantity : null,
          basePrice: p.pricing_tiers?.[0]?.price ? Number(p.pricing_tiers[0].price) : null,
        }))
      )
    },
    staleTime: 1000 * 30,
  })

  const categories = categoriesQuery.data || []
  const products = productsQuery.data || []
  const categoriesLoading = categoriesQuery.isLoading
  const productsLoading = productsQuery.isLoading
  useEffect(() => {
    if (categoriesQuery.error) {
      toast({ status: 'error', title: 'No se pudieron cargar categorías' })
    }
  }, [categoriesQuery.error, toast])
  useEffect(() => {
    if (productsQuery.error) {
      toast({ status: 'error', title: 'No se pudieron cargar productos' })
    }
  }, [productsQuery.error, toast])
  const filteredCats = useMemo(
    () => categories.filter(c => c.name.toLowerCase().includes(catFilter.toLowerCase()) || c.slug.toLowerCase().includes(catFilter.toLowerCase())),
    [categories, catFilter]
  )

  useEffect(() => {
    if (!activeCat && categories.length > 0) {
      setActiveCat(categories[0])
    }
    if (activeCat && categories.length > 0 && !categories.find((c) => c.id === activeCat.id)) {
      setActiveCat(categories[0] || null)
    }
  }, [categories, activeCat])

  useEffect(() => {
    const fetchStore = async () => {
      if (!store?.id) return
      const { data, error } = await supabase
        .from('stores')
        .select('plan, name, slug')
        .eq('id', store.id)
        .maybeSingle()
      if (error) return
      setStorePlan((data?.plan as 'free' | 'paid') || 'free')
      setStoreForm({ name: data?.name || '', slug: data?.slug || '' })
    }
    fetchStore()
  }, [store?.id, supabase, router.query.billing])

  useEffect(() => {
    const sessionId = router.query.session_id as string | undefined
    if (!sessionId || confirmingBilling) return
    const confirm = async () => {
      setConfirmingBilling(true)
      try {
        const res = await fetch('/api/billing/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'No se pudo confirmar pago')
        toast({ status: 'success', title: 'Pago confirmado, plan activado' })
        const { data } = await supabase
          .from('stores')
          .select('plan, name, slug')
          .eq('id', store?.id)
          .maybeSingle()
        if (data) {
          setStorePlan((data.plan as 'free' | 'paid') || 'free')
          setStoreForm({ name: data.name || '', slug: data.slug || '' })
        }
        router.replace(`/admin/content?store=${store?.slug || ''}`)
      } catch (err: any) {
        toast({ status: 'error', title: err?.message || 'No se pudo confirmar pago' })
      } finally {
        setConfirmingBilling(false)
      }
    }
    confirm()
  }, [router.query.session_id, supabase, store?.id, store?.slug, toast, confirmingBilling, router])

  // Category modal (create/edit)
  const catModal = useDisclosure()
  const [catForm, setCatForm] = useState<Partial<Category>>({})
  const openCreateCat = () => { setCatForm({}); catModal.onOpen() }
  const openEditCat = (c: Category) => { setCatForm(c); catModal.onOpen() }
  const saveCat = async () => {
    if (!catForm.name || !catForm.slug || !store?.id) { toast({ status: 'warning', title: 'name y slug requeridos' }); return }
    const isEdit = !!catForm.id
    const payload = {
      name: catForm.name,
      slug: catForm.slug,
      description: catForm.description,
      image_url: catForm.imageUrl,
      store_id: store.id,
      is_published: true,
    }
    const res = isEdit
      ? await supabase.from('categories').update(payload).eq('id', catForm.id!).eq('store_id', store.id)
      : await supabase.from('categories').insert(payload)
    if (res.error) return toast({ status: 'error', title: res.error.message })
    toast({ status: 'success', title: isEdit ? 'Categoría actualizada' : 'Categoría creada' })
    await queryClient.invalidateQueries({ queryKey: ['categories', store.id] })
    catModal.onClose()
  }
  const deleteCat = async (c: Category) => {
    if (!confirm(`Eliminar categoría ${c.name}?`)) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id).eq('store_id', store.id)
    if (error) return toast({ status: 'error', title: 'No se pudo eliminar' })
    toast({ status: 'success', title: 'Categoría eliminada' });
    if (activeCat?.id === c.id) { setActiveCat(null) }
    await queryClient.invalidateQueries({ queryKey: ['categories', store.id] })
  }

  // Product modal (create/edit)
  const prodModal = useDisclosure()
  const makeInitialProdForm = () => ({ specifications: [{ label: '', value: '' }], basePrice: '', quantity: '', categoryId: activeCat?.id || '', name: '', slug: '', description: '', imageUrl: '' })
  const [prodForm, setProdForm] = useState<any>(makeInitialProdForm())
  const [prodStage, setProdStage] = useState<'form' | 'success'>('form')
  const [lastSavedName, setLastSavedName] = useState('')
  const prodImageInputRef = useRef<HTMLInputElement>(null)
  const catImageInputRef = useRef<HTMLInputElement>(null)
  const openCreateProd = () => {
    setProdStage('form')
    setProdForm(makeInitialProdForm())
    prodModal.onOpen()
  }
  const openEditProd = (p: any) => {
    setProdForm({
      ...p,
      imageUrl: p.rawImagePath || p.imageUrl,
      metadata: p.metadata || undefined,
      specifications: p.specifications?.length ? p.specifications : [{ label: '', value: '' }],
      quantity: typeof p.quantity === 'number' ? p.quantity : '',
      basePrice: typeof p.basePrice === 'number' ? p.basePrice : '',
      categoryId: p.categoryId || activeCat?.id || '',
    })
    setProdStage('form')
    prodModal.onOpen()
  }
  const saveProd = async () => {
    if (!store?.id) return
    const categoryId = prodForm.categoryId || activeCat?.id
    if (!categoryId) { toast({ status: 'warning', title: 'Selecciona una categoría' }); return }
    if (!prodForm.name || !prodForm.slug) { toast({ status: 'warning', title: 'name y slug requeridos' }); return }
    const isEdit = !!prodForm.id
    const metadata = {
      ...(prodForm.metadata || {}),
      quantity: prodForm.quantity === '' ? null : Number(prodForm.quantity),
      specifications: Array.isArray(prodForm.specifications) ? prodForm.specifications.filter((s: any) => s.label || s.value) : [],
    }
    const payload: any = {
      store_id: store.id,
      category_id: categoryId,
      name: prodForm.name,
      slug: prodForm.slug,
      description: prodForm.description,
      image_url: prodForm.imageUrl || null,
      metadata,
      is_published: true,
    }
    let productId = prodForm.id as string | undefined
    if (isEdit) {
      const { error } = await supabase.from('products').update(payload).eq('id', productId!).eq('store_id', store.id)
      if (error) return toast({ status: 'error', title: error.message })
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select('id').single()
      if (error) return toast({ status: 'error', title: error.message })
      productId = data?.id
    }

    if (productId) {
      await supabase.from('pricing_tiers').delete().eq('product_id', productId).eq('store_id', store.id)
      if (prodForm.basePrice !== '' && !isNaN(Number(prodForm.basePrice))) {
        const tier = {
          store_id: store.id,
          product_id: productId,
          min_qty: 1,
          max_qty: null,
          price: Number(prodForm.basePrice || 0),
        }
        const { error: tiersError } = await supabase.from('pricing_tiers').insert([tier])
        if (tiersError) toast({ status: 'warning', title: 'Producto guardado, pero hubo errores con el precio' })
      }
    }

    const targetCat = categories.find((c) => c.id === categoryId) || null
    if (targetCat) setActiveCat(targetCat)
    toast({ status: 'success', title: isEdit ? 'Producto actualizado' : 'Producto creado' })
    await queryClient.invalidateQueries({ queryKey: ['products', store.id, categoryId] })
    await queryClient.invalidateQueries({ queryKey: ['categories', store.id] })
    setLastSavedName(prodForm.name || '')
    setProdStage('success')
  }
  const deleteProd = async (p: any) => {
    if (!confirm(`Eliminar producto ${p.name}?`)) return
    await supabase.from('pricing_tiers').delete().eq('product_id', p.id).eq('store_id', store.id)
    const { error } = await supabase.from('products').delete().eq('id', p.id).eq('store_id', store.id)
    if (error) return toast({ status: 'error', title: 'No se pudo eliminar' })
    toast({ status: 'success', title: 'Producto eliminado' })
    if (activeCat) {
      await queryClient.invalidateQueries({ queryKey: ['products', store.id, activeCat.id] })
    }
    await queryClient.invalidateQueries({ queryKey: ['categories', store.id] })
  }

  // Helpers for specifications
  const addSpecRow = () => setProdForm((f: any) => ({ ...f, specifications: [...(f.specifications || []), { label: '', value: '' }] }))
  const updateSpecRow = (i: number, field: 'label' | 'value', val: string) =>
    setProdForm((f: any) => ({
      ...f,
      specifications: (f.specifications || []).map((s: any, idx: number) => idx === i ? { ...s, [field]: val } : s),
    }))
  const removeSpecRow = (i: number) =>
    setProdForm((f: any) => ({
      ...f,
      specifications: (f.specifications || []).filter((_: any, idx: number) => idx !== i),
    }))

  const closeProdModal = () => {
    setProdStage('form')
    setLastSavedName('')
    prodModal.onClose()
  }

  const startCheckout = async () => {
    if (!store?.id) return
    setBillingLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'No se pudo iniciar pago')
      if (json?.url) {
        window.location.href = json.url
      } else {
        throw new Error('URL de checkout no recibida')
      }
    } catch (err: any) {
      toast({ status: 'error', title: err?.message || 'Error iniciando pago' })
    } finally {
      setBillingLoading(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  if (guardLoading || !store) {
    return (
      <Box p={6}>
        <HStack><Spinner /><Text>{guardError || 'Cargando panel...'}</Text></HStack>
      </Box>
    )
  }

  const uploadFile = async (file: File) => {
    if (!store?.id) throw new Error('Tienda no encontrada')
    const path = `${store.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('product-assets').upload(path, file, { cacheControl: '3600', upsert: true })
    if (uploadError) throw uploadError
    await supabase.from('media_assets').insert({
      store_id: store.id,
      bucket: 'product-assets',
      object_path: path,
      content_type: file.type,
      bytes: file.size,
    })
    const signed = await supabase.storage.from('product-assets').createSignedUrl(path, 60 * 60 * 24 * 7)
    return { path, url: signed.data?.signedUrl || null }
  }

  return (
    <AdminLayout
      active="content"
      store={store}
      sessionEmail={session?.user?.email || ''}
      membershipRole={membershipRole}
      storePlan={storePlan}
      onUpgrade={startCheckout}
      billingLoading={billingLoading}
      onLogout={logout}
      onViewSite={`/store/${storeForm.slug || store.slug}`}
    >
      <>
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="lg" color={uiColors.text}>Gestión de Contenido</Heading>
          <HStack>
            <Button onClick={openCreateProd} leftIcon={<AddIcon />} bg={uiColors.accentSecondary} color="white" _hover={{ bg: '#0284c7' }}>
              Nuevo producto
            </Button>
            <Button onClick={openCreateCat} leftIcon={<AddIcon />} bg={uiColors.accent} color="white" _hover={{ bg: '#1d4ed8' }}>
              Nueva categoría
            </Button>
            <Button variant="ghost" onClick={logout} color={uiColors.subtext} _hover={{ color: uiColors.text, bg: uiColors.accentSoft }}>
              Salir
            </Button>
          </HStack>
        </HStack>
        <HStack align="start" spacing={6}>
          <Box w={{ base: '100%', md: '320px' }}>
            <Input
              placeholder="Buscar categorías"
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              mb={3}
              bg="white"
              borderColor={uiColors.border}
            />
            <Box borderWidth="1px" borderColor={uiColors.border} borderRadius="md" overflow="hidden" maxH="70vh" overflowY="auto" bg={uiColors.panel} boxShadow="md">
              {categoriesLoading ? (
                <HStack p={3}><Spinner size="sm" /><Text color={uiColors.subtext}>Cargando categorías...</Text></HStack>
              ) : (
                <List>
                  {filteredCats.map((c) => (
                    <ListItem
                      key={c.id}
                      px={3}
                      py={2}
                      _hover={{ bg: uiColors.accentSoft }}
                      bg={activeCat?.id === c.id ? uiColors.accentSoft : 'transparent'}
                      borderBottom="1px solid"
                      borderColor={uiColors.border}
                    >
                      <HStack justify="space-between">
                        <Box onClick={() => setActiveCat(c)} cursor="pointer">
                          <Text fontWeight="semibold" color={uiColors.text}>{c.name}</Text>
                          <Text fontSize="xs" color={uiColors.subtext}>/{c.slug} · {c.productsCount ?? '-'} productos</Text>
                        </Box>
                        <HStack>
                          <IconButton aria-label="Editar" icon={<EditIcon />} size="sm" onClick={() => openEditCat(c)} variant="ghost" colorScheme="blue" />
                          <IconButton aria-label="Eliminar" icon={<DeleteIcon />} size="sm" onClick={() => deleteCat(c)} variant="ghost" colorScheme="red" />
                        </HStack>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>

          <Box flex="1">
            {!activeCat ? (
              <Text color={uiColors.subtext}>Selecciona una categoría para ver sus productos.</Text>
            ) : (
              <>
                <HStack justify="space-between" mb={3}>
                  <Heading size="md" color={uiColors.text}>{activeCat.name}</Heading>
                </HStack>
                {productsLoading && products.length === 0 ? (
                  <HStack><Spinner /><Text>Cargando...</Text></HStack>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {products.map((p) => (
                      <Card key={p.id} bg={uiColors.surface} border="1px solid" borderColor={uiColors.border} boxShadow="md">
                        <CardHeader borderBottom="1px solid" borderColor={uiColors.border} pb={2}>
                          <HStack justify="space-between">
                            <Heading size="sm" color={uiColors.text}>{p.name}</Heading>
                            <HStack>
                              <IconButton aria-label="Editar" icon={<EditIcon />} size="sm" onClick={() => openEditProd(p)} variant="ghost" colorScheme="blue" />
                              <IconButton aria-label="Eliminar" icon={<DeleteIcon />} size="sm" onClick={() => deleteProd(p)} variant="ghost" colorScheme="red" />
                            </HStack>
                          </HStack>
                        </CardHeader>
                        <CardBody>
                          <Text color={uiColors.subtext}>/{p.slug}</Text>
                          <Text fontSize="sm" color={uiColors.text}>
                            Cantidad: <Box as="span" color={uiColors.subtext}>{p.quantity ?? '-'}</Box>
                          </Text>
                          <Text fontSize="sm" color={uiColors.text}>
                            Precio: <Box as="span" color={uiColors.subtext}>{p.basePrice != null ? `$${p.basePrice}` : '-'}</Box>
                          </Text>
                          {p.specifications && p.specifications.length > 0 && (
                            <Box mt={2}>
                              <Text fontSize="sm" fontWeight="semibold" color={uiColors.text}>Especificaciones:</Text>
                              {p.specifications.map((s, idx) => (
                                <Text key={`${p.id}-spec-${idx}`} fontSize="sm" color={uiColors.subtext}>
                                  {s.label}: {s.value}
                                </Text>
                              ))}
                            </Box>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </>
            )}
          </Box>
        </HStack>
      </Box>
      {/* Category Modal */}
      <Modal isOpen={catModal.isOpen} onClose={catModal.onClose} size="4xl">
        <ModalOverlay />
        <ModalContent bg="#0f1117" color="white" border="1px solid #1f2937" boxShadow="2xl">
          <ModalHeader>{catForm.id ? 'Editar categoría' : 'Nueva categoría'}</ModalHeader>
          <ModalBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={0} borderRadius="lg" overflow="hidden" border="1px solid #1f2937">
              <Box p={5} bg="#0b0d13" borderRight={{ base: 'none', md: '1px solid #1f2937' }}>
                <Badge colorScheme="purple" borderRadius="full" px={3} py={1} textTransform="uppercase" fontSize="xs">
                  Categoría
                </Badge>
                <Box
                  mt={6}
                  border="1px solid #1f2937"
                  borderRadius="md"
                  bg="#111827"
                  minH="260px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={() => catImageInputRef.current?.click()}
                >
                  {catForm.imageUrl ? (
                    <Image src={catForm.imageUrl} alt={catForm.name || 'Categoría'} objectFit="contain" maxH="240px" />
                  ) : (
                    <Text color="gray.400">Haz clic para subir una imagen</Text>
                  )}
                </Box>
                <Text mt={3} fontSize="sm" color="gray.400">
                  Usa una imagen representativa de la categoría.
                </Text>
                <Input
                  ref={catImageInputRef}
                  type="file"
                  accept="image/*"
                  display="none"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const up = await uploadFile(file)
                      setCatForm((f) => ({ ...f, imageUrl: up.path }))
                      toast({ status: 'success', title: 'Imagen subida' })
                    } catch (err: any) { toast({ status: 'error', title: err.message }) }
                  }}
                />
              </Box>
              <Box p={6} bg="#111827">
                <VStack align="stretch" spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.300">Nombre</FormLabel>
                    <Input
                      value={catForm.name || ''}
                      onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value || '', { lower: true, strict: true }) }))}
                      bg="#0f172a"
                      borderColor="#1f2937"
                      color="white"
                      _focus={{ borderColor: '#2de4ff', boxShadow: '0 0 0 1px #2de4ff' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.300">Slug</FormLabel>
                    <Input
                      value={catForm.slug || ''}
                      onChange={(e) => setCatForm((f) => ({ ...f, slug: e.target.value }))}
                      bg="#0f172a"
                      borderColor="#1f2937"
                      color="white"
                      _focus={{ borderColor: '#2de4ff', boxShadow: '0 0 0 1px #2de4ff' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.300">Descripción</FormLabel>
                    <Textarea
                      value={catForm.description || ''}
                      onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
                      bg="#0f172a"
                      borderColor="#1f2937"
                      color="white"
                      _focus={{ borderColor: '#2de4ff', boxShadow: '0 0 0 1px #2de4ff' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.300">Imagen (URL o path)</FormLabel>
                    <Input
                      value={catForm.imageUrl || ''}
                      onChange={(e) => setCatForm((f) => ({ ...f, imageUrl: e.target.value }))}
                      bg="#0f172a"
                      borderColor="#1f2937"
                      color="white"
                      _focus={{ borderColor: '#2de4ff', boxShadow: '0 0 0 1px #2de4ff' }}
                    />
                  </FormControl>
                </VStack>
              </Box>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button variant="ghost" onClick={catModal.onClose}>Cancelar</Button>
              <Button colorScheme="blue" onClick={saveCat}>Guardar</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Product Modal */}
      <Modal isOpen={prodModal.isOpen} onClose={closeProdModal} size="6xl">
        <ModalOverlay />
        <ModalContent bg="#0f1117" color="white" border="1px solid #1f2937" boxShadow="2xl">
          <ModalHeader>{prodForm.id ? 'Editar producto' : 'Nuevo producto'}</ModalHeader>
          <ModalBody>
              {prodStage === 'success' ? (
                <Box bg="#0b0d13" border="1px solid #1f2937" borderRadius="lg" p={6} textAlign="center">
                  <CheckCircleIcon w={14} h={14} color="green.400" mb={3} />
                  <Heading size="lg" mb={2}>{lastSavedName || 'Producto guardado'}</Heading>
                  <Text color="gray.300" mb={4}>
                    Listo para tu catálogo. Puedes agregar otro o cerrar.
                  </Text>
                  <Divider borderColor="#1f2937" mb={4} />
                  <HStack spacing={4} justify="center">
                    <Button bg={uiColors.accent} color="white" _hover={{ bg: '#1d4ed8' }} onClick={openCreateProd}>
                      Agregar otro
                    </Button>
                    <Button variant="outline" borderColor="#1f2937" color="white" _hover={{ bg: '#1f2937' }} onClick={closeProdModal}>
                      Cerrar
                    </Button>
                  </HStack>
                </Box>
              ) : (
              <Box bg="#0c0f17" borderRadius="lg" border="1px solid #1f2937" overflow="hidden">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={0}>
                  <Box p={6} borderRight={{ base: 'none', md: '1px solid #1f2937' }} position="relative" bg="#0b0d13">
                    <Badge colorScheme="purple" borderRadius="full" px={3} py={1} position="absolute" top={3} left={3} textTransform="uppercase" fontSize="xs">
                      Producto
                    </Badge>
                    <Box
                      mt={10}
                      border="1px solid #1f2937"
                      borderRadius="md"
                      bg="#111827"
                      minH="320px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      onClick={() => prodImageInputRef.current?.click()}
                    >
                      {prodForm.imageUrl ? (
                        <Image src={prodForm.imageUrl} alt={prodForm.name || 'Producto'} objectFit="contain" maxH="200px" />
                      ) : (
                        <Text color="gray.400">Haz clic para subir una imagen</Text>
                      )}
                    </Box>
                    <Text mt={4} fontSize="sm" color="gray.400">
                      Usa imágenes apaisadas para mejor vista.
                    </Text>
                    <Input
                      ref={prodImageInputRef}
                      type="file"
                      accept="image/*"
                      display="none"
                      onChange={async (e: ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const up = await uploadFile(file)
                          setProdForm((f: any) => ({ ...f, imageUrl: up.path }))
                          toast({ status: 'success', title: 'Imagen subida' })
                        } catch (err: any) { toast({ status: 'error', title: err.message }) }
                      }}
                    />
                  </Box>

                  <Box p={6} bg="#111827">
                    <VStack align="stretch" spacing={4}>
                      <Input
                        value={prodForm.name || ''}
                        placeholder="Nombre del producto"
                        onChange={(e) => setProdForm((f: any) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value || '', { lower: true, strict: true }) }))}
                        bg="#0f172a"
                        borderColor="#1f2937"
                        color="#2de4ff"
                        fontWeight="bold"
                        _focus={{ borderColor: '#2de4ff', boxShadow: '0 0 0 1px #2de4ff' }}
                      />
                      <Input
                        value={prodForm.slug || ''}
                        placeholder="Slug"
                        onChange={(e) => setProdForm((f: any) => ({ ...f, slug: e.target.value }))}
                        bg="#0f172a"
                        borderColor="#1f2937"
                        color="white"
                        _focus={{ borderColor: '#2de4ff', boxShadow: '0 0 0 1px #2de4ff' }}
                      />
                      <Textarea
                        value={prodForm.description || ''}
                        placeholder="Descripción"
                        onChange={(e) => setProdForm((f: any) => ({ ...f, description: e.target.value }))}
                        bg="#0f172a"
                        borderColor="#1f2937"
                        color="white"
                        _focus={{ borderColor: '#2de4ff', boxShadow: '0 0 0 1px #2de4ff' }}
                      />
                      <HStack spacing={3}>
                        <Box flex="1">
                          <Text fontSize="xs" color="gray.400">Cantidad</Text>
                          <NumberInput value={prodForm.quantity ?? ''} onChange={(_, v) => setProdForm((f: any) => ({ ...f, quantity: isNaN(v) ? '' : v }))}>
                            <NumberInputField bg="#0f172a" borderColor="#1f2937" color="white" _focus={{ borderColor: '#2de4ff', boxShadow: '0 0 0 1px #2de4ff' }} />
                          </NumberInput>
                        </Box>
                        <Box flex="1">
                          <Text fontSize="xs" color="gray.400">Precio</Text>
                          <NumberInput value={prodForm.basePrice ?? ''} precision={2} onChange={(_, v) => setProdForm((f: any) => ({ ...f, basePrice: isNaN(v) ? '' : v }))}>
                            <NumberInputField bg="#0f172a" borderColor="#1f2937" color="white" _focus={{ borderColor: '#2de4ff', boxShadow: '0 0 0 1px #2de4ff' }} />
                          </NumberInput>
                        </Box>
                      </HStack>
                      <FormControl>
                        <FormLabel fontSize="sm" color="gray.300">Categoría</FormLabel>
                        <Select
                          placeholder="Selecciona categoría"
                          value={prodForm.categoryId || ''}
                          onChange={(e) => setProdForm((f: any) => ({ ...f, categoryId: e.target.value }))}
                          bg="#0f172a"
                          borderColor="#1f2937"
                          color="white"
                          _focus={{ borderColor: '#2de4ff', boxShadow: '0 0 0 1px #2de4ff' }}
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm" color="gray.300">Especificaciones</FormLabel>
                        <Text fontSize="sm" color="gray.500" mb={1}>
                          Usa pares “Etiqueta / Valor”. Ej: Material = Acero, Tamaño = 30cm.
                        </Text>
                        <VStack align="stretch" spacing={2}>
                          {(prodForm.specifications || []).map((spec: any, idx: number) => (
                            <HStack key={idx} align="flex-start">
                              <Input
                                placeholder="Etiqueta"
                                value={spec.label}
                                onChange={(e) => updateSpecRow(idx, 'label', e.target.value)}
                                bg="#0f172a"
                                borderColor="#1f2937"
                                color="white"
                                _focus={{ borderColor: '#2de4ff', boxShadow: '0 0 0 1px #2de4ff' }}
                              />
                              <Input
                                placeholder="Valor"
                                value={spec.value}
                                onChange={(e) => updateSpecRow(idx, 'value', e.target.value)}
                                bg="#0f172a"
                                borderColor="#1f2937"
                                color="white"
                                _focus={{ borderColor: '#2de4ff', boxShadow: '0 0 0 1px #2de4ff' }}
                              />
                              <IconButton aria-label="Quitar especificación" icon={<DeleteIcon />} size="sm" onClick={() => removeSpecRow(idx)} />
                            </HStack>
                          ))}
                          <Button size="sm" onClick={addSpecRow} leftIcon={<AddIcon />} bg={uiColors.accentSecondary} color="white" _hover={{ bg: '#0284c7' }}>
                            Agregar especificación
                          </Button>
                        </VStack>
                      </FormControl>
                    </VStack>
                  </Box>
                </SimpleGrid>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack>
              {prodStage === 'success' ? (
                <Button bg={uiColors.accent} color="white" _hover={{ bg: '#1d4ed8' }} onClick={closeProdModal}>Listo</Button>
              ) : (
                <>
                  <Button variant="ghost" bg={uiColors.accentSoft} color={uiColors.text} _hover={{ bg: '#d8e4ff' }} onClick={closeProdModal}>Cancelar</Button>
                  <Button bg={uiColors.accent} color="white" _hover={{ bg: '#1d4ed8' }} onClick={saveProd}>Guardar</Button>
                </>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </>
    </AdminLayout>
  )
}
