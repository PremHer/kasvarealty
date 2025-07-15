import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el comprobante
    const comprobante = await prisma.comprobantePago.findUnique({
      where: { id: params.id }
    })

    if (!comprobante) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 })
    }

    // Si tiene archivo local, servirlo
    if (comprobante.localFilePath && comprobante.guardadoLocal) {
      try {
        const filePath = join(process.cwd(), 'public', comprobante.localFilePath)
        const fileBuffer = readFileSync(filePath)
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': comprobante.mimeType,
            'Content-Disposition': `attachment; filename="${comprobante.nombreArchivo}"`,
            'Content-Length': comprobante.tamanio.toString()
          }
        })
      } catch (error) {
        console.error('Error al leer archivo local:', error)
        return NextResponse.json({ error: 'Error al leer archivo' }, { status: 500 })
      }
    }

    // Si no tiene archivo local, redirigir a Google Drive
    if (comprobante.driveDownloadUrl) {
      return NextResponse.redirect(comprobante.driveDownloadUrl)
    }

    return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 })

  } catch (error) {
    console.error('Error al descargar comprobante:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 