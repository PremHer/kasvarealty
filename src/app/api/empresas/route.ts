import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const empresas = await prisma.empresaDesarrolladora.findMany({
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

    return NextResponse.json(empresas)
  } catch (error) {
    console.error('Error al obtener empresas:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
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