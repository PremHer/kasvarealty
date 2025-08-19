const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateEmpresasBankInfo() {
  try {
    console.log('Actualizando información bancaria de empresas...')

    // Obtener todas las empresas
    const empresas = await prisma.empresaDesarrolladora.findMany()

    for (const empresa of empresas) {
      console.log(`Actualizando empresa: ${empresa.nombre}`)

      // Actualizar con información bancaria de ejemplo
      await prisma.empresaDesarrolladora.update({
        where: { id: empresa.id },
        data: {
          bancoPrincipal: 'Banco de Crédito del Perú',
          tipoCuenta: 'Cuenta Corriente',
          numeroCuenta: '193-12345678-0-12',
          cci: '002-193-123456789012-12',
          titularCuenta: empresa.nombre,
          emailPagos: empresa.email || 'pagos@empresa.com'
        }
      })

      console.log(`✅ Empresa ${empresa.nombre} actualizada`)
    }

    console.log('🎉 Todas las empresas han sido actualizadas con información bancaria')
  } catch (error) {
    console.error('Error al actualizar empresas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateEmpresasBankInfo()


