import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const CONTRATOS_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'GERENTE_GENERAL',
  'SALES_MANAGER',
  'SALES_REP',
  'SALES_ASSISTANT',
  'PROJECT_MANAGER',
  'FINANCE_MANAGER'
]

// GET /api/contratos/[id]/download-pdf - Descargar PDF del contrato
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Debug download-pdf - Iniciando descarga para contrato:', params.id)
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log('❌ Error: Usuario no autorizado')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    console.log('👤 Usuario autenticado:', session.user.email, 'Rol:', userRole)

    if (!CONTRATOS_ROLES.includes(userRole)) {
      console.log('❌ Error: Rol no permitido:', userRole)
      return NextResponse.json({ error: 'No tienes permisos para descargar PDFs' }, { status: 403 })
    }

    const contrato = await prisma.contrato.findUnique({
      where: { id: params.id }
    })

    if (!contrato) {
      console.log('❌ Error: Contrato no encontrado')
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    console.log('📄 Contrato encontrado:', contrato.numeroContrato)

    if (userRole === 'SALES_REP') {
      let venta = null
      if (contrato.ventaLoteId) {
        venta = await prisma.ventaLote.findFirst({
          where: { id: contrato.ventaLoteId }
        })
      } else if (contrato.ventaUnidadCementerioId) {
        venta = await prisma.ventaUnidadCementerio.findFirst({
          where: { id: contrato.ventaUnidadCementerioId }
        })
      }
      if (venta && venta.vendedorId !== session.user.id) {
        return NextResponse.json(
          { error: 'No tienes permisos para descargar PDF de este contrato' },
          { status: 403 }
        )
      }
    }

    // Buscar el archivo PDF más reciente para este contrato
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'contratos')
    console.log('📂 Buscando en directorio:', uploadsDir)
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Error: Directorio de uploads no existe')
      return NextResponse.json(
        { error: 'No se encontró el directorio de archivos' },
        { status: 404 }
      )
    }

    // Listar archivos y buscar uno que coincida con el patrón del contrato
    const files = fs.readdirSync(uploadsDir)
    console.log('📂 Archivos en el directorio de uploads:')
    files.forEach(file => {
      if (file.includes(contrato.numeroContrato)) {
        console.log('  - ✅', file)
      } else {
        console.log('  - 📄', file)
      }
    })

    // Buscar archivos que coincidan con el patrón del contrato
    const pdfFiles = files.filter(file => 
      file.startsWith(`contrato_${contrato.numeroContrato}_`) && 
      file.endsWith('.pdf')
    )

    console.log('🔍 Archivos PDF encontrados:', pdfFiles)

    if (pdfFiles.length === 0) {
      console.log('❌ Error: No se encontró archivo PDF para este contrato')
      return NextResponse.json(
        { error: 'No se encontró el archivo PDF del contrato' },
        { status: 404 }
      )
    }

    // Obtener el archivo más reciente
    const latestFile = pdfFiles.sort().pop()
    console.log('✅ Archivo PDF seleccionado:', latestFile)
    const filePath = path.join(uploadsDir, latestFile!)

    console.log('✅ Archivo PDF encontrado, procediendo con la descarga')
    
    const fileBuffer = fs.readFileSync(filePath)
    const fileName = path.basename(filePath)
    console.log('📊 Tamaño del archivo:', fileBuffer.length, 'bytes')

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('❌ Error al leer el archivo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 