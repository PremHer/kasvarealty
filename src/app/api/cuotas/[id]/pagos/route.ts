import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

// Función helper para redondear a 2 decimales y evitar problemas de precisión
const roundToTwoDecimals = (value: number): number => {
  return parseFloat(value.toFixed(2))
}

// Roles que pueden ver pagos de cuotas
const CUOTAS_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'ADMIN', 
  'GERENTE_GENERAL',
  'FINANCE_MANAGER',
  'ACCOUNTANT',
  'FINANCE_ASSISTANT',
  'SALES_MANAGER',
  'SALES_REP',
  'SALES_ASSISTANT',
  'SALES_COORDINATOR'
]

// Función para guardar archivo localmente en desarrollo
async function saveFileLocally(file: File, buffer: Buffer): Promise<{ success: boolean, localPath?: string }> {
  try {
    // Crear directorio para archivos si no existe
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'comprobantes')
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }

    // Generar nombre único para el archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `comprobante_${timestamp}_${file.name}`
    const filePath = join(uploadsDir, fileName)

    // Guardar archivo
    writeFileSync(filePath, buffer)
    
    console.log('✅ Archivo guardado localmente:', filePath)
    return { success: true, localPath: `/uploads/comprobantes/${fileName}` }
  } catch (error) {
    console.error('❌ Error al guardar archivo localmente:', error)
    return { success: false }
  }
}

// Función para recalcular saldos de capital de todas las cuotas de una venta
async function recalcularSaldosCapital(ventaId: string, ventaLoteId?: string, ventaUnidadCementerioId?: string) {
  try {
    // Obtener todas las cuotas ordenadas por número
    const cuotas = await prisma.cuota.findMany({
      where: {
        OR: [
          { ventaLoteId: ventaLoteId || undefined },
          { ventaUnidadCementerioId: ventaUnidadCementerioId || undefined }
        ]
      },
      orderBy: { numeroCuota: 'asc' }
    })
    
    if (cuotas.length === 0) return
    
    // Obtener el saldo inicial de la venta
    const ventaLote = ventaLoteId ? await prisma.ventaLote.findUnique({
      where: { id: ventaLoteId },
      select: { precioVenta: true, montoInicial: true, saldoCapital: true }
    }) : null
    
    const ventaUnidad = ventaUnidadCementerioId ? await prisma.ventaUnidadCementerio.findUnique({
      where: { id: ventaUnidadCementerioId },
      select: { precioVenta: true, montoInicial: true, saldoCapital: true }
    }) : null
    
    const venta = ventaLote || ventaUnidad
    if (!venta) return
    
    // Usar saldoCapital si existe, sino calcular
    const saldoFinanciar = venta.saldoCapital || ((venta.precioVenta || 0) - (venta.montoInicial || 0))
    let saldoActual = saldoFinanciar
    
    // Recalcular saldos para cada cuota
    for (let i = 0; i < cuotas.length; i++) {
      const cuota = cuotas[i]
      const esUltimaCuota = i === cuotas.length - 1
      
      // Calcular saldo posterior
      const saldoPosterior = esUltimaCuota ? 0 : Math.max(0, saldoActual - (cuota.montoCapital || 0))
      
      // Actualizar la cuota
      await prisma.cuota.update({
        where: { id: cuota.id },
        data: {
          saldoCapitalAnterior: saldoActual,
          saldoCapitalPosterior: saldoPosterior
        }
      })
      
      // Actualizar saldo para la siguiente cuota
      saldoActual = saldoPosterior
    }
    
    console.log('✅ Saldos de capital recalculados para venta:', ventaId)
  } catch (error) {
    console.error('Error al recalcular saldos:', error)
  }
}

