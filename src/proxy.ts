import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

const PROTECTED_PREFIXES = ['/dashboard', '/leads', '/pipeline', '/settings']
const AUTH_ONLY_ROUTES = ['/login', '/register', '/forgot-password']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Passa estáticos e rotas de sistema sem processar
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||
    pathname === '/auth/callback' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Cria response mutável — o @supabase/ssr precisa escrever cookies de refresh nela
  const response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Escreve nos cookies da requisição E da resposta para o @supabase/ssr
          // manter o access token fresco sem pedir novo login
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // getUser() faz o refresh do token e valida junto ao Supabase Auth server
  // (mais seguro que getSession(), que aceita tokens adulterados do cookie)
  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthOnly = AUTH_ONLY_ROUTES.some((p) => pathname.startsWith(p))

  // Rota protegida sem sessão → /login preservando destino
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Já autenticado tentando acessar login/register com convite pendente → /invite/[token]
  if (isAuthOnly && user) {
    const invite = request.nextUrl.searchParams.get('invite')
    const url = request.nextUrl.clone()
    if (invite) {
      url.pathname = `/invite/${invite}`
      url.search = ''
    } else {
      url.pathname = '/dashboard'
    }
    return NextResponse.redirect(url)
  }

  return response
}

export const proxyConfig = {
  // Roda em todas as rotas exceto assets estáticos (tratados acima por early-return)
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
