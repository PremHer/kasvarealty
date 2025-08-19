import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

// Función para generar número de recibo correlativo
async function generarNumeroRecibo(empresaId: string): Promise<string> {
  const fecha = new Date()
  const año = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  
  // Buscar el último recibo de la empresa en este año/mes
  const ultimoRecibo = await prisma.reciboPago.findFirst({
    where: {
      empresaDesarrolladoraId: empresaId,
      numeroRecibo: {
        startsWith: `R${año}${mes}`
      }
    },
    orderBy: {
      numeroRecibo: 'desc'
    }
  })

  let correlativo = 1
  if (ultimoRecibo) {
    const ultimoCorrelativo = parseInt(ultimoRecibo.numeroRecibo.slice(-4))
    correlativo = ultimoCorrelativo + 1
  }

  return `R${año}${mes}${String(correlativo).padStart(4, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const empresaId = searchParams.get('empresaId') || ''
    const ventaId = searchParams.get('ventaId') || ''
    const clienteId = searchParams.get('clienteId') || ''
    const vendedorId = searchParams.get('vendedorId') || ''
    const formaPago = searchParams.get('formaPago') || ''

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}

    if (search) {
      where.OR = [
        { numeroRecibo: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        { cliente: { apellido: { contains: search, mode: 'insensitive' } } },
        { cliente: { razonSocial: { contains: search, mode: 'insensitive' } } },
        { vendedor: { nombre: { contains: search, mode: 'insensitive' } } },
        { concepto: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (empresaId) where.empresaDesarrolladoraId = empresaId
    if (ventaId) where.ventaId = ventaId
    if (clienteId) where.clienteId = clienteId
    if (vendedorId) where.vendedorId = vendedorId
    if (formaPago) where.formaPago = formaPago

    // Obtener recibos
    const recibos = await prisma.reciboPago.findMany({
      where,
      include: {
        empresaDesarrolladora: {
          include: {
            representanteLegal: true
          }
        },
        venta: {
          include: {
            lote: true,
            proyecto: true
          }
        },
        cuota: true,
        cliente: true,
        vendedor: true,
        comprobantePago: true,
        creadoPorUsuario: true,
        actualizadoPorUsuario: true
      },
      orderBy: { fechaPago: 'desc' },
      skip,
      take: limit,
    })

    // Contar total
    const total = await prisma.reciboPago.count({ where })

    return NextResponse.json({
      recibos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error al obtener recibos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()

    // Validar datos requeridos
    if (!data.clienteId || !data.vendedorId || !data.montoPagado || !data.concepto) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Obtener la empresa desarrolladora del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      include: { empresaDesarrolladora: true }
    })

    if (!usuario?.empresaDesarrolladoraId) {
      return NextResponse.json(
        { error: 'Usuario no asociado a una empresa' },
        { status: 400 }
      )
    }

    // Generar número de recibo
    const numeroRecibo = await generarNumeroRecibo(usuario.empresaDesarrolladoraId)

    // Crear el recibo
    const recibo = await prisma.reciboPago.create({
      data: {
        numeroRecibo,
        empresaDesarrolladoraId: usuario.empresaDesarrolladoraId,
        ventaId: data.ventaId || null,
        cuotaId: data.cuotaId || null,
        clienteId: data.clienteId,
        vendedorId: data.vendedorId,
        montoPagado: data.montoPagado,
        formaPago: data.formaPago,
        metodoPago: data.metodoPago,
        concepto: data.concepto,
        fechaPago: data.fechaPago ? new Date(data.fechaPago) : new Date(),
        observaciones: data.observaciones,
        comprobantePagoId: data.comprobantePagoId || null,
        createdBy: session.user.id,
      },
      include: {
        empresaDesarrolladora: {
          include: {
            representanteLegal: true
          }
        },
        venta: {
          include: {
            lote: true,
            proyecto: true
          }
        },
        cuota: true,
        cliente: true,
        vendedor: true,
        comprobantePago: true,
        creadoPorUsuario: true,
      }
    })

    return NextResponse.json(recibo, { status: 201 })
  } catch (error) {
    console.error('Error al crear recibo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 