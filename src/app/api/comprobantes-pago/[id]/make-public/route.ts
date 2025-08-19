import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { googleDriveService } from '@/lib/services/googleDriveService';

// POST /api/comprobantes-pago/[id]/make-public - Hacer público un archivo de Google Drive
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el comprobante
    const comprobante = await prisma.comprobantePago.findUnique({
      where: { id: params.id },
      include: {
        ventaLote: true,
        ventaUnidadCementerio: true,
      },
    });

    if (!comprobante) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    // Verificar permisos - el usuario debe estar relacionado con la venta
    const venta = comprobante.ventaLote || comprobante.ventaUnidadCementerio;
    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Establecer permisos públicos en Google Drive
    if (comprobante.driveFileId) {
      await googleDriveService.setPublicPermissions(comprobante.driveFileId);
    }

    // Obtener información actualizada del archivo
    const fileInfo = comprobante.driveFileId ? await googleDriveService.getFileInfo(comprobante.driveFileId) : null;

    if (fileInfo) {
      // Actualizar las URLs en la base de datos
      await prisma.comprobantePago.update({
        where: { id: params.id },
        data: {
          driveFileUrl: fileInfo.webViewLink,
          driveDownloadUrl: fileInfo.webContentLink,
        },
      });
    }

    return NextResponse.json({ 
      message: 'Archivo hecho público correctamente',
      fileInfo 
    });
  } catch (error) {
    console.error('Error al hacer público el archivo:', error);
    return NextResponse.json(
      { error: 'Error al hacer público el archivo' },
      { status: 500 }
    );
  }
} 