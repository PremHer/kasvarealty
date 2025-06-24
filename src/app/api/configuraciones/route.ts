import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

// GET /api/configuraciones - Obtener configuraciones
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    // Verificar permisos
    const canManageConfig = ['SUPER_ADMIN', 'ADMIN'].includes(session.user.role || '')
    if (!canManageConfig) {
      return new NextResponse('No tienes permisos para acceder a la configuración', { status: 403 })
    }

    // Obtener configuraciones desde la base de datos
    // Por ahora retornamos configuraciones por defecto
    const configuraciones = {
      general: {
        nombreSitio: 'Kasva Realty',
        descripcionSitio: 'Sistema de gestión inmobiliaria',
        moneda: 'PEN',
        zonaHoraria: 'America/Lima',
        idioma: 'es',
        tema: 'light',
        colorPrimario: '#3B82F6',
        colorSecundario: '#1E40AF',
        tipografia: 'Inter',
        logoUrl: '',
        faviconUrl: ''
      },
      email: {
        servidorSMTP: 'smtp.gmail.com',
        puertoSMTP: 587,
        usuarioSMTP: '',
        passwordSMTP: '',
        emailRemitente: 'noreply@empresa.com',
        nombreRemitente: 'Empresa Demo S.A.C.',
        usarSSL: false,
        usarTLS: true
      },
      notificaciones: {
        notificacionesEmail: true,
        notificacionesPush: false,
        notificacionesSMS: false,
        recordatoriosAutomaticos: true,
        reportesAutomaticos: false,
        alertasVentas: true,
        alertasProyectos: true
      },
      seguridad: {
        sesionTimeout: 30,
        intentosLogin: 5,
        bloqueoTemporal: true,
        requerirCambioPassword: false,
        complejidadPassword: 'MEDIA',
        autenticacionDosFactores: false
      }
    }

    return NextResponse.json(configuraciones)
  } catch (error) {
    console.error('Error al obtener configuraciones:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

// POST /api/configuraciones - Guardar configuración
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    // Verificar permisos
    const canManageConfig = ['SUPER_ADMIN', 'ADMIN'].includes(session.user.role || '')
    if (!canManageConfig) {
      return new NextResponse('No tienes permisos para modificar la configuración', { status: 403 })
    }

    const { tipo, datos } = await request.json()

    // Validar tipo de configuración
    const tiposValidos = ['general', 'email', 'notificaciones', 'seguridad']
    if (!tiposValidos.includes(tipo)) {
      return new NextResponse('Tipo de configuración inválido', { status: 400 })
    }

    // Aquí guardarías las configuraciones en la base de datos
    // Por ahora solo simulamos el guardado
    console.log(`Guardando configuración ${tipo}:`, datos)

    // Simular guardado exitoso
    return NextResponse.json({ 
      success: true, 
      message: `Configuración ${tipo} guardada correctamente` 
    })
  } catch (error) {
    console.error('Error al guardar configuración:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

// PUT /api/configuraciones - Actualizar configuración
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    // Verificar permisos
    const canManageConfig = ['SUPER_ADMIN', 'ADMIN'].includes(session.user.role || '')
    if (!canManageConfig) {
      return new NextResponse('No tienes permisos para modificar la configuración', { status: 403 })
    }

    const { tipo, datos } = await request.json()

    // Validar tipo de configuración
    const tiposValidos = ['general', 'email', 'notificaciones', 'seguridad']
    if (!tiposValidos.includes(tipo)) {
      return new NextResponse('Tipo de configuración inválido', { status: 400 })
    }

    // Aquí actualizarías las configuraciones en la base de datos
    console.log(`Actualizando configuración ${tipo}:`, datos)

    // Simular actualización exitosa
    return NextResponse.json({ 
      success: true, 
      message: `Configuración ${tipo} actualizada correctamente` 
    })
  } catch (error) {
    console.error('Error al actualizar configuración:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 