import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { CreateClienteData } from '@/types/cliente'
import { Prisma, TipoCliente, Sexo, EstadoCivil, TipoDireccion } from '@prisma/client'

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

    const where: Prisma.ClienteWhereInput = {
      AND: [
        // Búsqueda por nombre, apellido o email
        search
          ? {
              OR: [
                { nombre: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { apellido: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
              ],
            }
          : {},
        // Filtro por tipo
        tipo ? { tipo: tipo as TipoCliente } : {},
      ],
    }

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        direcciones: true,
        ventas: true,
        creadoPor: {
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
      tipo,
      dni,
      fechaNacimiento,
      estadoCivil,
      ocupacion,
      razonSocial,
      ruc,
      representanteLegal,
      cargoRepresentante,
      sexo,
      direcciones,
    } = body

    // Validar campos requeridos según el tipo
    if (tipo === 'INDIVIDUAL') {
      if (!nombre || !apellido) {
        return NextResponse.json(
          { error: 'Nombre y apellido son requeridos para clientes individuales' },
          { status: 400 }
        )
      }
    } else if (tipo === 'EMPRESA') {
      if (!razonSocial || !ruc) {
        return NextResponse.json(
          { error: 'Razón social y RUC son requeridos para empresas' },
          { status: 400 }
        )
      }
    }

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
        tipo: tipo as TipoCliente,
        email,
        telefono: telefono || undefined,
        // Campos para cliente individual
        nombre: tipo === 'INDIVIDUAL' ? nombre : '',
        apellido: tipo === 'INDIVIDUAL' ? apellido : '',
        sexo: tipo === 'INDIVIDUAL' ? sexo as Sexo : undefined,
        dni: tipo === 'INDIVIDUAL' ? dni || undefined : undefined,
        fechaNacimiento: tipo === 'INDIVIDUAL' && fechaNacimiento ? new Date(fechaNacimiento) : undefined,
        estadoCivil: tipo === 'INDIVIDUAL' ? estadoCivil as EstadoCivil : undefined,
        ocupacion: tipo === 'INDIVIDUAL' ? ocupacion || undefined : undefined,
        // Campos para empresa
        razonSocial: tipo === 'EMPRESA' ? razonSocial : '',
        ruc: tipo === 'EMPRESA' ? ruc : undefined,
        representanteLegal: tipo === 'EMPRESA' ? representanteLegal : '',
        cargoRepresentante: tipo === 'EMPRESA' ? cargoRepresentante || undefined : undefined,
        // Relaciones
        creadoPorId: session.user.id,
        direcciones: {
          create: direcciones?.map((dir: any) => ({
            tipo: dir.tipo as TipoDireccion,
            pais: dir.pais,
            ciudad: dir.ciudad,
            direccion: dir.direccion,
            referencia: dir.referencia,
          })) || [],
        },
      },
      include: {
        direcciones: true,
        ventas: true,
        creadoPor: {
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0]
        if (field === 'ruc') {
          return NextResponse.json(
            { error: 'El RUC ya está registrado en el sistema' },
            { status: 400 }
          )
        } else if (field === 'email') {
          return NextResponse.json(
            { error: 'El email ya está registrado en el sistema' },
            { status: 400 }
          )
        } else if (field === 'dni') {
          return NextResponse.json(
            { error: 'El DNI ya está registrado en el sistema' },
            { status: 400 }
          )
        }
      }
    }
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
} 