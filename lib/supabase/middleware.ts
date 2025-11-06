import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const publicPaths = ["/auth", "/_next", "/_vercel", "/api", "/favicon.ico", "/placeholder.svg"]

  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  console.log("[v0] Middleware executing for path:", request.nextUrl.pathname)

  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth")
  console.log("[v0] Is auth route:", isAuthRoute)

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
    return NextResponse.redirect(url)
  }

  const isCashRoute = request.nextUrl.pathname === "/caixa"

  if (!isAuthRoute && !isCashRoute) {
    const { data: activeSessions } = await supabase.from("cash_sessions").select("id").is("closed_at", null).limit(1)

    if (!activeSessions || activeSessions.length === 0) {
      console.log("[v0] No active cash session, redirecting to cash page")
      const url = request.nextUrl.clone()
      url.pathname = "/caixa"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
