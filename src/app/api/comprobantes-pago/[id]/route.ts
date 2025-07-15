import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { googleDriveService } from '@/lib/services/googleDriveService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Buscar el comprobante
    const comprobante = await prisma.comprobantePago.findUnique({
      where: { id },
      include: {
        ventaLote: true,
        ventaUnidadCementerio: true,
      },
    });

    if (!comprobante) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    // Eliminar el archivo de Google Drive
    try {
      await googleDriveService.deleteFile(comprobante.driveFileId);
    } catch (error) {
      console.error('Error al eliminar archivo de Google Drive:', error);
      // Continuar con la eliminación de la base de datos aunque falle Google Drive
    }

    // Eliminar de la base de datos
    await prisma.comprobantePago.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Comprobante eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar comprobante de pago:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    const comprobante = await prisma.comprobantePago.findUnique({
      where: { id },
      include: {
        ventaLote: {
          include: {
            cliente: true,
            lote: true,
            proyecto: true,
          },
        },
        ventaUnidadCementerio: {
          include: {
            cliente: true,
            unidadCementerio: true,
            proyecto: true,
          },
        },
      },
    });

    if (!comprobante) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    return NextResponse.json(comprobante);
  } catch (error) {
    console.error('Error al obtener comprobante de pago:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 