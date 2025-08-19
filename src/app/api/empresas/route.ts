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
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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
      billeterasVirtuales,
      // Nuevos campos bancarios
      bancoPrincipal,
      tipoCuenta,
      numeroCuenta,
      cci,
      titularCuenta,
      emailPagos
    } = body

    // Validar RUC
    if (!/^\d{11}$/.test(ruc)) {
      return NextResponse.json(
        { error: 'El RUC debe tener exactamente 11 dígitos' },
        { status: 400 }
      )
    }

    // Verificar que el representante legal tenga el rol correcto
    const representanteLegal = await prisma.usuario.findUnique({
      where: { id: representanteLegalId }
    })

    if (!representanteLegal) {
      return NextResponse.json(
        { error: 'Representante legal no encontrado' },
        { status: 404 }
      )
    }

    if (representanteLegal.rol !== 'GERENTE_GENERAL') {
      return NextResponse.json(
        { error: 'El representante legal debe tener el rol de Gerente General' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una empresa con el mismo RUC
    const empresaExistente = await prisma.empresaDesarrolladora.findUnique({
      where: { ruc }
    })

    if (empresaExistente) {
      return NextResponse.json(
        { error: 'Ya existe una empresa con este RUC' },
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
        // Nuevos campos bancarios
        bancoPrincipal,
        tipoCuenta,
        numeroCuenta,
        cci,
        titularCuenta,
        emailPagos,
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
  } catch (error: any) {
    console.error('Error al crear empresa:', error)
    
    // Manejar específicamente el error de RUC duplicado
    if (error.code === 'P2002' && error.meta?.target?.includes('ruc')) {
      return NextResponse.json(
        { error: 'Ya existe una empresa con este RUC' },
        { status: 400 }
      )
    }
    
    // Manejar otros errores de Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un registro con estos datos' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 