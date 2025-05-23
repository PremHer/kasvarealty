import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email! },
      select: { rol: true, id: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Construir la condición where según el rol
    let whereClause = {}
    
    if (usuario.rol === 'GERENTE_GENERAL') {
      // Gerente General solo ve empresas donde es representante legal
      whereClause = {
        representanteLegalId: usuario.id
      }
    }
    // SUPER_ADMIN y ADMIN ven todas las empresas (whereClause vacío)

    const empresas = await prisma.empresaDesarrolladora.findMany({
      where: whereClause,
      include: {
        representanteLegal: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        _count: {
          select: {
            proyectos: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    // Transformar la respuesta para incluir el número de proyectos
    const empresasConProyectos = empresas.map(empresa => ({
      ...empresa,
      numeroProyectos: empresa._count.proyectos
    }))

    return NextResponse.json(empresasConProyectos)
  } catch (error) {
    console.error('Error al obtener empresas:', error)
    return NextResponse.json(
      { error: 'Error al obtener empresas' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const body = await request.json()
    const { 
      nombre, 
      ruc, 
      representanteLegalId, 
      direccion, 
      telefono, 
      email,
      bancos,
      billeterasVirtuales
    } = body

    // Validar RUC
    if (!/^\d{11}$/.test(ruc)) {
      return new NextResponse(
        JSON.stringify({ message: 'El RUC debe tener exactamente 11 dígitos' }),
        { status: 400 }
      )
    }

    // Verificar que el representante legal tenga el rol correcto
    const representanteLegal = await prisma.usuario.findUnique({
      where: { id: representanteLegalId }
    })

    if (!representanteLegal) {
      return new NextResponse(
        JSON.stringify({ message: 'Representante legal no encontrado' }),
        { status: 404 }
      )
    }

    if (representanteLegal.rol !== 'GERENTE_GENERAL') {
      return new NextResponse(
        JSON.stringify({ message: 'El representante legal debe tener el rol de Gerente General' }),
        { status: 400 }
      )
    }

    const empresa = await prisma.empresaDesarrolladora.create({
      data: {
        nombre,
        ruc,
        representanteLegalId,
        direccion,
        telefono,
        email,
        bancos,
        billeterasVirtuales,
        numeroProyectos: 0
      },
      include: {
        representanteLegal: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(empresa)
  } catch (error) {
    console.error('Error al crear empresa:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 