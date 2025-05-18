import { PrismaClient, Rol, EstadoProyecto, TipoProyecto } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Datos de empresas realistas
const empresasData = [
  {
    nombre: 'Constructora Inmobiliaria del Norte S.A.C.',
        ruc: '20123456789',
    direccion: 'Av. Primavera 123, San Isidro',
    telefono: '01-422-1234',
    email: 'contacto@constructoranorte.com',
    website: 'www.constructoranorte.com',
    descripcion: 'Líder en desarrollo inmobiliario en el norte del país'
  },
  {
    nombre: 'Grupo Inmobiliario Sur S.A.',
        ruc: '20123456790',
    direccion: 'Av. La Marina 456, San Miguel',
    telefono: '01-422-5678',
    email: 'info@grupoinmobiliariosur.com',
    website: 'www.grupoinmobiliariosur.com',
    descripcion: 'Desarrolladora especializada en proyectos residenciales de lujo'
  },
  {
    nombre: 'Inversiones Inmobiliarias del Este S.A.C.',
        ruc: '20123456791',
    direccion: 'Av. Javier Prado 789, Surco',
    telefono: '01-422-9012',
    email: 'ventas@inversioneseste.com',
    website: 'www.inversioneseste.com',
    descripcion: 'Desarrolladora con enfoque en proyectos comerciales y mixtos'
  },
  {
    nombre: 'Desarrolladora Costa Verde S.A.',
    ruc: '20123456792',
    direccion: 'Av. Costa Verde 123, Miraflores',
    telefono: '01-422-3456',
    email: 'info@costaverde.com',
    website: 'www.costaverde.com',
    descripcion: 'Especialistas en proyectos frente al mar'
  },
  {
    nombre: 'Constructora Andina S.A.C.',
    ruc: '20123456793',
    direccion: 'Av. Arequipa 456, Lima',
    telefono: '01-422-7890',
    email: 'contacto@constructoraandina.com',
    website: 'www.constructoraandina.com',
    descripcion: 'Desarrolladora con presencia en todo el país'
  }
]

