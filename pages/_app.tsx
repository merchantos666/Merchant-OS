import { ChakraProvider } from '@chakra-ui/react';
import { CartProvider } from '@/context/CartContext';
import Layout from '@/components/Layout';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const hideLayoutFooter = (Component as any).hideLayoutFooter;
  const isAdmin = router.pathname.startsWith('/admin');
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());
  const [queryClient] = useState(() => new QueryClient());
  const isDemo = router.pathname === '/demo' || router.pathname.startsWith('/demo/');
  const isStoreRoute = router.pathname.startsWith('/store/');
  const isStoreEditor = router.pathname === '/store/[slug]/edit';
  const isStoreUi =
    isDemo ||
    (isStoreRoute && !isStoreEditor) ||
    router.pathname.startsWith('/categoria') ||
    router.pathname.startsWith('/categorias') ||
    router.pathname.startsWith('/producto');

  const storeSlugFromPath = isStoreRoute ? router.asPath.split('/')[2] : null;

  const menuTitle = isDemo
    ? 'Demo Store'
    : isStoreRoute && storeSlugFromPath
    ? decodeURIComponent(storeSlugFromPath)
    : 'Tu tienda';
  const footerText =
    isStoreRoute && (pageProps as any)?.store?.brand?.footerText
      ? (pageProps as any).store.brand.footerText
      : undefined;
  const menuHomeHref = isDemo ? '/demo' : isStoreRoute && storeSlugFromPath ? `/store/${storeSlugFromPath}` : '/';
  const menuCategoriesHref = isDemo ? '/demo/categorias' : isStoreRoute && storeSlugFromPath ? `/store/${storeSlugFromPath}` : '/categorias';
  return (
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <SessionContextProvider supabaseClient={supabaseClient} initialSession={(pageProps as any).initialSession}>
          <CartProvider>
            {isAdmin ? (
              <Component {...pageProps} />
            ) : (
              <Layout
                showStoreUi={isStoreUi}
                menuTitle={menuTitle}
                menuHomeHref={menuHomeHref}
                menuCategoriesHref={menuCategoriesHref}
                footerText={footerText}
                hideFooter={!!hideLayoutFooter}
              >
                <Component {...pageProps} />
              </Layout>
            )}
          </CartProvider>
        </SessionContextProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default MyApp;
