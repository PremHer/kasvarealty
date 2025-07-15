import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { googleDriveService } from '@/lib/services/googleDriveService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ventaLoteId = formData.get('ventaLoteId') as string;
    const ventaUnidadCementerioId = formData.get('ventaUnidadCementerioId') as string;
    const tipo = formData.get('tipo') as string;
    const monto = parseFloat(formData.get('monto') as string);
    const fecha = new Date(formData.get('fecha') as string);
    const descripcion = formData.get('descripcion') as string;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    if (!ventaLoteId && !ventaUnidadCementerioId) {
      return NextResponse.json({ error: 'ID de venta requerido' }, { status: 400 });
    }

    if (!tipo || !monto || !fecha) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Verificar que la venta existe
    let venta;
    if (ventaLoteId) {
      venta = await prisma.ventaLote.findUnique({
        where: { id: ventaLoteId },
      });
    } else {
      venta = await prisma.ventaUnidadCementerio.findUnique({
        where: { id: ventaUnidadCementerioId },
      });
    }

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    // Convertir el archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar nombre único para el archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `comprobante_${tipo}_${timestamp}_${file.name}`;

    // Subir archivo a Google Drive
    const driveFile = await googleDriveService.uploadFile(
      fileName,
      file.type,
      buffer
    );

    // Guardar en la base de datos
    const comprobante = await prisma.comprobantePago.create({
      data: {
        tipo,
        monto,
        fecha,
        descripcion,
        nombreArchivo: driveFile.name,
        driveFileId: driveFile.id,
        driveFileUrl: driveFile.webViewLink,
        driveDownloadUrl: driveFile.webContentLink,
        mimeType: driveFile.mimeType,
        tamanio: driveFile.size,
        ventaLoteId: ventaLoteId || null,
        ventaUnidadCementerioId: ventaUnidadCementerioId || null,
        createdBy: session.user.id,
      },
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

    return NextResponse.json(comprobante);
  } catch (error) {
    console.error('Error al crear comprobante de pago:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ventaLoteId = searchParams.get('ventaLoteId');
    const ventaUnidadCementerioId = searchParams.get('ventaUnidadCementerioId');

    console.log('=== DEBUG GET Comprobantes ===')
    console.log('ventaLoteId:', ventaLoteId)
    console.log('ventaUnidadCementerioId:', ventaUnidadCementerioId)
    console.log('URL completa:', request.url)

    // Validar que al menos uno de los IDs tenga un valor no vacío
    if ((!ventaLoteId || ventaLoteId === '') && (!ventaUnidadCementerioId || ventaUnidadCementerioId === '')) {
      console.log('Error: ID de venta requerido')
      return NextResponse.json({ error: 'ID de venta requerido' }, { status: 400 });
    }

    const whereClause = {
        OR: [
          { ventaLoteId: ventaLoteId && ventaLoteId !== '' ? ventaLoteId : undefined },
          { ventaUnidadCementerioId: ventaUnidadCementerioId && ventaUnidadCementerioId !== '' ? ventaUnidadCementerioId : undefined },
        ],
    }

    console.log('Where clause:', JSON.stringify(whereClause, null, 2))

    // Verificar si hay comprobantes en la base de datos para esta venta
    const totalComprobantes = await prisma.comprobantePago.count({
      where: whereClause
    })
    console.log('Total de comprobantes en BD para esta venta:', totalComprobantes)

    const comprobantes = await prisma.comprobantePago.findMany({
      where: whereClause,
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
      orderBy: {
        fecha: 'desc',
      },
    });

    console.log('Comprobantes encontrados:', comprobantes.length)
    console.log('Comprobantes:', comprobantes.map(c => ({
      id: c.id,
      tipo: c.tipo,
      monto: c.monto,
      ventaLoteId: c.ventaLoteId,
      ventaUnidadCementerioId: c.ventaUnidadCementerioId,
      nombreArchivo: c.nombreArchivo,
      createdAt: c.createdAt
    })))

    return NextResponse.json(comprobantes);
  } catch (error) {
    console.error('Error al obtener comprobantes de pago:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 