// Datos de usuarios realistas
const usuariosData = [
  // Super Admin
  {
    email: 'admin@kasvarealty.com',
    password: 'Admin123!',
    nombre: 'Administrador Sistema',
    rol: Rol.SUPER_ADMIN
  },
  // Representantes Legales
  {
    email: 'carlos.mendoza@constructoranorte.com',
    password: 'RepLegal123!',
    nombre: 'Carlos Mendoza',
    rol: Rol.GERENTE_GENERAL
  },
  {
    email: 'ana.torres@grupoinmobiliariosur.com',
    password: 'RepLegal123!',
    nombre: 'Ana Torres',
    rol: Rol.GERENTE_GENERAL
  },
  {
    email: 'roberto.silva@inversioneseste.com',
    password: 'RepLegal123!',
    nombre: 'Roberto Silva',
    rol: Rol.GERENTE_GENERAL
  },
  {
    email: 'maria.pilar@costaverde.com',
    password: 'RepLegal123!',
    nombre: 'María del Pilar',
    rol: Rol.GERENTE_GENERAL
  },
  {
    email: 'jose.ramirez@constructoraandina.com',
    password: 'RepLegal123!',
    nombre: 'José Ramírez',
    rol: Rol.GERENTE_GENERAL
  },
  // Project Managers
  {
    email: 'pm1.norte@constructoranorte.com',
    password: 'PM123!',
    nombre: 'Luis García',
    rol: Rol.PROJECT_MANAGER
  },
  {
    email: 'pm2.norte@constructoranorte.com',
    password: 'PM123!',
    nombre: 'Carmen Ruiz',
    rol: Rol.PROJECT_MANAGER
  },
  {
    email: 'pm1.sur@grupoinmobiliariosur.com',
    password: 'PM123!',
    nombre: 'Pedro Sánchez',
    rol: Rol.PROJECT_MANAGER
  },
  {
    email: 'pm2.sur@grupoinmobiliariosur.com',
    password: 'PM123!',
    nombre: 'Laura Martínez',
    rol: Rol.PROJECT_MANAGER
  },
  {
    email: 'pm1.este@inversioneseste.com',
    password: 'PM123!',
    nombre: 'Miguel Ángel',
    rol: Rol.PROJECT_MANAGER
  },
  {
    email: 'pm2.este@inversioneseste.com',
    password: 'PM123!',
    nombre: 'Sofía Vargas',
    rol: Rol.PROJECT_MANAGER
  },
  // Sales Managers
  {
    email: 'ventas.norte@constructoranorte.com',
    password: 'Ventas123!',
    nombre: 'Juan Pérez',
    rol: Rol.SALES_MANAGER
  },
  {
    email: 'ventas.sur@grupoinmobiliariosur.com',
    password: 'Ventas123!',
    nombre: 'María López',
    rol: Rol.SALES_MANAGER
  },
  {
    email: 'ventas.este@inversioneseste.com',
    password: 'Ventas123!',
    nombre: 'Carlos Ruiz',
    rol: Rol.SALES_MANAGER
  },
  // Finance Managers
  {
    email: 'finanzas.norte@constructoranorte.com',
    password: 'Finanzas123!',
    nombre: 'Ana Martínez',
    rol: Rol.FINANCE_MANAGER
  },
  {
    email: 'finanzas.sur@grupoinmobiliariosur.com',
    password: 'Finanzas123!',
    nombre: 'Roberto Díaz',
    rol: Rol.FINANCE_MANAGER
  },
  {
    email: 'finanzas.este@inversioneseste.com',
    password: 'Finanzas123!',
    nombre: 'Laura Sánchez',
    rol: Rol.FINANCE_MANAGER
  },
  // Developers
  {
    email: 'dev1.norte@constructoranorte.com',
    password: 'Dev123!',
    nombre: 'José García',
    rol: Rol.DEVELOPER
  },
  {
    email: 'dev2.norte@constructoranorte.com',
    password: 'Dev123!',
    nombre: 'Carmen Torres',
    rol: Rol.DEVELOPER
  },
  {
    email: 'dev1.sur@grupoinmobiliariosur.com',
    password: 'Dev123!',
    nombre: 'Pedro Martínez',
    rol: Rol.DEVELOPER
  },
  {
    email: 'dev2.sur@grupoinmobiliariosur.com',
    password: 'Dev123!',
    nombre: 'Sofía López',
    rol: Rol.DEVELOPER
  },
  // Construction Supervisors
  {
    email: 'construccion.norte@constructoranorte.com',
    password: 'Const123!',
    nombre: 'Miguel Torres',
    rol: Rol.CONSTRUCTION_SUPERVISOR
  },
  {
    email: 'construccion.sur@grupoinmobiliariosur.com',
    password: 'Const123!',
    nombre: 'Ana García',
    rol: Rol.CONSTRUCTION_SUPERVISOR
  },
  {
    email: 'construccion.este@inversioneseste.com',
    password: 'Const123!',
    nombre: 'Carlos Martínez',
    rol: Rol.CONSTRUCTION_SUPERVISOR
  }
]

