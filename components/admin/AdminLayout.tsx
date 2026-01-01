import { ReactNode, useState } from 'react'
import { Box, Container, HStack } from '@chakra-ui/react'
import { AdminSidebar } from './AdminSidebar'
import { uiColors } from './uiColors'

type AdminLayoutProps = {
  children: ReactNode
  active?: 'content'
  store: { name: string; slug: string } | null
  sessionEmail: string
  membershipRole?: string
  storePlan?: 'free' | 'paid'
  onUpgrade?: () => void
  billingLoading?: boolean
  onLogout: () => void
  onViewSite?: string
}

export function AdminLayout({
  children,
  active,
  store,
  sessionEmail,
  membershipRole,
  storePlan,
  onUpgrade,
  billingLoading,
  onLogout,
  onViewSite,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const storeName = store?.name || ''
  const storeSlug = store?.slug || ''

  return (
    <Box minH="100vh" bgGradient={uiColors.background} color={uiColors.text} py={0}>
      <Container maxW="100%" px={0}>
        <HStack align="stretch" spacing={0} w="100%" minH="100vh">
          <AdminSidebar
            storeName={storeName}
            storeSlug={storeSlug}
            userEmail={sessionEmail}
            active={active}
            viewSlug={storeSlug}
            onLogout={onLogout}
            onViewSite={onViewSite}
            membershipRole={membershipRole}
            storePlan={storePlan}
            onUpgrade={onUpgrade}
            billingLoading={billingLoading}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          />

          <Box
            flex="1"
            bg={uiColors.panel}
            borderRadius="2xl"
            p={{ base: 4, md: 6 }}
            boxShadow="2xl"
            border="1px solid"
            borderColor={uiColors.border}
            ml={{ base: 0, md: collapsed ? 2 : 4 }}
            mr={{ base: 0, md: 4 }}
            transition="margin 0.2s ease"
          >
            {children}
          </Box>
        </HStack>
      </Container>
    </Box>
  )
}
