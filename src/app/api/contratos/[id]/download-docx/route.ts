import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Debug download-docx - Iniciando descarga para contrato:', params.id)
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log('❌ Error: Usuario no autorizado')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    console.log('👤 Usuario autenticado:', session.user.email, 'Rol:', userRole)

    if (!CONTRATOS_ROLES.includes(userRole)) {
      console.log('❌ Error: Rol no permitido:', userRole)
      return NextResponse.json({ error: 'No tienes permisos para descargar contratos' }, { status: 403 })
    }

    // Buscar el contrato
    const contrato = await prisma.contrato.findUnique({
      where: { id: params.id }
    })

    if (!contrato) {
      console.log('❌ Error: Contrato no encontrado')
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    console.log('📄 Contrato encontrado:', contrato.numeroContrato)

    // Verificar permisos específicos para SALES_REP
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
        console.log('❌ Error: SALES_REP no tiene permisos para este contrato')
        return NextResponse.json(
          { error: 'No tienes permisos para descargar este contrato' },
          { status: 403 }
        )
      }
    }

    // Buscar archivos que coincidan con el patrón del contrato
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'contratos')
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Error: Directorio de uploads no existe')
      return NextResponse.json({ error: 'Directorio de uploads no encontrado' }, { status: 404 })
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

    // Buscar archivo DOCX que coincida con el patrón del contrato
    const docxFile = files.find(file => 
      file.startsWith(`contrato_${contrato.numeroContrato}_`) && 
      file.endsWith('.docx')
    )

    if (!docxFile) {
      console.log('❌ Error: No se encontró archivo DOCX para este contrato')
      return NextResponse.json({ error: 'Archivo DOCX no encontrado para este contrato' }, { status: 404 })
    }

    console.log('✅ Archivo DOCX encontrado:', docxFile)
    const docxPath = path.join(uploadsDir, docxFile)

    // Verificar si el archivo existe
    if (!fs.existsSync(docxPath)) {
      console.log('❌ Error: Archivo DOCX no encontrado en la ruta especificada')
      return NextResponse.json({ error: 'Archivo DOCX no encontrado' }, { status: 404 })
    }

    console.log('✅ Archivo DOCX encontrado, procediendo con la descarga')

    // Leer el archivo
    const fileBuffer = fs.readFileSync(docxPath)
    console.log('📊 Tamaño del archivo:', fileBuffer.length, 'bytes')

    // Retornar el archivo como respuesta
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${docxFile}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('❌ Error al descargar DOCX:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
