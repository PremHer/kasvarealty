import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse(
        JSON.stringify({ message: 'No autorizado' }),
        { status: 401 }
      )
    }

    // Obtener el usuario actual
    const currentUser = await prisma.usuario.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return new NextResponse(
        JSON.stringify({ message: 'No autorizado' }),
        { status: 401 }
      )
    }

    // Verificar si el usuario tiene permiso para ver empresas
    const canViewEmpresas = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL'
    ].includes(currentUser.rol)

    if (!canViewEmpresas) {
      return new NextResponse(
        JSON.stringify({ message: 'No tiene permisos para ver empresas' }),
        { status: 403 }
      )
    }

    const empresa = await prisma.empresaDesarrolladora.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!empresa) {
      return new NextResponse(
        JSON.stringify({ message: 'Empresa no encontrada' }),
        { status: 404 }
      )
    }

    return new NextResponse(
      JSON.stringify(empresa),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error al obtener empresa:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Error al obtener la empresa' }),
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const empresa = await prisma.empresaDesarrolladora.update({
      where: {
        id: params.id
      },
      data: {
        nombre,
        ruc,
        representanteLegalId,
        direccion,
        telefono,
        email,
        bancos,
        billeterasVirtuales
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
    console.error('Error al actualizar empresa:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    await prisma.empresaDesarrolladora.delete({
      where: {
        id: params.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error al eliminar empresa:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 