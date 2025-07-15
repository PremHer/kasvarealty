import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ventaId = searchParams.get('ventaId');
    const tipoVenta = searchParams.get('tipoVenta');

    if (!ventaId || !tipoVenta) {
      return NextResponse.json({ error: 'ID de venta y tipo requeridos' }, { status: 400 });
    }

    console.log('=== CHECK COMPROBANTES ===');
    console.log('Venta ID:', ventaId);
    console.log('Tipo Venta:', tipoVenta);

    // Buscar comprobantes por venta
    const whereClause = tipoVenta === 'LOTE' 
      ? { ventaLoteId: ventaId }
      : { ventaUnidadCementerioId: ventaId };

    const comprobantes = await prisma.comprobantePago.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Comprobantes encontrados:', comprobantes.length);
    comprobantes.forEach((comp, index) => {
      console.log(`Comprobante ${index + 1}:`, {
        id: comp.id,
        tipo: comp.tipo,
        monto: comp.monto,
        ventaLoteId: comp.ventaLoteId,
        ventaUnidadCementerioId: comp.ventaUnidadCementerioId,
        nombreArchivo: comp.nombreArchivo,
        createdAt: comp.createdAt
      });
    });

    // Verificar si la venta existe
    let venta;
    if (tipoVenta === 'LOTE') {
      venta = await prisma.ventaLote.findUnique({
        where: { id: ventaId }
      });
    } else {
      venta = await prisma.ventaUnidadCementerio.findUnique({
        where: { id: ventaId }
      });
    }

    console.log('Venta existe:', !!venta);
    if (venta) {
      console.log('Venta creada en:', venta.createdAt);
    }

    return NextResponse.json({
      ventaId,
      tipoVenta,
      ventaExiste: !!venta,
      comprobantesEncontrados: comprobantes.length,
      comprobantes: comprobantes.map(c => ({
        id: c.id,
        tipo: c.tipo,
        monto: c.monto,
        ventaLoteId: c.ventaLoteId,
        ventaUnidadCementerioId: c.ventaUnidadCementerioId,
        nombreArchivo: c.nombreArchivo,
        createdAt: c.createdAt
      }))
    });

  } catch (error) {
    console.error('Error al verificar comprobantes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 