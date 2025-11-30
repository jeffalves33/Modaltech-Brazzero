// lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const publicPaths = ["/auth", "/_next", "/_vercel", "/api", "/favicon.ico", "/placeholder.svg"]

  const pathname = request.nextUrl.pathname

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  console.log("[modalteck] Middleware executing for path:", pathname)

  const isAuthRoute = pathname.startsWith("/auth")
  const isCashRoute = pathname === "/caixa"
  const isAdminRoute = pathname.startsWith("/admin")

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    console.log("[modaltech] No user, redirecting to /auth/login")
    return NextResponse.redirect(url)
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    console.log("[modaltech] No profile found for user, redirecting to /auth/login", profileError)
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  const role = String(profile.role || "").toLowerCase()
  const isAdmin = role === "admin"

  console.log("[modaltech] Authenticated user:", {
    id: user.id,
    email: user.email,
    role,
    pathname,
  })

  // ⚠️ Regra 1: se for rota /admin e NÃO for admin → manda pra /caixa
  if (isAdminRoute && !isAdmin) {
    console.log("[modaltech] Non-admin attempting to access /admin, redirecting to /caixa")
    const url = request.nextUrl.clone()
    url.pathname = "/caixa"
    return NextResponse.redirect(url)
  }

  // ⚠️ Regra 2: regra de caixa aberta só vale para OPERADOR
  // - Não é rota de auth
  // - Não é /caixa
  // - Não é rota /admin
  // - E só se NÃO for admin
  if (!isAuthRoute && !isCashRoute && !isAdminRoute && !isAdmin) {
    const { data: activeSessions, error: cashError } = await supabase
      .from("cash_sessions")
      .select("id")
      .is("closed_at", null)
      .limit(1)

    if (cashError) {
      console.log("[modaltech] Error fetching cash_sessions:", cashError)
    }

    if (!activeSessions || activeSessions.length === 0) {
      console.log("[modaltech] No active cash session for operator, redirecting to /caixa",)
      const url = request.nextUrl.clone()
      url.pathname = "/caixa"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
