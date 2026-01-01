import { Avatar, Badge, Box, Button, HStack, IconButton, Text, Tooltip, VStack } from '@chakra-ui/react'
import Link from 'next/link'
import { FiChevronLeft, FiMenu } from 'react-icons/fi'
import { FaExternalLinkAlt, FaLifeRing, FaSignOutAlt, FaThLarge } from 'react-icons/fa'
import { uiColors } from './uiColors'

type SidebarProps = {
  storeName: string
  storeSlug: string
  userEmail: string
  active?: 'content'
  viewSlug: string
  onLogout: () => void
  onViewSite?: string
  membershipRole?: string
  storePlan?: 'free' | 'paid'
  onUpgrade?: () => void
  billingLoading?: boolean
  collapsed: boolean
  onToggleCollapse: () => void
}

export function AdminSidebar({
  storeName,
  storeSlug,
  userEmail,
  active,
  viewSlug,
  onLogout,
  onViewSite,
  membershipRole,
  storePlan,
  onUpgrade,
  billingLoading,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <Box
      bg="white"
      color={uiColors.text}
      borderRadius="0"
      p={collapsed ? 2.5 : 4}
      w={collapsed ? '72px' : { base: '220px', md: '280px' }}
      minW={collapsed ? '72px' : { base: '220px', md: '280px' }}
      flexShrink={0}
      boxShadow="xl"
      border="1px solid"
      borderColor="#e5e7eb"
      position="sticky"
      top="0"
      minH="100vh"
      transition="width 0.2s ease, padding 0.2s ease"
    >
      <VStack spacing={collapsed ? 3 : 5} align="stretch" h="100%">
        <HStack justify={collapsed ? 'center' : 'space-between'} align="center">
          <HStack spacing={2} align="center">
            <Avatar name={storeName} size={collapsed ? 'sm' : 'md'} />
            {!collapsed && (
              <Box>
                <Text fontWeight="semibold">{storeName}</Text>
                <Text fontSize="xs" color={uiColors.subtext}>{storeSlug}</Text>
              </Box>
            )}
          </HStack>
          <IconButton
            aria-label="Toggle sidebar"
            icon={collapsed ? <FiMenu /> : <FiChevronLeft />}
            size="sm"
            variant="ghost"
            onClick={onToggleCollapse}
          />
        </HStack>

        {!collapsed && (
          <Box>
            <Text fontSize="xs" color={uiColors.subtext}>Plan</Text>
            <Badge colorScheme={storePlan === 'paid' ? 'green' : 'gray'} borderRadius="full">{storePlan === 'paid' ? 'Pro' : 'Free'}</Badge>
          </Box>
        )}

        <VStack spacing={collapsed ? 2 : 3} align="stretch" flex="1">
          <NavButton href="/admin/content" icon={<FaThLarge />} label="Contenido" active={active === 'content'} collapsed={collapsed} />
          {storePlan === 'free' && ['owner', 'admin'].includes(membershipRole || '') && (
            <Button
              onClick={onUpgrade}
              leftIcon={<FaExternalLinkAlt />}
              bg={uiColors.accentSecondary}
              color="white"
              _hover={{ bg: '#0284c7' }}
              size="sm"
              borderRadius="lg"
              justifyContent={collapsed ? 'center' : 'flex-start'}
              isLoading={billingLoading}
            >
              {!collapsed && 'Activar plan'}
            </Button>
          )}
          <NavButton href={`/store/${viewSlug}/edit`} icon={<FaExternalLinkAlt />} label="Editar sitio" external collapsed={collapsed} />
          <NavButton href={onViewSite || `/store/${viewSlug}`} icon={<FaExternalLinkAlt />} label="Ver sitio" external collapsed={collapsed} />
          <NavButton href="mailto:soporte@example.com" icon={<FaLifeRing />} label="Soporte" external rightBadge collapsed={collapsed} />
          <NavButton href="/admin/login" icon={<FaSignOutAlt />} label="Salir" onClick={onLogout} collapsed={collapsed} />
        </VStack>

        <VStack spacing={collapsed ? 2 : 3} align="stretch">
          {!collapsed && (
            <Box borderTop="1px solid" borderColor="#e5e7eb" pt={3}>
              <HStack spacing={3} align="flex-start">
                <Avatar name={userEmail} size="sm" />
                <Box maxW="180px" overflow="hidden">
                  <Text fontWeight="semibold" fontSize="sm" isTruncated>{userEmail || storeSlug}</Text>
                  <Text fontSize="xs" color={uiColors.subtext}>Administrador</Text>
                </Box>
              </HStack>
            </Box>
          )}
          {collapsed && (
            <Tooltip label={userEmail || storeSlug} placement="right">
              <Avatar name={userEmail} size="sm" alignSelf="center" />
            </Tooltip>
          )}
        </VStack>
      </VStack>
    </Box>
  )
}

function NavButton({ href, icon, label, active, onClick, external, rightBadge, collapsed }: any) {
  return (
    <Tooltip label={collapsed ? label : ''} placement="right" openDelay={200}>
      <Button
        as={Link}
        href={href}
        target={external ? '_blank' : undefined}
        onClick={onClick}
        justifyContent={collapsed ? 'center' : 'flex-start'}
        leftIcon={icon}
        variant={active ? 'solid' : 'ghost'}
        size="sm"
        bg={active ? uiColors.accentSoft : 'transparent'}
        color={uiColors.text}
        fontWeight="semibold"
        _hover={{ bg: uiColors.accentSoft }}
        borderRadius="lg"
        px={collapsed ? 2 : 3}
        height="42px"
        position="relative"
        transition="background 0.15s ease, transform 0.15s ease"
        _active={{ transform: 'translateY(1px)' }}
      >
        {!collapsed && <Box as="span">{label}</Box>}
        {active && (
          <Box position="absolute" left="-8px" top="50%" transform="translateY(-50%)" w="4px" h="24px" borderRadius="full" bg={uiColors.accentSecondary} />
        )}
        {rightBadge && !collapsed && <Badge colorScheme="red" borderRadius="full" position="absolute" right="10px" top="50%" transform="translateY(-50%)" variant="solid" />}
      </Button>
    </Tooltip>
  )
}