// Datos de proyectos realistas
const proyectosData = [
  // Constructora del Norte
  {
    nombre: 'Residencial Primavera',
    tipo: TipoProyecto.CONDOMINIO_CASAS,
    descripcion: 'Exclusivo condominio de casas con áreas verdes y seguridad 24/7',
    direccion: 'Av. Primavera 123, San Isidro',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'San Isidro',
    latitud: -12.0931,
    longitud: -77.0465,
    areaTotal: 50000,
    areaUtil: 35000,
    cantidadUnidades: 50,
    inversionInicial: 50000000,
    inversionTotal: 75000000,
    inversionActual: 25000000,
    estado: EstadoProyecto.IN_PROGRESS,
    fechaInicio: new Date('2024-01-01'),
    fechaFin: new Date('2025-12-31')
  },
  {
    nombre: 'Torre Marina Business Center',
    tipo: TipoProyecto.OFICINAS,
    descripcion: 'Edificio corporativo de oficinas clase A',
    direccion: 'Av. La Marina 456, San Miguel',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'San Miguel',
    latitud: -12.0831,
    longitud: -77.0865,
    areaTotal: 30000,
    areaUtil: 25000,
    cantidadUnidades: 30,
    inversionInicial: 30000000,
    inversionTotal: 45000000,
    inversionActual: 15000000,
    estado: EstadoProyecto.PENDING_APPROVAL,
    fechaInicio: new Date('2024-03-01')
  },
  // Grupo Inmobiliario Sur
  {
    nombre: 'Plaza Sur Shopping',
    tipo: TipoProyecto.CENTRO_COMERCIAL,
    descripcion: 'Centro comercial moderno con más de 100 tiendas',
    direccion: 'Av. Javier Prado 789, Surco',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'Surco',
    latitud: -12.0731,
    longitud: -77.0265,
    areaTotal: 80000,
    areaUtil: 60000,
    cantidadUnidades: 120,
    inversionInicial: 80000000,
    inversionTotal: 100000000,
    inversionActual: 100000000,
    estado: EstadoProyecto.COMPLETED,
    fechaInicio: new Date('2023-06-01'),
    fechaFin: new Date('2024-12-31')
  },
  {
    nombre: 'Residencial Los Pinos',
    tipo: TipoProyecto.CONDOMINIO_DEPARTAMENTOS,
    descripcion: 'Condominio de departamentos con amenities de lujo',
    direccion: 'Av. Primavera 456, San Isidro',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'San Isidro',
    latitud: -12.0931,
    longitud: -77.0465,
    areaTotal: 40000,
    areaUtil: 30000,
    cantidadUnidades: 80,
    inversionInicial: 40000000,
    inversionTotal: 60000000,
    inversionActual: 20000000,
    estado: EstadoProyecto.PENDING_ASSIGNMENT,
    fechaInicio: new Date('2024-02-01')
  },
  // Inversiones del Este
  {
    nombre: 'Parque Industrial Este',
    tipo: TipoProyecto.PARQUE_INDUSTRIAL,
    descripcion: 'Parque industrial con naves logísticas y oficinas',
    direccion: 'Carretera Central Km 15, Lurigancho',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'Lurigancho',
    latitud: -12.0131,
    longitud: -76.9465,
    areaTotal: 100000,
    areaUtil: 80000,
    cantidadUnidades: 40,
    inversionInicial: 60000000,
    inversionTotal: 80000000,
    inversionActual: 40000000,
    estado: EstadoProyecto.IN_PROGRESS,
    fechaInicio: new Date('2023-09-01'),
    fechaFin: new Date('2024-09-30')
  },
  {
    nombre: 'Centro Médico San Juan',
    tipo: TipoProyecto.CLINICA,
    descripcion: 'Clínica moderna con tecnología de última generación',
    direccion: 'Av. San Juan 789, San Juan de Lurigancho',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'San Juan de Lurigancho',
    latitud: -12.0231,
    longitud: -76.9565,
    areaTotal: 60000,
    areaUtil: 45000,
    cantidadUnidades: 1,
    inversionInicial: 70000000,
    inversionTotal: 90000000,
    inversionActual: 35000000,
    estado: EstadoProyecto.DRAFT,
    fechaInicio: new Date('2024-04-01')
  }
]

