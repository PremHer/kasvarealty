import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol, EstadoCuota } from '@prisma/client'
import { googleDriveService } from '@/lib/services/googleDriveService'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Definir roles permitidos para ventas
const SALES_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER', 
  'SALES_REP',
  'SALES_ASSISTANT',
  'GERENTE_GENERAL'
]

// Definir roles que pueden crear ventas
const CAN_CREATE_SALES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER',
  'SALES_REP',
  'GERENTE_GENERAL'
]

// GET /api/ventas - Listar ventas
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver ventas
    if (!SALES_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver ventas' }, { status: 403 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const proyectoId = searchParams.get('proyectoId')
    const vendedorId = searchParams.get('vendedorId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Construir filtros según el rol del usuario
    let whereClause: any = {}

    // Filtrar por estado si se especifica
    if (estado) {
      whereClause.estado = estado
    }

    // Filtrar por proyecto si se especifica
    if (proyectoId) {
      whereClause.proyectoId = proyectoId
    }

    // Filtrar por vendedor si se especifica
    if (vendedorId) {
      whereClause.vendedorId = vendedorId
    }

    // Restricciones según el rol
    if (userRole === 'SALES_REP') {
      // Sales Rep solo ve sus propias ventas
      whereClause.vendedorId = session.user.id
    } else if (userRole === 'GERENTE_GENERAL') {
      // Si se especifica un proyectoId, verificar que el gerente general tenga acceso a ese proyecto
      if (proyectoId) {
        // Verificar que el proyecto pertenezca a una empresa donde el gerente es representante legal
        const proyecto = await prisma.proyecto.findFirst({
          where: {
            id: proyectoId,
            empresaDesarrolladora: {
              representanteLegalId: session.user.id
            }
          }
        })
        
        if (!proyecto) {
          return NextResponse.json({ error: 'No tienes permisos para ver las ventas de este proyecto' }, { status: 403 })
        }
        
        // Si tiene acceso, usar el proyectoId especificado
        whereClause.proyectoId = proyectoId
      } else {
        // Si no se especifica proyectoId, filtrar por todos los proyectos del gerente general
        const empresasGerente = await prisma.empresaDesarrolladora.findMany({
          where: {
            representanteLegalId: session.user.id
          },
          select: {
            id: true
          }
        })
        
        const empresaIds = empresasGerente.map(e => e.id)
        if (empresaIds.length > 0) {
          // Obtener proyectos de estas empresas
          const proyectosGerente = await prisma.proyecto.findMany({
            where: {
              empresaDesarrolladoraId: {
                in: empresaIds
              }
            },
            select: {
              id: true
            }
          })
          
          const proyectoIds = proyectosGerente.map(p => p.id)
          if (proyectoIds.length > 0) {
            whereClause.proyectoId = {
              in: proyectoIds
            }
          } else {
            // Si no tiene proyectos en sus empresas, no verá ventas
            return NextResponse.json({
              ventas: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0
              }
            })
          }
        } else {
          // Si no tiene empresas como representante legal, no verá ventas
          return NextResponse.json({
            ventas: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0
            }
          })
        }
      }
    }

    // Obtener ventas de lotes
    const ventasLotes = await prisma.ventaLote.findMany({
      where: whereClause,
      include: {
        lote: {
          include: {
            manzana: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        clientes: {
          include: {
            cliente: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        },
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        aprobador: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Obtener ventas de unidades de cementerio
    const ventasUnidadesCementerio = await prisma.ventaUnidadCementerio.findMany({
      where: whereClause,
      include: {
        unidadCementerio: {
          include: {
            pabellon: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        clientes: {
          include: {
            cliente: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        },
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        aprobador: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Combinar y formatear resultados
    const ventas = [
      ...ventasLotes.map((venta: any) => ({
        ...venta,
        tipoVenta: 'LOTE',
        tipoVentaVenta: venta.tipoVenta,
        unidad: {
          id: venta.lote.id,
          codigo: venta.lote.codigo,
          manzana: venta.lote.manzana.nombre,
          manzanaCodigo: venta.lote.manzana.codigo
        }
      })),
      ...ventasUnidadesCementerio.map((venta: any) => ({
        ...venta,
        tipoVenta: 'UNIDAD_CEMENTERIO',
        tipoVentaVenta: venta.tipoVenta,
        unidad: {
          id: venta.unidadCementerio.id,
          codigo: venta.unidadCementerio.codigo,
          pabellon: venta.unidadCementerio.pabellon.nombre,
          pabellonCodigo: venta.unidadCementerio.pabellon.codigo
        }
      }))
    ]

    console.log('=== DEBUG API VENTAS ===')
    console.log('Ventas formateadas:', ventas)
    if (ventas.length > 0) {
      console.log('Primera venta formateada:', ventas[0])
      console.log('tipoVenta de la primera venta:', ventas[0].tipoVenta)
      console.log('tipoVentaVenta de la primera venta:', ventas[0].tipoVentaVenta)
    }

    // Contar total de registros para paginación
    const totalVentasLotes = await prisma.ventaLote.count({ where: whereClause })
    const totalVentasUnidades = await prisma.ventaUnidadCementerio.count({ where: whereClause })
    const total = totalVentasLotes + totalVentasUnidades

    return NextResponse.json({
      ventas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error al obtener ventas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/ventas - Crear venta
export async function POST(request: Request) {
  console.log('=== INICIO ENDPOINT POST /api/ventas ===')
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? 'Existe' : 'No existe')
    if (!session?.user) {
      console.log('No hay sesión de usuario')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    console.log('Usuario:', session.user.email, 'Rol:', userRole, 'ID:', session.user.id)
    
    // Verificar si el usuario puede crear ventas
    if (!CAN_CREATE_SALES.includes(userRole)) {
      console.log('Usuario no tiene permisos para crear ventas')
      return NextResponse.json({ error: 'No tienes permisos para crear ventas' }, { status: 403 })
    }

    // Verificar si la request es FormData o JSON
    const contentType = request.headers.get('content-type') || ''
    
    let body: any
    let comprobantes: Array<{ archivo: File, datos: any }> = []
    
    if (contentType.includes('multipart/form-data')) {
      // Manejar FormData con archivos
      const formData = await request.formData()
      const ventaDataString = formData.get('ventaData') as string
      body = JSON.parse(ventaDataString)
      
      console.log('=== PROCESANDO FORMDATA ===')
      console.log('Content-Type:', contentType)
      console.log('VentaData recibida:', ventaDataString ? 'Sí' : 'No')
      
      // Extraer archivos de comprobantes
      const comprobantesFiles: Array<{ archivo: File, datos: any }> = []
      let index = 0
      
      console.log('Buscando comprobantes en FormData...')
      while (formData.has(`comprobante_${index}`)) {
        const archivo = formData.get(`comprobante_${index}`) as File
        const datosString = formData.get(`comprobante_${index}_data`) as string
        
        console.log(`Comprobante ${index}:`, {
          tieneArchivo: !!archivo,
          nombreArchivo: archivo?.name,
          tamanioArchivo: archivo?.size,
          tieneDatos: !!datosString,
          datos: datosString
        })
        
        if (archivo && datosString) {
          try {
        const datos = JSON.parse(datosString)
        comprobantesFiles.push({ archivo, datos })
            console.log(`✅ Comprobante ${index} procesado correctamente`)
          } catch (error) {
            console.error(`❌ Error al parsear datos del comprobante ${index}:`, error)
          }
        } else {
          console.log(`⚠️ Comprobante ${index} incompleto - archivo: ${!!archivo}, datos: ${!!datosString}`)
        }
        
        index++
      }
      
      comprobantes = comprobantesFiles
      console.log(`=== RESUMEN COMPROBANTES ===`)
      console.log(`Total de comprobantes encontrados: ${comprobantes.length}`)
      comprobantes.forEach((comp, i) => {
        console.log(`Comprobante ${i}:`, {
          tipo: comp.datos.tipo,
          monto: comp.datos.monto,
          nombreArchivo: comp.archivo.name,
          tamanio: comp.archivo.size
        })
      })
    } else {
      // Manejar JSON normal (sin archivos)
      body = await request.json()
      console.log('Datos recibidos (JSON):', body)
    }

    console.log('Datos de venta:', body)
    console.log('VendedorId recibido:', body.vendedorId)
    console.log('Session user id:', session.user.id)
    
    const { 
      tipoVenta, 
      unidadId, 
      clienteIds,
      vendedorId,
      precioOriginal,
      precioVenta, 
      montoDescuento,
      motivoDescuento,
      numeroCuotas,
      frecuenciaCuota,
      fechaPrimeraCuota,
      formaPago,
      montoInicial,
      saldoPendiente,
      comisionVendedor,
      porcentajeComision,
      estadoDocumentacion,
      documentosRequeridos,
      fechaEntrega,
      condicionesEspeciales,
      metodoPago, 
      fechaVenta,
      observaciones,
      cuotasPersonalizadas
    } = body

    // Validaciones básicas
    if (!tipoVenta || !unidadId || !clienteIds || !Array.isArray(clienteIds) || clienteIds.length === 0 || !precioVenta || !precioOriginal) {
      console.log('Campos faltantes:', { tipoVenta, unidadId, clienteIds, precioVenta, precioOriginal })
      return NextResponse.json(
        { error: 'Faltan campos requeridos o formato inválido de clientes' },
        { status: 400 }
      )
    }

    // Validar que tipoVenta sea válido para Prisma (CONTADO o CUOTAS)
    if (!['CONTADO', 'CUOTAS'].includes(tipoVenta)) {
      return NextResponse.json(
        { error: 'Tipo de venta debe ser CONTADO o CUOTAS' },
        { status: 400 }
      )
    }

    console.log('Buscando unidad:', unidadId)

    // Verificar que la unidad existe y está disponible
    let unidad
    let proyectoId
    let manzanaId
    let pabellonId
    let tipoUnidad: 'LOTE' | 'UNIDAD_CEMENTERIO' | undefined

    // Intentar buscar como lote primero
    unidad = await prisma.lote.findUnique({
      where: { id: unidadId }
    })
    
    if (unidad) {
      tipoUnidad = 'LOTE'
      console.log('Lote encontrado:', unidad)
      const manzana = await prisma.manzana.findUnique({
        where: { id: unidad.manzanaId }
      })
      console.log('Manzana encontrada:', manzana)
      proyectoId = manzana?.proyectoId
      manzanaId = unidad.manzanaId
    } else {
      // Si no es lote, buscar como unidad de cementerio
      unidad = await prisma.unidadCementerio.findUnique({
        where: { id: unidadId }
      })
      
      if (unidad) {
        tipoUnidad = 'UNIDAD_CEMENTERIO'
        console.log('Unidad de cementerio encontrada:', unidad)
        const pabellon = await prisma.pabellon.findUnique({
          where: { id: unidad.pabellonId }
        })
        console.log('Pabellón encontrado:', pabellon)
        proyectoId = pabellon?.proyectoId
        pabellonId = unidad.pabellonId
      }
    }

    if (!unidad) {
      console.log('Unidad no encontrada')
      return NextResponse.json(
        { error: 'Unidad no encontrada' },
        { status: 404 }
      )
    }

    if (unidad.estado !== 'DISPONIBLE') {
      console.log('Unidad no disponible, estado:', unidad.estado)
      return NextResponse.json(
        { error: 'La unidad no está disponible para la venta' },
        { status: 400 }
      )
    }

    // Verificar que los clientes existen
    const clientes = await prisma.cliente.findMany({
      where: { id: { in: clienteIds } }
    })
    console.log('Clientes encontrados:', clientes)

    if (clientes.length !== clienteIds.length) {
      console.log('Algunos clientes no encontrados')
      return NextResponse.json(
        { error: 'Algunos clientes no encontrados' },
        { status: 404 }
      )
    }

    // Usar vendedorId si se proporciona, sino usar el usuario de la sesión
    let vendedorFinal = vendedorId || session.user.id
    console.log('VendedorId recibido (quien comisiona):', vendedorId)
    console.log('Session user id (quien crea la venta):', session.user.id)
    console.log('Vendedor final a usar (quien comisiona):', vendedorFinal)

    // Verificar que el vendedor existe (quien comisiona)
    let vendedor = await prisma.usuario.findUnique({
      where: { id: vendedorFinal }
    })
    
    // Si no se encuentra como usuario, buscar como perfil de vendedor
    if (!vendedor) {
      console.log('Buscando como perfil de vendedor...')
      const perfilVendedor = await prisma.perfilVendedor.findUnique({
        where: { id: vendedorFinal },
        include: { usuario: true }
      })
      
      if (perfilVendedor) {
        console.log('Perfil de vendedor encontrado, usando usuario asociado')
        vendedor = perfilVendedor.usuario
        // Actualizar vendedorFinal para usar el ID del usuario
        vendedorFinal = perfilVendedor.usuarioId
      }
    }
    
    console.log('Vendedor encontrado en DB:', vendedor ? 'Sí' : 'No')
    if (!vendedor) {
      console.log('ERROR: Vendedor no encontrado con ID:', vendedorFinal)
      return NextResponse.json(
        { error: 'Vendedor no encontrado' },
        { status: 404 }
      )
    }
    console.log('Vendedor válido (quien comisiona):', vendedor.email)
    console.log('Usuario que crea la venta:', session.user.email)

    // Crear la venta según el tipo
    let venta

    // Determinar si hay cuotas personalizadas
    const tieneCuotasPersonalizadas = cuotasPersonalizadas && Array.isArray(cuotasPersonalizadas) && cuotasPersonalizadas.length > 0
    
    // Calcular valores para la venta basados en el tipo de cuotas
    let numeroCuotasFinal = parseInt(numeroCuotas || '1')
    let fechaPrimeraCuotaFinal = fechaPrimeraCuota ? new Date(fechaPrimeraCuota) : null
    
    // Si hay cuotas personalizadas, usar esa información
    if (tieneCuotasPersonalizadas) {
      numeroCuotasFinal = cuotasPersonalizadas.length
      // Usar la fecha de la primera cuota personalizada
      fechaPrimeraCuotaFinal = new Date(cuotasPersonalizadas[0].fecha)
    }

    if (tipoUnidad === 'LOTE') {
      console.log('Creando venta de lote con datos:', {
        loteId: unidadId,
        manzanaId: manzanaId!,
        proyectoId: proyectoId!,
        clienteId: clienteIds[0], // Usar el primer cliente como principal
        vendedorId: vendedorFinal,
        precioVenta: parseFloat(precioVenta),
        metodoPago,
        fechaVenta: fechaVenta ? new Date(fechaVenta) : new Date(),
        estado: 'PENDIENTE',
        observaciones,
        createdBy: session.user.id,
        numeroCuotas: numeroCuotasFinal,
        fechaPrimeraCuota: fechaPrimeraCuotaFinal
      })
      
      venta = await prisma.ventaLote.create({
        data: {
          loteId: unidadId,
          manzanaId: manzanaId!,
          proyectoId: proyectoId!,
          clienteId: clienteIds[0], // Usar el primer cliente como principal
          vendedorId: vendedorFinal,
          precioOriginal: parseFloat(precioOriginal),
          precioVenta: parseFloat(precioVenta),
          montoDescuento: parseFloat(montoDescuento || '0'),
          motivoDescuento,
          tipoVenta,
          numeroCuotas: numeroCuotasFinal,
          frecuenciaCuota: tieneCuotasPersonalizadas ? 'PERSONALIZADA' : (frecuenciaCuota || 'MENSUAL'),
          fechaPrimeraCuota: tieneCuotasPersonalizadas ? new Date(cuotasPersonalizadas[0]?.fecha) : (fechaPrimeraCuota ? new Date(fechaPrimeraCuota) : null),
          formaPago: formaPago || null,
          montoInicial: montoInicial ? parseFloat(montoInicial) : null,
          saldoPendiente: saldoPendiente ? parseFloat(saldoPendiente) : null,
          comisionVendedor: comisionVendedor ? parseFloat(comisionVendedor) : null,
          porcentajeComision: porcentajeComision ? parseFloat(porcentajeComision) : null,
          estadoDocumentacion: estadoDocumentacion || 'PENDIENTE',
          documentosRequeridos,
          fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
          condicionesEspeciales,
          metodoPago,
          fechaVenta: fechaVenta ? new Date(fechaVenta) : new Date(),
          estado: 'PENDIENTE',
          observaciones,
          createdBy: session.user.id
        }
      })
      console.log('Venta de lote creada:', venta)
    } else {
      console.log('Creando venta de unidad de cementerio con datos:', {
        unidadCementerioId: unidadId,
        pabellonId: pabellonId!,
        proyectoId: proyectoId!,
        clienteId: clienteIds[0], // Usar el primer cliente como principal
        vendedorId: vendedorFinal,
        precioVenta: parseFloat(precioVenta),
        metodoPago,
        fechaVenta: fechaVenta ? new Date(fechaVenta) : new Date(),
        estado: 'PENDIENTE',
        observaciones,
        createdBy: session.user.id,
        numeroCuotas: numeroCuotasFinal,
        fechaPrimeraCuota: fechaPrimeraCuotaFinal
      })
      
      venta = await prisma.ventaUnidadCementerio.create({
        data: {
          unidadCementerioId: unidadId,
          pabellonId: pabellonId!,
          proyectoId: proyectoId!,
          clienteId: clienteIds[0], // Usar el primer cliente como principal
          vendedorId: vendedorFinal,
          precioOriginal: parseFloat(precioOriginal),
          precioVenta: parseFloat(precioVenta),
          montoDescuento: parseFloat(montoDescuento || '0'),
          motivoDescuento,
          tipoVenta,
          numeroCuotas: numeroCuotasFinal,
          frecuenciaCuota: tieneCuotasPersonalizadas ? 'PERSONALIZADA' : (frecuenciaCuota || 'MENSUAL'),
          fechaPrimeraCuota: tieneCuotasPersonalizadas ? new Date(cuotasPersonalizadas[0]?.fecha) : (fechaPrimeraCuota ? new Date(fechaPrimeraCuota) : null),
          formaPago: formaPago || null,
          montoInicial: montoInicial ? parseFloat(montoInicial) : null,
          saldoPendiente: saldoPendiente ? parseFloat(saldoPendiente) : null,
          comisionVendedor: comisionVendedor ? parseFloat(comisionVendedor) : null,
          porcentajeComision: porcentajeComision ? parseFloat(porcentajeComision) : null,
          estadoDocumentacion: estadoDocumentacion || 'PENDIENTE',
          documentosRequeridos,
          fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
          condicionesEspeciales,
          metodoPago,
          fechaVenta: fechaVenta ? new Date(fechaVenta) : new Date(),
          estado: 'PENDIENTE',
          observaciones,
          createdBy: session.user.id
        }
      })
      console.log('Venta de unidad de cementerio creada:', venta)
    }

    // Crear relaciones muchos a muchos con los clientes adicionales
    console.log('=== CREANDO RELACIONES CON CLIENTES ADICIONALES ===')
    console.log('ClienteIds recibidos:', clienteIds)
    console.log('Cliente principal (clienteId):', clienteIds[0])
    console.log('Clientes adicionales:', clienteIds.slice(1))
    
    if (clienteIds.length > 1) {
      console.log(`Creando ${clienteIds.length - 1} relaciones adicionales con clientes`)
      
      const clientesAdicionales = clienteIds.slice(1) // Excluir el primer cliente que ya está como principal
      
      if (tipoUnidad === 'LOTE') {
        // Crear relaciones para VentaLote
        const relacionesVentaLote = clientesAdicionales.map(clienteId => ({
          ventaLoteId: venta.id,
          clienteId: clienteId
        }))
        
        console.log('Relaciones VentaLote a crear:', relacionesVentaLote)
        
        await prisma.ventaLoteCliente.createMany({
          data: relacionesVentaLote
        })
        
        console.log(`${relacionesVentaLote.length} relaciones VentaLote creadas`)
      } else {
        // Crear relaciones para VentaUnidadCementerio
        const relacionesVentaUnidadCementerio = clientesAdicionales.map(clienteId => ({
          ventaUnidadCementerioId: venta.id,
          clienteId: clienteId
        }))
        
        console.log('Relaciones VentaUnidadCementerio a crear:', relacionesVentaUnidadCementerio)
        
        await prisma.ventaUnidadCementerioCliente.createMany({
          data: relacionesVentaUnidadCementerio
        })
        
        console.log(`${relacionesVentaUnidadCementerio.length} relaciones VentaUnidadCementerio creadas`)
      }
    } else {
      console.log('Solo hay un cliente, no se crean relaciones adicionales')
    }

    // Actualizar estado de la unidad a EN_VENTA cuando se crea la venta
    // Esto evita que aparezca como disponible mientras la venta está pendiente
    console.log('Actualizando estado de la unidad a EN_VENTA para evitar ventas duplicadas')
    
    if (tipoUnidad === 'LOTE') {
      console.log('Actualizando estado del lote a EN_VENTA')
      await prisma.lote.update({
        where: { id: unidadId },
        data: { estado: 'EN_VENTA' }
      })
    } else {
      console.log('Actualizando estado de la unidad de cementerio a VENDIDO')
      await prisma.unidadCementerio.update({
        where: { id: unidadId },
        data: { estado: 'VENDIDO' }
      })
    }

    // Crear cuotas si es una venta a cuotas
    if (tipoVenta === 'CUOTAS') {
      console.log('Creando cuotas para la venta')
      
      // Si hay cuotas personalizadas, usarlas
      if (cuotasPersonalizadas && Array.isArray(cuotasPersonalizadas) && cuotasPersonalizadas.length > 0) {
        console.log('Creando cuotas personalizadas')
        const cuotasACrear = cuotasPersonalizadas.map((cuota: any, index: number) => ({
          numeroCuota: index + 1,
          monto: parseFloat(cuota.monto),
          fechaVencimiento: new Date(cuota.fecha),
          estado: EstadoCuota.PENDIENTE,
          montoPagado: 0,
          ventaLoteId: tipoUnidad === 'LOTE' ? venta.id : null,
          ventaUnidadCementerioId: tipoUnidad === 'UNIDAD_CEMENTERIO' ? venta.id : null,
          createdBy: session.user.id
        }))
        
        await prisma.cuota.createMany({
          data: cuotasACrear
        })
        console.log(`${cuotasACrear.length} cuotas personalizadas creadas`)
      } 
      // Si no hay cuotas personalizadas, crear cuotas regulares
      else if (numeroCuotas && parseInt(numeroCuotas) > 1) {
        console.log('Creando cuotas regulares')
        const cuotasACrear = []
        const saldoFinanciar = parseFloat(saldoPendiente) || 0
        const numCuotas = parseInt(numeroCuotas) || 1
        const montoCuotaDecimal = saldoFinanciar / numCuotas
        const cuotaEntera = Math.floor(montoCuotaDecimal)
        const diferencia = saldoFinanciar - (cuotaEntera * numCuotas)
        
        // Calcular fechas según la frecuencia
        const fechaInicial = fechaPrimeraCuota ? new Date(fechaPrimeraCuota) : new Date()
        
        for (let i = 0; i < numCuotas; i++) {
          const fechaVencimiento = new Date(fechaInicial)
          
          // Calcular fecha según frecuencia
          switch (frecuenciaCuota) {
            case 'MENSUAL':
              fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i)
              break
            case 'QUINCENAL':
              fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * 15))
              break
            case 'SEMANAL':
              fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * 7))
              break
            case 'BIMESTRAL':
              fechaVencimiento.setMonth(fechaVencimiento.getMonth() + (i * 2))
              break
            case 'TRIMESTRAL':
              fechaVencimiento.setMonth(fechaVencimiento.getMonth() + (i * 3))
              break
            case 'SEMESTRAL':
              fechaVencimiento.setMonth(fechaVencimiento.getMonth() + (i * 6))
              break
            case 'ANUAL':
              fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + i)
              break
            default:
              fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i)
          }
          
          // Calcular monto de la cuota
          let montoCuota = cuotaEntera
          if (i === numCuotas - 1 && diferencia > 0) {
            // Última cuota con el resto
            montoCuota = cuotaEntera + diferencia
          }
          
          cuotasACrear.push({
            numeroCuota: i + 1,
            monto: montoCuota,
            fechaVencimiento: fechaVencimiento,
            estado: EstadoCuota.PENDIENTE,
            montoPagado: 0,
            ventaLoteId: tipoUnidad === 'LOTE' ? venta.id : null,
            ventaUnidadCementerioId: tipoUnidad === 'UNIDAD_CEMENTERIO' ? venta.id : null,
            createdBy: session.user.id
          })
        }
        
        // Crear las cuotas en la base de datos
        if (cuotasACrear.length > 0) {
          await prisma.cuota.createMany({
            data: cuotasACrear
          })
          console.log(`${cuotasACrear.length} cuotas regulares creadas`)
        }
      }
    }

    // Subir comprobantes de pago a Google Drive si existen
    if (comprobantes && comprobantes.length > 0) {
      console.log(`=== PROCESANDO COMPROBANTES ===`)
      console.log(`Procesando ${comprobantes.length} comprobantes de pago`)
      console.log('Venta ID:', venta.id)
      console.log('Tipo de unidad:', tipoUnidad)
      console.log('Comprobantes recibidos:', comprobantes.map(c => ({
        tipo: c.datos.tipo,
        monto: c.datos.monto,
        tieneArchivo: !!c.archivo,
        nombreArchivo: c.archivo?.name
      })))
      
      for (const comprobante of comprobantes) {
        try {
          const { archivo, datos } = comprobante
          
          if (!archivo) {
            console.log('Comprobante sin archivo, saltando...')
            continue
          }

          console.log('Procesando comprobante:', {
            tipo: datos.tipo,
            monto: datos.monto,
            fecha: datos.fecha,
            descripcion: datos.descripcion,
            nombreArchivo: archivo.name,
            tamanio: archivo.size
          })

          // Convertir el archivo a buffer
          const bytes = await archivo.arrayBuffer()
          const buffer = Buffer.from(bytes)

          // Generar nombre único para el archivo
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const fileName = `comprobante_${datos.tipo}_${timestamp}_${archivo.name}`

          console.log('Intentando subir a Google Drive:', fileName)

          let comprobanteGuardado;
          let archivoGuardado = false;

          // Intentar subir a Google Drive primero
          try {
          const driveFile = await googleDriveService.uploadFile(
            fileName,
            archivo.type,
            buffer
          )

            console.log('Archivo subido a Google Drive:', {
              id: driveFile.id,
              name: driveFile.name,
              webViewLink: driveFile.webViewLink,
              webContentLink: driveFile.webContentLink
            })

            // Guardar en la base de datos con Google Drive
            comprobanteGuardado = await prisma.comprobantePago.create({
            data: {
              tipo: datos.tipo,
              monto: parseFloat(datos.monto),
              fecha: new Date(datos.fecha),
              descripcion: datos.descripcion,
              nombreArchivo: driveFile.name,
              driveFileId: driveFile.id,
              driveFileUrl: driveFile.webViewLink,
              driveDownloadUrl: driveFile.webContentLink,
              mimeType: driveFile.mimeType,
              tamanio: driveFile.size,
              ventaLoteId: tipoUnidad === 'LOTE' ? venta.id : null,
              ventaUnidadCementerioId: tipoUnidad === 'UNIDAD_CEMENTERIO' ? venta.id : null,
              createdBy: session.user.id,
            },
          })

            archivoGuardado = true;
            console.log(`✅ Comprobante ${datos.tipo} guardado en BD con Google Drive:`, {
              id: comprobanteGuardado.id,
              ventaLoteId: comprobanteGuardado.ventaLoteId,
              ventaUnidadCementerioId: comprobanteGuardado.ventaUnidadCementerioId
            })

          } catch (googleDriveError) {
            console.error('❌ Error al subir a Google Drive:', googleDriveError)
            
            // Intentar guardar localmente como respaldo
            console.log('Intentando guardar localmente como respaldo...')
            
            try {
              // Crear directorio para archivos si no existe
              const uploadsDir = join(process.cwd(), 'public', 'uploads', 'comprobantes')
              if (!existsSync(uploadsDir)) {
                await mkdir(uploadsDir, { recursive: true })
              }

              // Generar nombre único para el archivo local
              const localFileName = `comprobante_${timestamp}_${archivo.name}`
              const filePath = join(uploadsDir, localFileName)

              // Guardar archivo localmente
              await writeFile(filePath, buffer)
              
              console.log('Archivo guardado localmente:', filePath)

              // Guardar en la base de datos con ruta local
              comprobanteGuardado = await prisma.comprobantePago.create({
                data: {
                  tipo: datos.tipo,
                  monto: parseFloat(datos.monto),
                  fecha: new Date(datos.fecha),
                  descripcion: datos.descripcion,
                  nombreArchivo: archivo.name,
                  driveFileId: 'LOCAL_BACKUP',
                  driveFileUrl: `/uploads/comprobantes/${localFileName}`,
                  driveDownloadUrl: `/uploads/comprobantes/${localFileName}`,
                  mimeType: archivo.type,
                  tamanio: archivo.size,
                  ventaLoteId: tipoUnidad === 'LOTE' ? venta.id : null,
                  ventaUnidadCementerioId: tipoUnidad === 'UNIDAD_CEMENTERIO' ? venta.id : null,
                  createdBy: session.user.id,
                },
              })

              archivoGuardado = true;
              console.log(`✅ Comprobante ${datos.tipo} guardado en BD con respaldo local:`, {
                id: comprobanteGuardado.id,
                ventaLoteId: comprobanteGuardado.ventaLoteId,
                ventaUnidadCementerioId: comprobanteGuardado.ventaUnidadCementerioId
              })

            } catch (localError) {
              console.error('❌ Error al guardar localmente también:', localError)
              
              // Como último recurso, guardar solo en la base de datos sin archivo
              comprobanteGuardado = await prisma.comprobantePago.create({
                data: {
                  tipo: datos.tipo,
                  monto: parseFloat(datos.monto),
                  fecha: new Date(datos.fecha),
                  descripcion: datos.descripcion,
                  nombreArchivo: archivo.name,
                  driveFileId: 'ERROR',
                  driveFileUrl: '',
                  driveDownloadUrl: '',
                  mimeType: archivo.type,
                  tamanio: archivo.size,
                  ventaLoteId: tipoUnidad === 'LOTE' ? venta.id : null,
                  ventaUnidadCementerioId: tipoUnidad === 'UNIDAD_CEMENTERIO' ? venta.id : null,
                  createdBy: session.user.id,
                },
              })

              console.log(`⚠️ Comprobante ${datos.tipo} guardado en BD sin archivo:`, {
                id: comprobanteGuardado.id,
                ventaLoteId: comprobanteGuardado.ventaLoteId,
                ventaUnidadCementerioId: comprobanteGuardado.ventaUnidadCementerioId
              })
            }
          }
        } catch (error) {
          console.error('❌ Error general al procesar comprobante:', error)
          // Continuar con el siguiente comprobante aunque falle uno
        }
      }
    } else {
      console.log('No hay comprobantes para procesar')
    }

    console.log('Venta creada exitosamente')
    return NextResponse.json({
      ...venta,
      tipoVenta
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear venta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 