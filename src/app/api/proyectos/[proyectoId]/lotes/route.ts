import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LoteCreateInput } from '@/types/lote';
import { ManzanaService } from '@/lib/services/manzanaService';

// Función para calcular el área del lote
function calcularAreaLote(
  dimensionFrente?: number,
  dimensionFondo?: number,
  dimensionIzquierda?: number,
  dimensionDerecha?: number
): number {
  // Si tenemos las cuatro dimensiones, calculamos área usando promedios
  if (dimensionFrente && dimensionFondo && dimensionIzquierda && dimensionDerecha) {
    // Si es rectangular (frente = derecha y fondo = izquierda)
    if (dimensionFrente === dimensionDerecha && dimensionIzquierda === dimensionFondo) {
      return parseFloat((dimensionFrente * dimensionFondo).toFixed(2));
    } else {
      // Para lotes irregulares, usamos el promedio de las dimensiones opuestas
      const largo = (dimensionFrente + dimensionFondo) / 2;
      const ancho = (dimensionIzquierda + dimensionDerecha) / 2;
      const area = largo * ancho;
      return parseFloat(area.toFixed(2));
    }
  }
  
  // Si tenemos frente y fondo, usamos esos (área rectangular)
  if (dimensionFrente && dimensionFondo) {
    return parseFloat((dimensionFrente * dimensionFondo).toFixed(2));
  }
  
  // Si solo tenemos algunas dimensiones, estimamos
  if (dimensionFrente && dimensionIzquierda) {
    return parseFloat((dimensionFrente * dimensionIzquierda).toFixed(2));
  }
  
  return 0;
}

// Función para generar el siguiente número de lote
async function generarSiguienteNumeroLote(manzanaId: string): Promise<string> {
  const ultimoLote = await prisma.lote.findFirst({
    where: { manzanaId },
    orderBy: { numero: 'desc' }
  });

  if (!ultimoLote) {
    return '01';
  }

  const ultimoNumero = parseInt(ultimoLote.numero);
  const siguienteNumero = ultimoNumero + 1;
  return siguienteNumero.toString().padStart(2, '0');
}