async function main() {
  // Limpiar la base de datos
  await prisma.venta.deleteMany()
  await prisma.unidadInmobiliaria.deleteMany()
  await prisma.actividad.deleteMany()
  await prisma.comentario.deleteMany()
  await prisma.documento.deleteMany()
  await prisma.proyecto.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.empresaDesarrolladora.deleteMany()

  // Crear usuarios primero
  const usuarios = await Promise.all(
    usuariosData.map(async data => {
      return prisma.usuario.create({
      data: {
          ...data,
          password: await hash(data.password, 10)
        }
      })
    })
  )

  // Crear empresas con sus representantes legales
  const empresas = await Promise.all(
    empresasData.map((data, index) => 
      prisma.empresaDesarrolladora.create({
        data: {
          ...data,
          representanteLegalId: usuarios[index + 1].id // +1 porque el primer usuario es SUPER_ADMIN
        }
      })
    )
  )

  // Actualizar los usuarios con sus empresas
  await Promise.all(
    usuarios.slice(1, 6).map((usuario, index) => // Los primeros 5 usuarios después del SUPER_ADMIN
      prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          empresaDesarrolladoraId: empresas[index].id
        }
      })
    )
  )

  // Crear proyectos base
  const proyectosBase = await Promise.all(
    proyectosData.map(async (data, index) => {
      const empresaIndex = Math.floor(index / 2)
      const gerenteIndex = empresaIndex * 2 + (index % 2)
      
      return prisma.proyecto.create({
        data: {
          ...data,
          empresaDesarrolladoraId: empresas[empresaIndex].id,
          creadoPorId: usuarios[empresaIndex + 1].id, // +1 porque el primer usuario es SUPER_ADMIN
          gerenteId: usuarios[gerenteIndex + 6].id // +6 porque los primeros 6 son SUPER_ADMIN y GERENTE_GENERAL
        }
      })
    })
  )

  // Generar más proyectos variados
  const proyectosAdicionales = await Promise.all(
    Array(44).fill(null).map(async (_, index) => {
      const empresaIndex = index % 5
      const tipoIndex = index % Object.keys(TipoProyecto).length
      const estadoIndex = index % Object.keys(EstadoProyecto).length
      const gerenteIndex = (empresaIndex * 2) + (index % 2)
      
      const fechaInicio = new Date(2024, Math.floor(index / 12), 1)
      const fechaFin = new Date(2025, Math.floor(index / 12), 1)
      
      return prisma.proyecto.create({
        data: {
          nombre: `Proyecto ${index + 1} - ${empresas[empresaIndex].nombre}`,
          tipo: Object.values(TipoProyecto)[tipoIndex],
          descripcion: `Proyecto ${index + 1} desarrollado por ${empresas[empresaIndex].nombre}`,
          direccion: `Av. Proyecto ${index + 1}, ${['Lima', 'Arequipa', 'Trujillo', 'Cusco', 'Piura'][empresaIndex]}`,
          departamento: ['Lima', 'Arequipa', 'La Libertad', 'Cusco', 'Piura'][empresaIndex],
          provincia: ['Lima', 'Arequipa', 'Trujillo', 'Cusco', 'Piura'][empresaIndex],
          distrito: ['San Isidro', 'Surco', 'Miraflores', 'La Molina', 'San Borja'][index % 5],
          latitud: -12.0931 + (index * 0.01),
          longitud: -77.0465 + (index * 0.01),
          areaTotal: 10000 * (index + 1),
          areaUtil: 8000 * (index + 1),
          cantidadUnidades: 50 * (index + 1),
          inversionInicial: 5000000 * (index + 1),
          inversionTotal: 10000000 * (index + 1),
          inversionActual: 2500000 * (index + 1),
          estado: Object.values(EstadoProyecto)[estadoIndex],
          fechaInicio,
          fechaFin,
          empresaDesarrolladoraId: empresas[empresaIndex].id,
          creadoPorId: usuarios[empresaIndex + 1].id,
          gerenteId: usuarios[gerenteIndex + 6].id
        }
      })
    })
  )

  // Crear unidades inmobiliarias para algunos proyectos
  const unidades = await Promise.all(
    proyectosBase.flatMap((proyecto, proyectoIndex) => 
      Array(10).fill(null).map((_, index) => 
        prisma.unidadInmobiliaria.create({
          data: {
            codigo: `${proyecto.nombre.substring(0, 3).toUpperCase()}-${proyectoIndex + 1}-${index + 1}`,
            tipo: proyecto.tipo === TipoProyecto.CONDOMINIO_CASAS ? 'Casa' :
                  proyecto.tipo === TipoProyecto.CONDOMINIO_DEPARTAMENTOS ? 'Departamento' :
                  proyecto.tipo === TipoProyecto.OFICINAS ? 'Oficina' :
                  proyecto.tipo === TipoProyecto.CENTRO_COMERCIAL ? 'Local Comercial' : 'Unidad',
            estado: index < 5 ? 'DISPONIBLE' : 'VENDIDO',
            precio: 350000 + (index * 10000) + (proyectoIndex * 50000),
            area: 200 + (index * 10) + (proyectoIndex * 50),
            proyectoId: proyecto.id
          }
        })
      )
    )
  )

  console.log('Datos de prueba creados exitosamente')
  console.log('Credenciales de acceso:')
  console.log('Super Admin:')
  console.log('Email: admin@kasvarealty.com')
  console.log('Password: Admin123!')
  console.log('\nGerentes Generales:')
  console.log('Email: gerente.norte@constructoranorte.com')
  console.log('Password: Gerente123!')
  console.log('\nProject Managers:')
  console.log('Email: pm1.norte@constructoranorte.com')
  console.log('Password: PM123!')
  console.log('\nSales Managers:')
  console.log('Email: ventas.norte@constructoranorte.com')
  console.log('Password: Ventas123!')
  console.log('\nFinance Managers:')
  console.log('Email: finanzas.norte@constructoranorte.com')
  console.log('Password: Finanzas123!')
  console.log('\nDevelopers:')
  console.log('Email: dev1.norte@constructoranorte.com')
  console.log('Password: Dev123!')
  console.log('\nConstruction Supervisors:')
  console.log('Email: construccion.norte@constructoranorte.com')
  console.log('Password: Const123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 