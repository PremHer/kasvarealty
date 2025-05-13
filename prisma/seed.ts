import { PrismaClient, Rol, EstadoProyecto, TipoProyecto } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Crear usuario SUPER_ADMIN
  const superAdmin = await prisma.usuario.create({
    data: {
      email: 'superadmin@kasvarealty.com',
      password: await hash('Admin123!', 12),
      nombre: 'Super Administrador',
      rol: 'SUPER_ADMIN',
      isActive: true
    }
  })

  // Crear usuario ADMIN
  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@kasvarealty.com',
      password: await hash('Admin123!', 12),
      nombre: 'Administrador',
      rol: 'ADMIN',
      isActive: true
    }
  })

  // Crear empresas desarrolladoras
  const empresas = await Promise.all([
    prisma.empresaDesarrolladora.create({
      data: {
        nombre: 'Kasva Realty',
        ruc: '20123456789',
        direccion: 'Av. Principal 123, Lima',
        telefono: '01-1234567',
        email: 'contacto@kasvarealty.com',
        representanteLegal: {
          connect: {
            id: superAdmin.id
          }
        }
      }
    }),
    prisma.empresaDesarrolladora.create({
      data: {
        nombre: 'Constructora XYZ',
        ruc: '20123456790',
        direccion: 'Av. Los Olivos 456, Lima',
        telefono: '01-7654321',
        email: 'contacto@constructora-xyz.com',
        representanteLegal: {
          connect: {
            id: admin.id
          }
        }
      }
    }),
    prisma.empresaDesarrolladora.create({
      data: {
        nombre: 'Inmobiliaria Delta',
        ruc: '20123456791',
        direccion: 'Av. Primavera 789, Lima',
        telefono: '01-9876543',
        email: 'contacto@inmobiliariadelta.com',
        representanteLegal: {
          connect: {
            id: superAdmin.id
          }
        }
      }
    }),
    prisma.empresaDesarrolladora.create({
      data: {
        nombre: 'Desarrolladora Omega',
        ruc: '20123456792',
        direccion: 'Av. La Marina 321, Lima',
        telefono: '01-4567890',
        email: 'contacto@desarrolladoraomega.com',
        representanteLegal: {
          connect: {
            id: admin.id
          }
        }
      }
    })
  ])

  // Crear usuarios para cada empresa
  const usuariosPorEmpresa = await Promise.all(empresas.map(async (empresa, index) => {
    const prefix = empresa.nombre.toLowerCase().replace(/\s+/g, '')
    
    // Crear GERENTE_GENERAL
    const gerenteGeneral = await prisma.usuario.create({
      data: {
        email: `gerente${index + 1}@kasvarealty.com`,
        password: await hash('Gerente123!', 12),
        nombre: `Gerente General ${empresa.nombre}`,
        rol: 'GERENTE_GENERAL',
        isActive: true,
        empresaDesarrolladoraId: empresa.id
      }
    })

    // Crear PROJECT_MANAGER
    const projectManager = await prisma.usuario.create({
      data: {
        email: `pm${index + 1}@kasvarealty.com`,
        password: await hash('PM123!', 12),
        nombre: `Project Manager ${empresa.nombre}`,
        rol: 'PROJECT_MANAGER',
        isActive: true,
        empresaDesarrolladoraId: empresa.id
      }
    })

    // Crear SALES_MANAGER
    const salesManager = await prisma.usuario.create({
      data: {
        email: `ventas${index + 1}@kasvarealty.com`,
        password: await hash('Ventas123!', 12),
        nombre: `Sales Manager ${empresa.nombre}`,
        rol: 'SALES_MANAGER',
        isActive: true,
        empresaDesarrolladoraId: empresa.id
      }
    })

    // Crear FINANCE_MANAGER
    const financeManager = await prisma.usuario.create({
      data: {
        email: `finanzas${index + 1}@kasvarealty.com`,
        password: await hash('Finanzas123!', 12),
        nombre: `Finance Manager ${empresa.nombre}`,
        rol: 'FINANCE_MANAGER',
        isActive: true,
        empresaDesarrolladoraId: empresa.id
      }
    })

    // Crear otros roles
    const otrosUsuarios = await Promise.all([
      prisma.usuario.create({
        data: {
          email: `dev${index + 1}@kasvarealty.com`,
          password: await hash('Dev123!', 12),
          nombre: `Developer ${empresa.nombre}`,
          rol: 'DEVELOPER',
          isActive: true,
          empresaDesarrolladoraId: empresa.id
        }
      }),
      prisma.usuario.create({
        data: {
          email: `ventasrep${index + 1}@kasvarealty.com`,
          password: await hash('Sales123!', 12),
          nombre: `Sales Rep ${empresa.nombre}`,
          rol: 'SALES_REP',
          isActive: true,
          empresaDesarrolladoraId: empresa.id
        }
      }),
      prisma.usuario.create({
        data: {
          email: `construccion${index + 1}@kasvarealty.com`,
          password: await hash('Const123!', 12),
          nombre: `Construction Supervisor ${empresa.nombre}`,
          rol: 'CONSTRUCTION_SUPERVISOR',
          isActive: true,
          empresaDesarrolladoraId: empresa.id
        }
      })
    ])

    return {
      empresa,
      gerenteGeneral,
      projectManager,
      salesManager,
      financeManager,
      otrosUsuarios
    }
  }))

  // Crear proyectos para cada empresa
  const tiposProyectos = [
    TipoProyecto.CONDOMINIO_CASAS,
    TipoProyecto.DEPARTAMENTO,
    TipoProyecto.OFICINAS,
    TipoProyecto.CENTRO_COMERCIAL,
    TipoProyecto.HOTEL,
    TipoProyecto.MIXTO_RESIDENCIAL_COMERCIAL
  ]

  const estadosProyectos = [
    EstadoProyecto.DRAFT,
    EstadoProyecto.PENDING_APPROVAL,
    EstadoProyecto.IN_PROGRESS,
    EstadoProyecto.COMPLETED,
    EstadoProyecto.CANCELLED
  ]

  const proyectos = await Promise.all(usuariosPorEmpresa.flatMap(({ empresa, projectManager, gerenteGeneral }) => 
    tiposProyectos.map((tipo, index) => {
      const estado = estadosProyectos[index % estadosProyectos.length]
      const fechaInicio = new Date('2024-01-01')
      const fechaFin = new Date('2024-12-31')
      
      return prisma.proyecto.create({
        data: {
          nombre: `${tipo} ${empresa.nombre} ${index + 1}`,
          tipo,
          descripcion: `Proyecto ${tipo} desarrollado por ${empresa.nombre}`,
          direccion: `Av. Proyecto ${index + 1}, Lima`,
          departamento: 'Lima',
          provincia: 'Lima',
          distrito: ['Surco', 'San Isidro', 'Miraflores', 'La Molina'][index % 4],
          latitud: -12.123456 + (index * 0.01),
          longitud: -77.123456 + (index * 0.01),
          empresaDesarrolladoraId: empresa.id,
          fechaInicio,
          fechaFin,
          precioTerreno: 1000000 * (index + 1),
          inversionInicial: 5000000 * (index + 1),
          inversionTotal: 20000000 * (index + 1),
          inversionActual: 5000000 * (index + 1),
          estado,
          gerenteId: projectManager.id,
          creadoPorId: gerenteGeneral.id,
          areaTotal: 10000 * (index + 1),
          areaUtil: 8000 * (index + 1),
          cantidadUnidades: 50 * (index + 1),
          ...(estado === EstadoProyecto.PENDING_APPROVAL && {
            aprobadoPorId: null,
            fechaAprobacion: null,
            razonRechazo: null
          }),
          ...(estado === EstadoProyecto.COMPLETED && {
            aprobadoPorId: superAdmin.id,
            fechaAprobacion: new Date('2024-01-15'),
            razonRechazo: null
          }),
          ...(estado === EstadoProyecto.CANCELLED && {
            aprobadoPorId: superAdmin.id,
            fechaAprobacion: new Date('2024-01-15'),
            razonRechazo: 'Proyecto cancelado por razones estratégicas'
          })
        }
      })
    })
  ))

  console.log('Seed completado: Datos de prueba creados exitosamente')
  console.log(`Empresas creadas: ${empresas.length}`)
  console.log(`Usuarios creados: ${usuariosPorEmpresa.length * 7}`)
  console.log(`Proyectos creados: ${proyectos.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 