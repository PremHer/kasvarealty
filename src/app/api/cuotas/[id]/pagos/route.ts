import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EstadoCuota, FormaPago, Rol } from '@prisma/client'
import { googleDriveService } from '@/lib/services/googleDriveService'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const CUOTAS_ROLES: Rol[] = ['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER', 'SALES_REP']

// Función para guardar archivo localmente como respaldo
async function saveFileLocally(file: File, buffer: Buffer): Promise<{ success: boolean, localPath?: string }> {
  try {
    // Crear directorio para archivos si no existe
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'comprobantes')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generar nombre único para el archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `comprobante_${timestamp}_${file.name}`
    const filePath = join(uploadsDir, fileName)

    // Guardar archivo
    await writeFile(filePath, buffer)
    
    console.log('Archivo guardado localmente:', filePath)
    return { success: true, localPath: `/uploads/comprobantes/${fileName}` }
  } catch (error) {
    console.error('Error al guardar archivo localmente:', error)
    return { success: false }
  }
}

// GET /api/cuotas/[id]/pagos - Obtener pagos de una cuota
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver pagos de cuotas
    if (!CUOTAS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver pagos de cuotas' }, { status: 403 })
    }

    // Verificar que la cuota existe
    const cuota = await prisma.cuota.findUnique({
      where: { id: params.id },
      include: {
        pagos: {
          include: {
            creadoPorUsuario: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            },
            comprobante: {
              select: {
                id: true,
                nombreArchivo: true,
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
        }
      }
    } as any)

    if (!cuota) {
      return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 })
    }

    // Usar directamente los datos de la base de datos
    const responseData = {
      cuota: {
        id: cuota.id,
        numeroCuota: cuota.numeroCuota,
        monto: cuota.monto,
        montoPagado: cuota.montoPagado, // Usar el valor de la BD
        estado: cuota.estado, // Usar el estado de la BD
        fechaVencimiento: cuota.fechaVencimiento
      },
      pagos: (cuota as any).pagos
    }
    
    console.log('Endpoint GET /pagos - Datos de cuota desde BD:', responseData.cuota)
    console.log('Monto pagado en BD:', cuota.montoPagado)
    console.log('Número de pagos:', (cuota as any).pagos.length)
    console.log('Pagos:', (cuota as any).pagos.map((p: any) => ({ id: p.id, monto: p.monto, fecha: p.fechaPago })))
    
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error al obtener pagos de cuota:', error)
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
    const voucherPago = formData.get('voucherPago') as string
    const observaciones = formData.get('observaciones') as string
    
    // Extraer archivos de comprobantes usando la misma estructura que en ventas
    const comprobantesFiles: Array<{ archivo: File, datos: any }> = []
    let index = 0
    
    while (formData.has(`comprobante_${index}`)) {
      const archivo = formData.get(`comprobante_${index}`) as File
      const datosString = formData.get(`comprobante_${index}_data`) as string
      const datos = JSON.parse(datosString)
      
      comprobantesFiles.push({ archivo, datos })
      index++
    }
    
    console.log(`Se recibieron ${comprobantesFiles.length} comprobantes con archivos`)

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
            vendedor: true
          }
        },
        ventaUnidadCementerio: {
          include: {
            vendedor: true
          }
        }
      }
    })

    if (!cuota) {
      return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 })
    }

    // Verificar permisos específicos para Sales Rep
    if (userRole === 'SALES_REP') {
      const venta = cuota.ventaLote || cuota.ventaUnidadCementerio
      if (venta?.vendedor?.id !== session.user.id) {
        return NextResponse.json({ error: 'No tienes permisos para crear pagos en esta cuota' }, { status: 403 })
      }
    }

    // Verificar que no se exceda el monto de la cuota
    const montoPagadoActual = cuota.montoPagado
    const nuevoMontoPagado = montoPagadoActual + parseFloat(monto)
    
    console.log('POST - Cálculos de pago:', {
      montoPagadoActual,
      nuevoPago: parseFloat(monto),
      nuevoMontoPagado,
      montoCuota: cuota.monto,
      excede: nuevoMontoPagado > cuota.monto
    })
    
    if (nuevoMontoPagado > cuota.monto) {
      return NextResponse.json({ 
        error: `El pago excede el monto de la cuota. Máximo permitido: ${cuota.monto - montoPagadoActual}` 
      }, { status: 400 })
    }

    let comprobanteId: string | null = null
    let archivoGuardado = false

    // Procesar archivos de comprobantes si existen
    if (comprobantesFiles.length > 0) {
      const comprobante = comprobantesFiles[0]
      
      if (comprobante.archivo && comprobante.archivo.size > 0) {
        console.log('Procesando archivo de comprobante...')
        
        // Convertir archivo a buffer
        const arrayBuffer = await comprobante.archivo.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Intentar subir a Google Drive primero
        try {
          console.log('Intentando subir a Google Drive...')
          const uploadResult = await googleDriveService.uploadFile(
            comprobante.archivo.name,
            comprobante.archivo.type,
            buffer,
            undefined
          )

          // Crear registro del comprobante en la base de datos
          const comprobanteRecord = await prisma.comprobantePago.create({
            data: {
              tipo: comprobante.datos.tipo,
              monto: parseFloat(comprobante.datos.monto),
              fecha: new Date(comprobante.datos.fecha),
              descripcion: comprobante.datos.descripcion,
              nombreArchivo: comprobante.archivo.name,
              driveFileId: uploadResult.id,
              driveFileUrl: uploadResult.webViewLink,
              driveDownloadUrl: uploadResult.webContentLink,
              mimeType: comprobante.archivo.type,
              tamanio: comprobante.archivo.size,
              ventaLoteId: cuota.ventaLoteId,
              ventaUnidadCementerioId: cuota.ventaUnidadCementerioId,
              createdBy: session.user.id
            }
          })

          comprobanteId = comprobanteRecord.id
          archivoGuardado = true
          console.log('✅ Archivo subido exitosamente a Google Drive')
          
        } catch (googleDriveError) {
          console.error('❌ Error al subir a Google Drive:', googleDriveError)
          
          // Intentar guardar localmente como respaldo
          console.log('Intentando guardar localmente como respaldo...')
          const localResult = await saveFileLocally(comprobante.archivo, buffer)
          
          if (localResult.success) {
            // Crear registro del comprobante con ruta local
            const comprobanteRecord = await prisma.comprobantePago.create({
              data: {
                tipo: comprobante.datos.tipo,
                monto: parseFloat(comprobante.datos.monto),
                fecha: new Date(comprobante.datos.fecha),
                descripcion: comprobante.datos.descripcion,
                nombreArchivo: comprobante.archivo.name,
                driveFileId: 'LOCAL_BACKUP',
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
            console.log('✅ Archivo guardado localmente como respaldo')
          } else {
            console.error('❌ Error al guardar localmente también')
          }
        }
      }
    }

    // Crear el pago usando transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el pago
      const pago = await (tx as any).pagoCuota.create({
        data: {
          monto: parseFloat(monto),
          fechaPago: new Date(fechaPago),
          formaPago: formaPago || null,
          voucherPago: voucherPago || null,
          observaciones: observaciones || null,
          cuotaId: params.id,
          createdBy: session.user.id,
          comprobanteId: comprobanteId
        },
        include: {
          creadoPorUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          },
          comprobante: {
            select: {
              id: true,
              nombreArchivo: true,
              driveFileUrl: true,
              driveDownloadUrl: true,
              mimeType: true,
              tamanio: true
            }
          }
        }
      })

      console.log('Pago creado en transacción:', {
        id: pago.id,
        monto: pago.monto,
        comprobanteId: pago.comprobanteId,
        comprobante: pago.comprobante
      })
      
      // Actualizar la cuota
      const cuotaActualizada = await tx.cuota.update({
        where: { id: params.id },
        data: {
          montoPagado: nuevoMontoPagado,
          estado: nuevoMontoPagado >= cuota.monto ? EstadoCuota.PAGADA : EstadoCuota.PARCIAL,
          fechaPago: nuevoMontoPagado >= cuota.monto ? new Date() : cuota.fechaPago,
          updatedBy: session.user.id
        }
      })

      return { pago, cuota: cuotaActualizada }
    })

    // Obtener la información completa actualizada después de la transacción
    const cuotaCompleta = await prisma.cuota.findUnique({
      where: { id: params.id },
      include: {
        pagos: {
          include: {
            creadoPorUsuario: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            },
            comprobante: {
              select: {
                id: true,
                nombreArchivo: true,
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
        }
      }
    } as any)

    console.log('POST - Cuota actualizada después del pago:', {
      id: cuotaCompleta?.id,
      montoPagado: cuotaCompleta?.montoPagado,
      estado: cuotaCompleta?.estado,
      numeroPagos: (cuotaCompleta as any)?.pagos?.length
    })
    
    // Log de los pagos para verificar si incluyen comprobantes
    if ((cuotaCompleta as any)?.pagos?.length > 0) {
      console.log('Pagos con comprobantes:', (cuotaCompleta as any).pagos.map((p: any) => ({
        id: p.id,
        monto: p.monto,
        comprobanteId: p.comprobanteId,
        comprobante: p.comprobante ? {
          id: p.comprobante.id,
          nombreArchivo: p.comprobante.nombreArchivo,
          tamanio: p.comprobante.tamanio
        } : null
      })))
    }

    return NextResponse.json({
      message: 'Pago registrado correctamente',
      pago: resultado.pago,
      cuota: {
        id: cuotaCompleta?.id,
        numeroCuota: cuotaCompleta?.numeroCuota,
        monto: cuotaCompleta?.monto,
        montoPagado: cuotaCompleta?.montoPagado,
        estado: cuotaCompleta?.estado,
        fechaVencimiento: cuotaCompleta?.fechaVencimiento
      },
      pagos: (cuotaCompleta as any)?.pagos || [],
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