import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('🔍 Test User Empresa - Session user ID:', session.user.id)
    
    // Obtener información del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      include: { 
        empresaDesarrolladora: {
          include: {
            representanteLegal: true
          }
        } 
      }
    })

    console.log('🔍 Test User Empresa - Usuario encontrado:', {
      id: usuario?.id,
      email: usuario?.email,
      nombre: usuario?.nombre,
      empresaDesarrolladoraId: usuario?.empresaDesarrolladoraId,
      empresaDesarrolladora: usuario?.empresaDesarrolladora ? {
        id: usuario.empresaDesarrolladora.id,
        nombre: usuario.empresaDesarrolladora.nombre,
        ruc: usuario.empresaDesarrolladora.ruc,
        representanteLegal: usuario.empresaDesarrolladora.representanteLegal ? {
          id: usuario.empresaDesarrolladora.representanteLegal.id,
          nombre: usuario.empresaDesarrolladora.representanteLegal.nombre
        } : null
      } : null
    })

    // Obtener todas las empresas desarrolladoras disponibles
    const empresas = await prisma.empresaDesarrolladora.findMany({
      include: {
        representanteLegal: true
      }
    })

    return NextResponse.json({
      usuario: {
        id: usuario?.id,
        email: usuario?.email,
        nombre: usuario?.nombre,
        empresaDesarrolladoraId: usuario?.empresaDesarrolladoraId,
        empresaDesarrolladora: usuario?.empresaDesarrolladora ? {
          id: usuario.empresaDesarrolladora.id,
          nombre: usuario.empresaDesarrolladora.nombre,
          ruc: usuario.empresaDesarrolladora.ruc,
          representanteLegal: usuario.empresaDesarrolladora.representanteLegal ? {
            id: usuario.empresaDesarrolladora.representanteLegal.id,
            nombre: usuario.empresaDesarrolladora.representanteLegal.nombre
          } : null
        } : null
      },
      empresasDisponibles: empresas.map(emp => ({
        id: emp.id,
        nombre: emp.nombre,
        ruc: emp.ruc,
        representanteLegal: emp.representanteLegal ? {
          id: emp.representanteLegal.id,
          nombre: emp.representanteLegal.nombre
        } : null
      })),
      tieneEmpresa: !!usuario?.empresaDesarrolladoraId
    })

  } catch (error) {
    console.error('❌ Test User Empresa - Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
} 