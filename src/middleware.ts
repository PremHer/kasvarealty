import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Redirigir /projects a /dashboard/projects
    if (req.nextUrl.pathname === '/projects') {
      return NextResponse.redirect(new URL('/dashboard/projects', req.url))
    }

    // Redirigir /clientes a /dashboard/clientes
    if (req.nextUrl.pathname === '/clientes') {
      return NextResponse.redirect(new URL('/dashboard/clientes', req.url))
    }

    // Proteger rutas de proyectos
    if (req.nextUrl.pathname.startsWith('/dashboard/projects')) {
      const token = req.nextauth.token
      console.log('Token en middleware:', token) // Log para depuración

      if (!token) {
        console.log('No hay token, redirigiendo a signin') // Log para depuración
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }

      // Verificar si el usuario tiene permiso para ver proyectos
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL', 'PROJECT_MANAGER', 'SALES_MANAGER']
      console.log('Rol del usuario:', token.role) // Log para depuración
      
      if (!allowedRoles.includes(token.role as string)) {
        console.log('Rol no permitido, redirigiendo a dashboard') // Log para depuración
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Proteger rutas de ventas
    if (req.nextUrl.pathname.startsWith('/dashboard/ventas')) {
      const token = req.nextauth.token

      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }

      // Verificar si el usuario tiene permiso para ver ventas
      const allowedRoles = ['SUPER_ADMIN', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT']
      
      if (!allowedRoles.includes(token.role as string)) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Proteger rutas de comisiones
    if (req.nextUrl.pathname.startsWith('/dashboard/comisiones')) {
      const token = req.nextauth.token

      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }

      // Verificar si el usuario tiene permiso para gestionar comisiones
      const allowedRoles = ['SUPER_ADMIN', 'FINANCE_MANAGER', 'SALES_MANAGER', 'ACCOUNTANT']
      
      if (!allowedRoles.includes(token.role as string)) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        console.log('Token en authorized callback:', token) // Log para depuración
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects",
    "/clientes",
    "/proyectos/:path*",
    "/ventas/:path*",
    "/finanzas/:path*",
    "/configuracion",
  ]
} 