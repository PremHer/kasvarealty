import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Redirigir /projects a /dashboard/projects
    if (req.nextUrl.pathname === '/projects') {
      return NextResponse.redirect(new URL('/dashboard/projects', req.url))
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects",
    "/proyectos/:path*",
    "/ventas/:path*",
    "/finanzas/:path*",
  ]
} 