import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Prisma, TipoCliente, Sexo, EstadoCivil, TipoDireccion } from '@prisma/client'

// GET /api/clientes - Obtener lista de clientes
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos para ver clientes
    const allowedRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL',
      'SALES_MANAGER',
      'SALES_REP',
      'SALES_ASSISTANT',
      'PROJECT_MANAGER',
      'FINANCE_MANAGER'
    ]
    
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para ver clientes' }, { status: 403 })
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
        tipo ? { tipoCliente: tipo as TipoCliente } : {},
      ],
    }

    const clientes = await prisma.cliente.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        direcciones: true,
        ventas: true,
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

    // Verificar permisos para crear clientes
    const allowedRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL',
      'SALES_MANAGER',
      'SALES_REP',
      'SALES_ASSISTANT'
    ]
    
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear clientes' }, { status: 403 })
    }

    const body = await request.json()
    console.log('API recibió:', body)
    const {
      nombre,
      apellido,
      email,
      telefono,
      tipoCliente,
      dni,
      fechaNacimiento,
      estadoCivil,
      razonSocial,
      ruc,
      representanteLegal,
      cargoRepresentante,
      sexo,
      direcciones,
    } = body
    
    console.log('tipoCliente extraído:', tipoCliente)

    // Validar campos requeridos según el tipo
    if (tipoCliente === 'INDIVIDUAL') {
      if (!nombre || !apellido) {
        return NextResponse.json(
          { error: 'Nombre y apellido son requeridos para clientes individuales' },
          { status: 400 }
        )
      }
    } else if (tipoCliente === 'EMPRESA') {
      if (!razonSocial || !ruc) {
        return NextResponse.json(
          { error: 'Razón social y RUC son requeridos para empresas' },
          { status: 400 }
        )
      }
    }

    // Verificar si el email ya existe
    if (email) {
      const existingEmail = await prisma.cliente.findUnique({
        where: { email },
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        )
      }
    }

    // Verificar si el DNI o RUC ya existe según el tipo
    if (tipoCliente === 'INDIVIDUAL' && dni) {
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

    if (tipoCliente === 'EMPRESA' && ruc) {
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
        tipoCliente: tipoCliente as TipoCliente,
        email: email || undefined,
        telefono: telefono || undefined,
        // Campos para cliente individual
        nombre: tipoCliente === 'INDIVIDUAL' ? nombre : '',
        apellido: tipoCliente === 'INDIVIDUAL' ? apellido : '',
        sexo: tipoCliente === 'INDIVIDUAL' ? sexo as Sexo : undefined,
        dni: tipoCliente === 'INDIVIDUAL' ? dni || undefined : undefined,
        fechaNacimiento: tipoCliente === 'INDIVIDUAL' && fechaNacimiento ? new Date(fechaNacimiento) : undefined,
        estadoCivil: tipoCliente === 'INDIVIDUAL' ? estadoCivil as EstadoCivil : undefined,
        // Campos para empresa
        razonSocial: tipoCliente === 'EMPRESA' ? razonSocial : undefined,
        ruc: tipoCliente === 'EMPRESA' ? ruc : undefined,
        representanteLegal: tipoCliente === 'EMPRESA' ? representanteLegal : undefined,
        cargoRepresentante: tipoCliente === 'EMPRESA' ? cargoRepresentante : undefined,
        // Relaciones
        createdBy: session.user.id,
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