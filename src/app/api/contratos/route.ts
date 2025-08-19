import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

const CONTRATOS_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'GERENTE_GENERAL',
  'SALES_MANAGER',
  'SALES_REP',
  'SALES_ASSISTANT',
  'PROJECT_MANAGER',
  'FINANCE_MANAGER'
]

// GET /api/contratos - Obtener lista de contratos
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!CONTRATOS_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para ver contratos' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const ventaId = searchParams.get('ventaId')
    const proyectoId = searchParams.get('proyectoId')

    const where: any = {}

    if (search) {
      where.OR = [
        { numeroContrato: { contains: search, mode: 'insensitive' } },
        {
          ventaLote: {
            cliente: {
              OR: [
                { nombre: { contains: search, mode: 'insensitive' } },
                { apellido: { contains: search, mode: 'insensitive' } },
                { razonSocial: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        },
        {
          ventaUnidadCementerio: {
            cliente: {
              OR: [
                { nombre: { contains: search, mode: 'insensitive' } },
                { apellido: { contains: search, mode: 'insensitive' } },
                { razonSocial: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        }
      ]
    }

    if (ventaId) {
      where.OR = [
        { ventaLoteId: ventaId },
        { ventaUnidadCementerioId: ventaId }
      ]
    }

    if (proyectoId) {
      where.OR = [
        {
          ventaLote: {
            lote: {
              manzana: {
                proyectoId: proyectoId
              }
            }
          }
        },
        {
          ventaUnidadCementerio: {
            unidadCementerio: {
              pabellon: {
                proyectoId: proyectoId
              }
            }
          }
        }
      ]
    }

    const contratos = await prisma.contrato.findMany({
      where,
      include: {
        ventaLote: {
          include: {
            cliente: true,
            lote: true
          }
        },
        ventaUnidadCementerio: {
          include: {
            cliente: true,
            unidadCementerio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(contratos)
  } catch (error) {
    console.error('Error al obtener contratos:', error)
    return NextResponse.json(
      { error: 'Error al obtener contratos' },
      { status: 500 }
    )
  }
}

// POST /api/contratos - Crear nuevo contrato
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!CONTRATOS_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear contratos' }, { status: 403 })
    }

    const body = await request.json()
    console.log('Datos recibidos para crear contrato:', body)
    
    const { numeroContrato, ventaId, ventaTipo } = body

    // Validar datos requeridos
    if (!numeroContrato) {
      return NextResponse.json({ error: 'Número de contrato es requerido' }, { status: 400 })
    }

    if (!ventaId) {
      return NextResponse.json({ error: 'ID de venta es requerido' }, { status: 400 })
    }

    if (!ventaTipo) {
      return NextResponse.json({ error: 'Tipo de venta es requerido' }, { status: 400 })
    }

    console.log('Buscando venta:', { ventaId, ventaTipo })

    // Verificar que la venta existe
    let venta = null
    let precio = 0
    if (ventaTipo === 'LOTE') {
      venta = await prisma.ventaLote.findUnique({
        where: { id: ventaId },
        include: { cliente: true }
      })
      precio = venta?.precioVenta || 0
    } else if (ventaTipo === 'UNIDAD_CEMENTERIO') {
      venta = await prisma.ventaUnidadCementerio.findUnique({
        where: { id: ventaId },
        include: { cliente: true }
      })
      precio = venta?.precioVenta || 0
    } else {
      return NextResponse.json({ error: 'Tipo de venta inválido' }, { status: 400 })
    }

    if (!venta) {
      console.log('Venta no encontrada:', { ventaId, ventaTipo })
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    console.log('Venta encontrada:', { id: venta.id, precio })

    // Verificar si existe un contrato para esta venta
    const existingContrato = await prisma.contrato.findFirst({
      where: {
        OR: [
          { ventaLoteId: ventaId },
          { ventaUnidadCementerioId: ventaId }
        ]
      }
    })

    if (existingContrato) {
      console.log('Ya existe un contrato para esta venta, actualizando:', existingContrato.id)
      
      // Actualizar el contrato existente
      const updatedContrato = await prisma.contrato.update({
        where: { id: existingContrato.id },
        data: {
          numeroContrato,
          updatedAt: new Date(),
          updatedBy: session.user.id
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Contrato actualizado correctamente',
        contrato: updatedContrato
      })
    }

    console.log('Creando contrato...')

    // Crear el contrato
    const contrato = await prisma.contrato.create({
      data: {
        numeroContrato,
        tipoContrato: ventaTipo === 'LOTE' ? 'COMPRA_VENTA_LOTE' : 'COMPRA_VENTA_UNIDAD_CEMENTERIO',
        fechaContrato: new Date(),
        precioTotal: precio,
        createdBy: session.user.id,
        ...(ventaTipo === 'LOTE' 
          ? { ventaLoteId: ventaId }
          : { ventaUnidadCementerioId: ventaId }
        )
      },
      include: {
        ventaLote: {
          include: {
            cliente: true,
            lote: true
          }
        },
        ventaUnidadCementerio: {
          include: {
            cliente: true,
            unidadCementerio: true
          }
        }
      }
    })

    console.log('Contrato creado exitosamente:', contrato.id)
    return NextResponse.json(contrato)
  } catch (error) {
    console.error('Error al crear contrato:', error)
    return NextResponse.json(
      { error: 'Error al crear contrato', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
} 