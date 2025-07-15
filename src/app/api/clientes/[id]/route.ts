import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { UpdateClienteData, TIPO_CLIENTE, Sexo, EstadoCivil, TipoDireccion } from '@/types/cliente'
import { Prisma, TipoCliente } from '@prisma/client'

// GET /api/clientes/[id] - Obtener un cliente específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      // include: {
      //   empresa: {
      //     select: {
      //       id: true,
      //       nombre: true,
      //     },
      //   },
      // },
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error al obtener cliente:', error)
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    )
  }
}

// PATCH /api/clientes/[id] - Actualizar parcialmente un cliente
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos para actualizar clientes
    const allowedRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL',
      'SALES_MANAGER',
      'SALES_REP',
      'SALES_ASSISTANT'
    ]
    
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar clientes' }, { status: 403 })
    }

    const body = await request.json()
    const { isActive } = body

    // Verificar si el cliente existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { id: params.id },
    })

    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el estado del cliente
    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        isActive,
        updatedAt: new Date(), // Asegurar que se actualice la fecha de modificación
      },
      include: {
        direcciones: true
      }
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error al actualizar estado del cliente:', error)
    return NextResponse.json(
      { error: 'Error al actualizar estado del cliente' },
      { status: 500 }
    )
  }
}

// PUT /api/clientes/[id] - Actualizar un cliente
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos para actualizar clientes
    const allowedRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL',
      'SALES_MANAGER',
      'SALES_REP',
      'SALES_ASSISTANT'
    ]
    
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar clientes' }, { status: 403 })
    }

    const body = await request.json()
    const {
      nombre,
      apellido,
      email,
      telefono,
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
      direcciones,
      sexo,
    } = body

    // Verificar si el cliente existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        direcciones: true
      }
    })

    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el email ya existe (excluyendo el cliente actual)
    if (email !== existingCliente.email) {
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
    if (tipo === 'INDIVIDUAL' && dni && dni !== existingCliente.dni) {
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

    if (tipo === 'EMPRESA' && ruc && ruc !== existingCliente.ruc) {
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

    // Primero eliminamos las direcciones existentes
    await prisma.direccion.deleteMany({
      where: { clienteId: params.id }
    })

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        nombre,
        apellido,
        email,
        telefono: telefono || null,
        // tipo, // Quitar este campo porque no existe en el modelo
        // Campos para cliente individual
        dni: dni || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        estadoCivil: estadoCivil || null,
        // ocupacion: ocupacion || null, // Quitar este campo porque no existe en el modelo
        sexo: tipo === 'INDIVIDUAL' ? sexo : null,
        // Campos para empresa
        razonSocial: razonSocial || null,
        ruc: ruc || null,
        representanteLegal: representanteLegal || null,
        cargoRepresentante: cargoRepresentante || null,
        // Actualizar direcciones
        direcciones: {
          deleteMany: {},
          create: direcciones?.map((dir: any) => ({
            tipo: dir.tipo,
            pais: dir.pais,
            ciudad: dir.ciudad,
            direccion: dir.direccion,
            referencia: dir.referencia,
          })) || []
        }
      },
      include: {
        direcciones: true,
        ventas: true
      },
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error al actualizar cliente:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    )
  }
}

// DELETE /api/clientes/[id] - Eliminar un cliente
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos para eliminar clientes
    const allowedRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'GERENTE_GENERAL',
      'SALES_MANAGER'
    ]
    
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar clientes' }, { status: 403 })
    }

    // Verificar si el cliente existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { id: params.id },
    })

    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    await prisma.cliente.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Cliente eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar cliente:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    )
  }
} 