// GET /api/cuotas/[id]/pagos - Obtener pagos de una cuota
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 API Pagos - Iniciando GET para cuota:', params.id)
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log('❌ API Pagos - No hay sesión')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    console.log('🔍 API Pagos - Usuario:', session.user.email)
    console.log('🔍 API Pagos - Rol del usuario:', userRole)
    
    // Verificar si el usuario tiene permisos para ver pagos de cuotas
    if (!CUOTAS_ROLES.includes(userRole)) {
      console.log('❌ API Pagos - Usuario sin permisos, retornando 403')
      return NextResponse.json({ error: 'No tienes permisos para ver pagos de cuotas' }, { status: 403 })
    }
    
    console.log('✅ API Pagos - Usuario autorizado, continuando...')
    
    // Verificar que la cuota existe
    console.log('🔍 API Pagos - Buscando cuota con ID:', params.id)
    
    const cuota = await prisma.cuota.findUnique({
      where: { id: params.id }
    })
    
    console.log('🔍 API Pagos - Cuota encontrada:', cuota ? 'Sí' : 'No')
    
    if (!cuota) {
      console.log('❌ API Pagos - Cuota no encontrada')
      return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 })
    }
    
    // Obtener los pagos de la cuota
    console.log('🔍 API Pagos - Obteniendo pagos...')
    
    const pagos = await prisma.pagoCuota.findMany({
      where: { cuotaId: params.id },
      include: {
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        comprobantePago: {
          select: {
            id: true,
            nombreArchivo: true,
            driveFileId: true,
            driveFileUrl: true,
            driveDownloadUrl: true,
            mimeType: true,
            tamanio: true
          }
        }
      },
      orderBy: {
        fechaPago: 'desc'
      }
    })
    
    console.log('🔍 API Pagos - Pagos encontrados:', pagos.length)
    
    // Preparar respuesta
    const responseData = {
      cuota: {
        id: cuota.id,
        numeroCuota: cuota.numeroCuota,
        monto: cuota.monto,
        montoPagado: cuota.montoPagado,
        estado: cuota.estado,
        fechaVencimiento: cuota.fechaVencimiento
      },
      pagos: pagos
    }
    
    console.log('🔍 API Pagos - Datos de cuota:', responseData.cuota)
    console.log('🔍 API Pagos - Número de pagos:', pagos.length)
    console.log('✅ API Pagos - Enviando respuesta exitosa')
    
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ Error al obtener pagos de cuota:', error)
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/cuotas/[id]/pagos - Crear un nuevo pago para una cuota
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para crear pagos
    if (!CUOTAS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para crear pagos' }, { status: 403 })
    }

    // Parsear FormData
    const formData = await request.formData()
    const monto = formData.get('monto') as string
    const fechaPago = formData.get('fechaPago') as string
    const formaPago = formData.get('formaPago') as string
    const observaciones = formData.get('observaciones') as string
    
    // Extraer archivos de comprobantes
    const comprobantesFiles: Array<{ archivo: File, datos: any }> = []
    let index = 0
    
    while (formData.has(`comprobante_${index}`)) {
      const archivo = formData.get(`comprobante_${index}`) as File
      const datosString = formData.get(`comprobante_${index}_data`) as string
      const datos = JSON.parse(datosString)
      
      comprobantesFiles.push({ archivo, datos })
      index++
    }
    
    console.log(`🔍 API Pagos - Se recibieron ${comprobantesFiles.length} comprobantes con archivos`)

    // Validaciones
    if (!monto || parseFloat(monto) <= 0) {
      return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 })
    }

    if (!fechaPago) {
      return NextResponse.json({ error: 'La fecha de pago es requerida' }, { status: 400 })
    }

    // Verificar que la cuota existe
    const cuota = await prisma.cuota.findUnique({
      where: { id: params.id },
      include: {
        ventaLote: {
          include: {
            cuotas: {
              orderBy: { numeroCuota: 'asc' }
            }
          }
        },
        ventaUnidadCementerio: {
          include: {
            cuotas: {
              orderBy: { numeroCuota: 'asc' }
            }
          }
        }
      }
    })

    if (!cuota) {
      return NextResponse.json(
        { error: 'Cuota no encontrada' },
        { status: 404 }
      )
    }

    // NUEVO: Validación de pago secuencial
    const venta = cuota.ventaLote || cuota.ventaUnidadCementerio
    if (venta) {
      const cuotasOrdenadas = venta.cuotas.sort((a, b) => a.numeroCuota - b.numeroCuota)
      const cuotaActual = cuotasOrdenadas.find(c => c.id === params.id)
      
      if (cuotaActual) {
        // Buscar la cuota anterior que no esté completamente pagada
        const cuotaAnteriorPendiente = cuotasOrdenadas.find(c => 
          c.numeroCuota < cuotaActual.numeroCuota && 
          c.montoPagado < c.monto
        )
        
        if (cuotaAnteriorPendiente) {
          return NextResponse.json(
            { 
              error: `No puedes pagar la cuota ${cuotaActual.numeroCuota} antes de completar la cuota ${cuotaAnteriorPendiente.numeroCuota}. Debes pagar las cuotas en orden secuencial.` 
            },
            { status: 400 }
          )
        }
      }
    }

    // Verificar que la venta esté aprobada
    const ventaActual = cuota.ventaLote || cuota.ventaUnidadCementerio
    if (!ventaActual) {
      return NextResponse.json({ error: 'Venta no encontrada para esta cuota' }, { status: 404 })
    }

    if (ventaActual.estado !== 'APROBADA') {
      return NextResponse.json({ 
        error: `No se pueden registrar pagos porque la venta está en estado "${ventaActual.estado}". La venta debe estar APROBADA para poder registrar pagos.` 
      }, { status: 400 })
    }

    // Verificar que no se exceda el monto de la cuota (incluyendo intereses por mora)
    const montoPagadoActual = roundToTwoDecimals(cuota.montoPagado || 0)
    const montoPagoRedondeado = roundToTwoDecimals(parseFloat(monto))
    const montoCuotaBase = roundToTwoDecimals(cuota.monto)
    const interesMora = cuota.interesMora || 0
    const montoCuotaTotal = roundToTwoDecimals(montoCuotaBase + interesMora)
    const nuevoMontoPagado = roundToTwoDecimals(montoPagadoActual + montoPagoRedondeado)
    
    console.log('🔍 API Pagos - Validación de monto con mora:', {
      montoPagadoActual,
      montoPagoOriginal: parseFloat(monto),
      montoPagoRedondeado,
      montoCuotaBase,
      interesMora,
      montoCuotaTotal,
      nuevoMontoPagado,
      excede: nuevoMontoPagado > montoCuotaTotal,
      diferencia: nuevoMontoPagado - montoCuotaTotal,
      maximoPermitido: roundToTwoDecimals(montoCuotaTotal - montoPagadoActual)
    })
    
    // Usar una comparación más tolerante para evitar problemas de precisión decimal
    const diferencia = nuevoMontoPagado - montoCuotaTotal
    const tolerancia = 0.01 // Tolerancia de 1 centavo
    
    if (diferencia > tolerancia) {
      return NextResponse.json({ 
        error: `El pago excede el monto de la cuota. Máximo permitido: ${roundToTwoDecimals(montoCuotaTotal - montoPagadoActual).toFixed(2)} (Cuota base: ${montoCuotaBase.toFixed(2)} + Mora: ${interesMora.toFixed(2)})` 
      }, { status: 400 })
    }

    let comprobanteId: string | null = null
    let archivoGuardado = false

    // Procesar archivos de comprobantes si existen
    if (comprobantesFiles.length > 0) {
      const comprobante = comprobantesFiles[0]
      
      if (comprobante.archivo && comprobante.archivo.size > 0) {
        console.log('🔍 API Pagos - Procesando archivo de comprobante...')
        
        // Convertir archivo a buffer
        const arrayBuffer = await comprobante.archivo.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Guardar archivo localmente (solo desarrollo)
        console.log('🔍 API Pagos - Guardando archivo localmente...')
        const localResult = await saveFileLocally(comprobante.archivo, buffer)
        
        if (localResult.success) {
          // Crear registro del comprobante en la base de datos
          const comprobanteRecord = await prisma.comprobantePago.create({
            data: {
              tipo: comprobante.datos.tipo,
              monto: roundToTwoDecimals(parseFloat(comprobante.datos.monto)), // Redondear el monto del comprobante
              fecha: new Date(comprobante.datos.fecha),
              descripcion: comprobante.datos.descripcion,
              nombreArchivo: comprobante.archivo.name,
              driveFileId: 'LOCAL_DEV',
              driveFileUrl: localResult.localPath || '',
              driveDownloadUrl: localResult.localPath || '',
              mimeType: comprobante.archivo.type,
              tamanio: comprobante.archivo.size,
              ventaLoteId: cuota.ventaLoteId,
              ventaUnidadCementerioId: cuota.ventaUnidadCementerioId,
              createdBy: session.user.id
            }
          })

          comprobanteId = comprobanteRecord.id
          archivoGuardado = true
          console.log('✅ API Pagos - Archivo guardado localmente y registro creado')
        } else {
          console.log('❌ API Pagos - Error al guardar archivo localmente')
        }
      }
    }

    // Crear el pago
    const pago = await prisma.pagoCuota.create({
      data: {
        cuotaId: params.id,
        monto: montoPagoRedondeado, // Usar el monto redondeado
        fechaPago: new Date(fechaPago),
        metodoPago: formaPago,
        observaciones: observaciones || null,
        createdBy: session.user.id,
        comprobantePagoId: comprobanteId
      },
      include: {
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    // Determinar el nuevo estado de la cuota
    let nuevoEstado = cuota.estado
    console.log('🔍 API Pagos - Calculando nuevo estado:', {
      estadoActual: cuota.estado,
      montoPagado: nuevoMontoPagado,
      montoCuota: cuota.monto,
      esPagada: nuevoMontoPagado >= cuota.monto,
      esParcial: nuevoMontoPagado > 0 && nuevoMontoPagado < cuota.monto
    })
    
    if (nuevoMontoPagado >= cuota.monto) {
      nuevoEstado = 'PAGADA'
      console.log('✅ API Pagos - Cuota marcada como PAGADA')
    } else if (nuevoMontoPagado > 0) {
      nuevoEstado = 'PARCIAL'
      console.log('✅ API Pagos - Cuota marcada como PARCIAL')
    }
    
    // Verificar si la cuota está vencida
    const fechaVencimiento = new Date(cuota.fechaVencimiento)
    const fechaActual = new Date()
    const estaVencida = fechaVencimiento < fechaActual
    
    console.log('🔍 API Pagos - Verificación de vencimiento:', {
      fechaVencimiento: fechaVencimiento.toISOString(),
      fechaActual: fechaActual.toISOString(),
      estaVencida,
      nuevoEstado
    })
    
    if (nuevoEstado !== 'PAGADA' && estaVencida) {
      nuevoEstado = 'VENCIDA'
      console.log('✅ API Pagos - Cuota marcada como VENCIDA')
    }
    
    console.log('🔍 API Pagos - Actualizando estado de cuota:', {
      estadoAnterior: cuota.estado,
      nuevoEstado,
      montoPagado: nuevoMontoPagado,
      montoCuota: cuota.monto,
      fechaVencimiento: cuota.fechaVencimiento
    })
    
    // Actualizar el monto pagado y estado de la cuota
    const cuotaActualizada = await prisma.cuota.update({
      where: { id: params.id },
      data: {
        montoPagado: nuevoMontoPagado,
        estado: nuevoMontoPagado >= montoCuotaTotal ? 'PAGADA' : 'PARCIAL',
        updatedBy: session.user.id
      }
    })
    
    // NUEVO: Si la cuota se pagó completamente, actualizar su saldo posterior
    if (nuevoMontoPagado >= montoCuotaTotal && cuota.saldoCapitalAnterior) {
      const saldoPosteriorFinal = Math.max(0, cuota.saldoCapitalAnterior - (cuota.montoCapital || 0))
      
      await prisma.cuota.update({
        where: { id: params.id },
        data: {
          saldoCapitalPosterior: saldoPosteriorFinal,
          updatedBy: session.user.id
        }
      })
      
      console.log('✅ Saldo posterior final actualizado:', {
        cuotaId: params.id,
        saldoPosteriorFinal
      })
    }

            // NUEVO: Actualizar saldos de capital automáticamente
        if (nuevoMontoPagado > 0) {
          let montoCapitalPagado = 0
          let nuevoSaldoPosterior = 0
          
          // Si hay datos de amortización, usar la lógica de capital
          if (cuota.montoCapital && cuota.saldoCapitalAnterior) {
            montoCapitalPagado = Math.min(nuevoMontoPagado, cuota.montoCapital)
            
            // Verificar si es la última cuota
            const totalCuotas = await prisma.cuota.count({
              where: {
                ventaLoteId: cuota.ventaLoteId,
                ventaUnidadCementerioId: cuota.ventaUnidadCementerioId
              }
            })
            
            if (cuota.numeroCuota === totalCuotas) {
              // Es la última cuota, saldo posterior debe ser 0
              nuevoSaldoPosterior = 0
            } else {
              // No es la última cuota, calcular normalmente
              nuevoSaldoPosterior = Math.max(0, cuota.saldoCapitalAnterior - montoCapitalPagado)
            }
          } else {
            // Si no hay datos de amortización, asumir que todo es capital
            montoCapitalPagado = nuevoMontoPagado
            
            // Verificar si es la última cuota
            const totalCuotas = await prisma.cuota.count({
              where: {
                ventaLoteId: cuota.ventaLoteId,
                ventaUnidadCementerioId: cuota.ventaUnidadCementerioId
              }
            })
            
            if (cuota.numeroCuota === totalCuotas) {
              // Es la última cuota, saldo posterior debe ser 0
              nuevoSaldoPosterior = 0
            } else {
              // No es la última cuota, calcular normalmente
              nuevoSaldoPosterior = Math.max(0, cuota.saldoCapitalAnterior - montoCapitalPagado)
            }
          }
          
          const montoInteresPagado = Math.max(0, nuevoMontoPagado - montoCapitalPagado)
          
          // Actualizar saldos de capital en la cuota actual
          await prisma.cuota.update({
            where: { id: params.id },
            data: {
              saldoCapitalAnterior: cuota.saldoCapitalAnterior,
              saldoCapitalPosterior: nuevoSaldoPosterior,
              updatedBy: session.user.id
            }
          })
          
          // NUEVO: Actualizar saldo anterior de la siguiente cuota
          const siguienteCuota = await prisma.cuota.findFirst({
            where: {
              ventaLoteId: cuota.ventaLoteId,
              ventaUnidadCementerioId: cuota.ventaUnidadCementerioId,
              numeroCuota: cuota.numeroCuota + 1
            }
          })
          
          if (siguienteCuota) {
            await prisma.cuota.update({
              where: { id: siguienteCuota.id },
              data: {
                saldoCapitalAnterior: nuevoSaldoPosterior,
                updatedBy: session.user.id
              }
            })
            
            console.log('✅ Saldo anterior de siguiente cuota actualizado:', {
              cuotaId: siguienteCuota.id,
              numeroCuota: siguienteCuota.numeroCuota,
              nuevoSaldoAnterior: nuevoSaldoPosterior
            })
          }
          
          console.log('✅ Saldos de capital actualizados:', {
            cuotaId: params.id,
            saldoAnterior: cuota.saldoCapitalAnterior,
            capitalPagado: montoCapitalPagado,
            saldoPosterior: nuevoSaldoPosterior
          })
        }

    return NextResponse.json({
      message: 'Pago registrado correctamente',
      pago: pago,
      archivoGuardado: archivoGuardado
    })

  } catch (error) {
    console.error('Error al crear pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 