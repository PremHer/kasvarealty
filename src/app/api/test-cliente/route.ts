import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('🔍 Test API recibió:', body)

    // Validar datos mínimos
    if (!body.nombre || !body.email || !body.tipoCliente) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Crear cliente de prueba
    const cliente = await prisma.cliente.create({
      data: {
        tipoCliente: body.tipoCliente,
        email: body.email,
        telefono: body.telefono,
        nombre: body.nombre,
        apellido: body.apellido,
        dni: body.dni,
        sexo: body.sexo,
        fechaNacimiento: body.fechaNacimiento ? new Date(body.fechaNacimiento) : undefined,
        estadoCivil: body.estadoCivil,
        direcciones: {
          create: body.direcciones?.map((dir: any) => ({
            tipo: dir.tipo,
            pais: dir.pais,
            distrito: dir.distrito,
            provincia: dir.provincia,
            departamento: dir.departamento,
            direccion: dir.direccion,
            referencia: dir.referencia,
          })) || [],
        },
      },
      include: {
        direcciones: true,
      },
    })

    console.log('✅ Cliente creado exitosamente:', cliente)

    return NextResponse.json({
      success: true,
      cliente,
      message: 'Cliente creado exitosamente'
    })

  } catch (error) {
    console.error('❌ Error en test API:', error)
    
    if (error.code) {
      console.error('📋 Código de error:', error.code)
    }
    
    if (error.meta) {
      console.error('📋 Meta del error:', error.meta)
    }

    return NextResponse.json(
      { 
        error: 'Error al crear cliente',
        details: error.message,
        code: error.code,
        meta: error.meta
      },
      { status: 500 }
    )
  }
}