// GET /api/proyectos/[proyectoId]/lotes
export async function GET(
  request: Request,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const { proyectoId } = params;
    const { searchParams } = new URL(request.url);
    const manzanaId = searchParams.get('manzanaId');
    const search = searchParams.get('search');
    const estado = searchParams.get('estado');

    if (!proyectoId) {
      return new NextResponse('ID de proyecto no proporcionado', { status: 400 });
    }

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId }
    });

    if (!proyecto) {
      return new NextResponse('Proyecto no encontrado', { status: 404 });
    }

    // Construir filtros
    const where: any = {
      manzana: {
        proyectoId: proyectoId
      }
    };

    if (manzanaId) {
      where.manzanaId = manzanaId;
    }

    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { numero: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (estado) {
      where.estado = estado;
    }

    // Obtener los lotes del proyecto con relaciones
    const lotes = await prisma.lote.findMany({
      where,
      include: {
        manzana: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        },
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        actualizadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: [
        { manzana: { codigo: 'asc' } },
        { numero: 'asc' }
      ]
    });

    return NextResponse.json(lotes);
  } catch (error) {
    console.error('Error al obtener lotes:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}

// POST /api/proyectos/[proyectoId]/lotes
export async function POST(
  request: Request,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // Verificar permisos para crear lotes
    const userRole = session.user?.role;
    const canCreateLotes = [
      'SUPER_ADMIN',
      'GERENTE_GENERAL',
      'PROJECT_MANAGER'
    ].includes(userRole);

    if (!canCreateLotes) {
      return new NextResponse(
        'No tienes permisos para crear lotes. Solo los Project Managers, Gerentes Generales y Super Admins pueden realizar esta acción.',
        { status: 403 }
      );
    }

    const { proyectoId } = params;
    const body = await request.json();
    const { manzanaId, ...loteData } = body;

    if (!manzanaId) {
      return new NextResponse('ID de manzana no proporcionado', { status: 400 });
    }

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId }
    });

    if (!proyecto) {
      return new NextResponse('Proyecto no encontrado', { status: 404 });
    }

    // Verificar que la manzana existe y pertenece al proyecto
    const manzana = await prisma.manzana.findFirst({
      where: {
        id: manzanaId,
        proyectoId: proyectoId
      }
    });

    if (!manzana) {
      return new NextResponse('Manzana no encontrada', { status: 404 });
    }

    // Verificar que la manzana esté activa para poder crear lotes
    if (!manzana.isActive) {
      return new NextResponse(
        'No se pueden crear lotes en una manzana inactiva. Primero debe activar la manzana.',
        { status: 400 }
      );
    }

    // Determinar código y número del lote
    let codigoLote: string;
    let numeroLote: string;

    if (loteData.codigo && loteData.numero) {
      // Usar código y número específicos (para lotes pendientes)
      codigoLote = loteData.codigo;
      numeroLote = loteData.numero;
      
      // Verificar que el código no exista ya
      const loteExistente = await prisma.lote.findFirst({
        where: {
          codigo: codigoLote,
          manzanaId: manzanaId
        }
      });

      if (loteExistente) {
        return new NextResponse(`El lote ${codigoLote} ya existe en esta manzana`, { status: 400 });
      }
    } else {
      // Generar número de lote automáticamente (creación normal)
      numeroLote = await generarSiguienteNumeroLote(manzanaId);
      codigoLote = `${manzana.codigo}-${numeroLote}`;
    }

    // Convertir dimensiones a números antes de calcular área
    const dimensionFrente = loteData.dimensionFrente ? parseFloat(loteData.dimensionFrente) : undefined;
    const dimensionFondo = loteData.dimensionFondo ? parseFloat(loteData.dimensionFondo) : undefined;
    const dimensionIzquierda = loteData.dimensionIzquierda ? parseFloat(loteData.dimensionIzquierda) : undefined;
    const dimensionDerecha = loteData.dimensionDerecha ? parseFloat(loteData.dimensionDerecha) : undefined;

    // Calcular área automáticamente
    const area = calcularAreaLote(
      dimensionFrente,
      dimensionFondo,
      dimensionIzquierda,
      dimensionDerecha
    );

    // Crear el lote
    const lote = await prisma.lote.create({
      data: {
        codigo: codigoLote,
        numero: numeroLote,
        area: area,
        precio: loteData.precio ? parseFloat(loteData.precio) : null,
        latitud: loteData.latitud ? parseFloat(loteData.latitud) : null,
        longitud: loteData.longitud ? parseFloat(loteData.longitud) : null,
        linderoFrente: loteData.linderoFrente || null,
        linderoFondo: loteData.linderoFondo || null,
        linderoIzquierda: loteData.linderoIzquierda || null,
        linderoDerecha: loteData.linderoDerecha || null,
        dimensionFrente: loteData.dimensionFrente ? parseFloat(loteData.dimensionFrente) : null,
        dimensionFondo: loteData.dimensionFondo ? parseFloat(loteData.dimensionFondo) : null,
        dimensionIzquierda: loteData.dimensionIzquierda ? parseFloat(loteData.dimensionIzquierda) : null,
        dimensionDerecha: loteData.dimensionDerecha ? parseFloat(loteData.dimensionDerecha) : null,
        descripcion: loteData.descripcion || null,
        observaciones: loteData.observaciones || null,
        caracteristicas: loteData.caracteristicas || null,
        tipoTerreno: loteData.tipoTerreno || null,
        servicios: loteData.servicios || null,
        estado: 'DISPONIBLE',
        manzanaId: manzanaId,
        createdBy: session.user?.id || null
      },
      include: {
        manzana: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        },
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    });

    // Actualizar estadísticas de la manzana
    await ManzanaService.actualizarEstadisticasManzana(manzanaId);

    return NextResponse.json(lote);
  } catch (error) {
    console.error('Error al crear lote:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
} 