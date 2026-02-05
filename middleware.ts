import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/user', '/expert', '/admin']
const AUTH_ROUTES = ['/login', '/register', '/forgot-password']

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Do not run on static files
    if (
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/api') ||
        request.nextUrl.pathname.startsWith('/static') ||
        request.nextUrl.pathname.includes('.')
    ) {
        return supabaseResponse
    }

    // Refresh auth token and get user
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Redirect unauthenticated users away from protected routes
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    if (isProtectedRoute && !user) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users away from auth pages (login, register)
    if (user && AUTH_ROUTES.some(route => pathname.startsWith(route))) {
        // Fetch role to redirect to correct dashboard
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role || 'client'
        const dashboardUrl = role === 'admin' ? '/admin' : role === 'expert' ? '/expert' : '/user'
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }

    return supabaseResponse
}

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
