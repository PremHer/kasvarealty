import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { CreateClienteData } from '@/types/cliente'
import { Prisma } from '@prisma/client'

// GET /api/clientes - Obtener lista de clientes
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const tipo = searchParams.get('tipo')
    const estado = searchParams.get('estado')
    const empresaId = searchParams.get('empresaId')

    const where = {
      AND: [
        // Búsqueda por nombre, apellido o email
        search
          ? {
              OR: [
                { nombre: { contains: search, mode: 'insensitive' } },
                { apellido: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        // Filtro por tipo
        tipo ? { tipo } : {},
        // Filtro por estado
        estado ? { estado } : {},
        // Filtro por empresa
        empresaId ? { empresaId } : {},
      ],
    }

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    return NextResponse.json(clientes)
  } catch (error) {
    console.error('Error al obtener clientes:', error)
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    )
  }
}

// POST /api/clientes - Crear nuevo cliente
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      tipo,
      estado,
      dni,
      fechaNacimiento,
      estadoCivil,
      ocupacion,
      razonSocial,
      ruc,
      representanteLegal,
      cargoRepresentante,
    } = body

    // Verificar si el email ya existe
    const existingEmail = await prisma.cliente.findUnique({
      where: { email },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Verificar si el DNI o RUC ya existe según el tipo
    if (tipo === 'INDIVIDUAL' && dni) {
      const existingDNI = await prisma.cliente.findFirst({
        where: { dni },
      })
      if (existingDNI) {
        return NextResponse.json(
          { error: 'El DNI ya está registrado' },
          { status: 400 }
        )
      }
    }

    if (tipo === 'EMPRESA' && ruc) {
      const existingRUC = await prisma.cliente.findFirst({
        where: { ruc },
      })
      if (existingRUC) {
        return NextResponse.json(
          { error: 'El RUC ya está registrado' },
          { status: 400 }
        )
      }
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        apellido,
        email,
        telefono: telefono || null,
        direccion: direccion || null,
        tipo,
        estado: estado || 'ACTIVO',
        // Campos para cliente individual
        dni: dni || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        estadoCivil: estadoCivil || null,
        ocupacion: ocupacion || null,
        // Campos para empresa
        razonSocial: razonSocial || null,
        ruc: ruc || null,
        representanteLegal: representanteLegal || null,
        cargoRepresentante: cargoRepresentante || null,
        // Relaciones
        creadoPorId: session.user.id,
      },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error al crear cliente:', error)
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
} 