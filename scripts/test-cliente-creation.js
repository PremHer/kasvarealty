const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testClienteCreation() {
  try {
    console.log('🧪 Probando creación de cliente...')

    // Datos de prueba
    const clienteData = {
      tipoCliente: 'INDIVIDUAL',
      nombre: 'Cliente Test',
      apellido: 'Apellido Test',
      email: 'test@example.com',
      telefono: '999999999',
      dni: '12345678',
      sexo: 'MASCULINO',
      estadoCivil: 'SOLTERO',
      fechaNacimiento: new Date('1990-01-01'),
      direcciones: {
        create: [{
          tipo: 'NACIONAL',
          pais: 'Peru',
          distrito: 'Lima',
          provincia: 'Lima',
          departamento: 'Lima',
          direccion: 'Av. Test 123',
          referencia: 'Referencia test'
        }]
      }
    }

    console.log('📝 Datos del cliente a crear:', JSON.stringify(clienteData, null, 2))

    // Intentar crear el cliente
    const cliente = await prisma.cliente.create({
      data: clienteData,
      include: {
        direcciones: true
      }
    })

    console.log('✅ Cliente creado exitosamente!')
    console.log('📊 Cliente:', JSON.stringify(cliente, null, 2))

    // Limpiar: eliminar el cliente de prueba
    await prisma.cliente.delete({
      where: { id: cliente.id }
    })

    console.log('🧹 Cliente de prueba eliminado')

  } catch (error) {
    console.error('❌ Error al crear cliente:', error)
    
    if (error.code) {
      console.error('📋 Código de error:', error.code)
    }
    
    if (error.meta) {
      console.error('📋 Meta del error:', error.meta)
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la prueba
testClienteCreation()
