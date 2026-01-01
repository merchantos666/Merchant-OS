import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { getSupabaseServerClient } from './supabaseServerClient'
import { getStoreSlugFromHost } from './store'

type WithAdminResult<T> = GetServerSidePropsResult<T & { initialSession?: any; user?: any; store?: any }>

export function withAdminSsr<T extends Record<string, any> = Record<string, any>>(
  gssp: GetServerSideProps<T>
): GetServerSideProps<T> {
  return async (ctx: GetServerSidePropsContext): Promise<WithAdminResult<T>> => {
    const supabase = getSupabaseServerClient(ctx.req as any, ctx.res as any)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user

    if (!user) {
      return { redirect: { destination: '/admin/login', permanent: false } }
    }

    const storeSlug = getStoreSlugFromHost(ctx.req?.headers?.host)
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, slug, name')
      .eq('slug', storeSlug)
      .maybeSingle()

    if (storeError || !store) {
      return { redirect: { destination: '/admin/login', permanent: false } }
    }

    const { data: membership } = await supabase
      .from('store_memberships')
      .select('role')
      .eq('store_id', store.id)
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!membership) {
      return { redirect: { destination: '/admin/login', permanent: false } }
    }

    const result = await gssp(ctx)
    if ('props' in result) {
      return {
        ...result,
        props: {
          ...result.props,
          initialSession: session,
          user,
          store,
        },
      } as WithAdminResult<T>
    }
    return result as WithAdminResult<T>
  }
}
