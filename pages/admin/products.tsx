import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AdminProductsPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/content') }, [router])
  return null
}
