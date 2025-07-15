import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol, TipoPagoComision, FormaPago } from '@prisma/client'
import { googleDriveService } from '@/lib/services/googleDriveService'

// Roles permitidos para gestionar pagos de comisiones
const PAGO_COMISION_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'FINANCE_MANAGER',
  'ACCOUNTANT',
  'GERENTE_GENERAL'
]

// POST /api/comisiones/pagos - Registrar pago de comisión
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para registrar pagos
    if (!PAGO_COMISION_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para registrar pagos de comisiones' }, { status: 403 })
    }

    // Parsear FormData
    const formData = await request.formData()
    const monto = formData.get('monto') as string
    const fechaPago = formData.get('fechaPago') as string
    const formaPago = formData.get('formaPago') as string
    const tipoPago = formData.get('tipoPago') as string
    const observaciones = formData.get('observaciones') as string
    const ventaLoteId = formData.get('ventaLoteId') as string
    const ventaUnidadCementerioId = formData.get('ventaUnidadCementerioId') as string
    
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

    // Validaciones
    if (!monto || parseFloat(monto) <= 0) {
      return NextResponse.json({ error: 'El monto debe ser mayor a 0' }, { status: 400 })
    }

    if (!fechaPago) {
      return NextResponse.json({ error: 'La fecha de pago es requerida' }, { status: 400 })
    }

    if (!ventaLoteId && !ventaUnidadCementerioId) {
      return NextResponse.json({ error: 'Debe especificar una venta' }, { status: 400 })
    }

    // Verificar que la venta existe y tiene comisión
    let venta
    if (ventaLoteId) {
      venta = await prisma.ventaLote.findUnique({
        where: { id: ventaLoteId },
        include: {
          vendedor: true,
          cliente: true,
          pagosComisiones: true
        }
      })
    } else {
      venta = await prisma.ventaUnidadCementerio.findUnique({
        where: { id: ventaUnidadCementerioId },
        include: {
          vendedor: true,
          cliente: true,
          pagosComisiones: true
        }
      })
    }

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    if (!venta.comisionVendedor || venta.comisionVendedor <= 0) {
      return NextResponse.json({ error: 'Esta venta no tiene comisión asignada' }, { status: 400 })
    }

    // Calcular monto ya pagado
    const montoPagado = venta.pagosComisiones.reduce((sum, pago) => sum + pago.monto, 0)
    const montoPendiente = venta.comisionVendedor - montoPagado
    const nuevoPago = parseFloat(monto)

    // Verificar que no se exceda el monto de comisión
    if (montoPagado + nuevoPago > venta.comisionVendedor) {
      return NextResponse.json({ 
        error: `El pago excede el monto de comisión. Máximo permitido: ${montoPendiente}` 
      }, { status: 400 })
    }

    // Determinar automáticamente el tipo de pago
    const tipoPagoAutomatico = (montoPagado + nuevoPago) >= venta.comisionVendedor ? 'COMPLETO' : 'PARCIAL'

    // Crear el pago usando transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el pago de comisión
      const pagoComision = await tx.pagoComision.create({
        data: {
          monto: nuevoPago,
          fechaPago: new Date(fechaPago),
          formaPago: formaPago as FormaPago,
          tipoPago: tipoPagoAutomatico as TipoPagoComision,
          observaciones: observaciones || null,
          ventaLoteId: ventaLoteId || null,
          ventaUnidadCementerioId: ventaUnidadCementerioId || null,
          createdBy: session.user.id
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

      // Subir comprobantes si existen
      const comprobantesCreados = []
      for (const comprobanteFile of comprobantesFiles) {
        try {
          // Convertir el archivo a buffer
          const bytes = await comprobanteFile.archivo.arrayBuffer()
          const buffer = Buffer.from(bytes)

          // Generar nombre único para el archivo
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const fileName = `comprobante_comision_${timestamp}_${comprobanteFile.archivo.name}`

          let comprobanteData: any = {
            tipo: comprobanteFile.datos.tipo,
            monto: comprobanteFile.datos.monto,
            fecha: new Date(comprobanteFile.datos.fecha),
            descripcion: comprobanteFile.datos.descripcion,
            nombreArchivo: comprobanteFile.archivo.name,
            mimeType: comprobanteFile.archivo.type,
            tamanio: comprobanteFile.archivo.size,
            ventaLoteId: ventaLoteId || null,
            ventaUnidadCementerioId: ventaUnidadCementerioId || null,
            createdBy: session.user.id
          }

          // Intentar subir a Google Drive primero
          try {
            const driveFile = await googleDriveService.uploadFile(
              fileName,
              comprobanteFile.archivo.type,
              buffer
            )

            // Si se subió exitosamente, agregar datos de Google Drive
            comprobanteData = {
              ...comprobanteData,
              driveFileId: driveFile.id,
              driveFileUrl: driveFile.webViewLink,
              driveDownloadUrl: driveFile.webContentLink,
              nombreArchivo: driveFile.name
            }

            console.log('✅ Comprobante subido exitosamente a Google Drive')
          } catch (driveError) {
            console.error('❌ Error al subir a Google Drive, guardando localmente:', driveError)
            
            // Guardar archivo localmente en la carpeta public/uploads
            const fs = require('fs')
            const path = require('path')
            
            // Crear directorio si no existe
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'comprobantes')
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true })
            }
            
            const localFileName = `${timestamp}_${comprobanteFile.archivo.name}`
            const localFilePath = path.join(uploadDir, localFileName)
            
            fs.writeFileSync(localFilePath, buffer)
            
            // Agregar datos del archivo local
            comprobanteData = {
              ...comprobanteData,
              localFilePath: `/uploads/comprobantes/${localFileName}`,
              guardadoLocal: true
            }
            
            console.log('✅ Comprobante guardado localmente')
          }

          // Crear comprobante en la base de datos
          const comprobante = await tx.comprobantePago.create({
            data: comprobanteData
          })

          // Relacionar comprobante con el pago
          await tx.comprobantePago.update({
            where: { id: comprobante.id },
            data: {
              pagosComisiones: {
                connect: { id: pagoComision.id }
              }
            }
          })

          comprobantesCreados.push(comprobante)
        } catch (error) {
          console.error('Error al procesar comprobante:', error)
          // Continuar con otros comprobantes
        }
      }

      return { pagoComision, comprobantes: comprobantesCreados }
    })

    return NextResponse.json({
      message: 'Pago de comisión registrado correctamente',
      pago: resultado.pagoComision,
      comprobantes: resultado.comprobantes
    })

  } catch (error) {
    console.error('Error al registrar pago de comisión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 