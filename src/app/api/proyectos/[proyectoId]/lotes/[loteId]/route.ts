import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

// GET /api/proyectos/[proyectoId]/lotes/[loteId]
export async function GET(
  request: Request,
  { params }: { params: { proyectoId: string; loteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const { proyectoId, loteId } = params;

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId }
    });

    if (!proyecto) {
      return new NextResponse('Proyecto no encontrado', { status: 404 });
    }

    // Obtener el lote con relaciones
    const lote = await prisma.lote.findFirst({
      where: {
        id: loteId,
        manzana: {
          proyectoId: proyectoId
        }
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
        },
        actualizadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    });

    if (!lote) {
      return new NextResponse('Lote no encontrado', { status: 404 });
    }

    return NextResponse.json(lote);
  } catch (error) {
    console.error('Error al obtener lote:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}

// PUT /api/proyectos/[proyectoId]/lotes/[loteId]
export async function PUT(
  request: Request,
  { params }: { params: { proyectoId: string; loteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // Verificar permisos para editar lotes
    const userRole = session.user?.role;
    const canEditLotes = [
      'SUPER_ADMIN',
      'GERENTE_GENERAL',
      'PROJECT_MANAGER'
    ].includes(userRole);

    if (!canEditLotes) {
      return new NextResponse(
        'No tienes permisos para editar lotes. Solo los Project Managers, Gerentes Generales y Super Admins pueden realizar esta acción.',
        { status: 403 }
      );
    }

    const { proyectoId, loteId } = params;
    const loteData = await request.json();

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId }
    });

    if (!proyecto) {
      return new NextResponse('Proyecto no encontrado', { status: 404 });
    }

    // Verificar que el lote existe y pertenece al proyecto
    const loteExistente = await prisma.lote.findFirst({
      where: {
        id: loteId,
        manzana: {
          proyectoId: proyectoId
        }
      },
      include: {
        manzana: true
      }
    });

    if (!loteExistente) {
      return new NextResponse('Lote no encontrado', { status: 404 });
    }

    // Verificar que la manzana esté activa para poder editar lotes
    if (!loteExistente.manzana.isActive) {
      return new NextResponse(
        'No se pueden editar lotes en una manzana inactiva. Primero debe activar la manzana.',
        { status: 400 }
      );
    }

    // Calcular área automáticamente si se actualizan las dimensiones
    const area = calcularAreaLote(
      loteData.dimensionFrente ? parseFloat(loteData.dimensionFrente) : undefined,
      loteData.dimensionFondo ? parseFloat(loteData.dimensionFondo) : undefined,
      loteData.dimensionIzquierda ? parseFloat(loteData.dimensionIzquierda) : undefined,
      loteData.dimensionDerecha ? parseFloat(loteData.dimensionDerecha) : undefined
    );

    // Actualizar el lote
    const lote = await prisma.lote.update({
      where: { id: loteId },
      data: {
        codigo: loteData.codigo,
        numero: loteData.numero,
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
        estado: loteData.estado || 'DISPONIBLE',
        updatedBy: session.user?.id || null
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
        },
        actualizadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    });

    // Actualizar estadísticas de la manzana
    await ManzanaService.actualizarEstadisticasManzana(lote.manzanaId);

    return NextResponse.json(lote);
  } catch (error) {
    console.error('Error al actualizar lote:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}

// PATCH /api/proyectos/[proyectoId]/lotes/[loteId]
export async function PATCH(
  request: Request,
  { params }: { params: { proyectoId: string; loteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // Verificar permisos para editar lotes
    const userRole = session.user?.role;
    const canEditLotes = [
      'SUPER_ADMIN',
      'GERENTE_GENERAL',
      'PROJECT_MANAGER'
    ].includes(userRole);

    if (!canEditLotes) {
      return new NextResponse(
        'No tienes permisos para editar lotes. Solo los Project Managers, Gerentes Generales y Super Admins pueden realizar esta acción.',
        { status: 403 }
      );
    }

    const { proyectoId, loteId } = params;
    const loteData = await request.json();

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId }
    });

    if (!proyecto) {
      return new NextResponse('Proyecto no encontrado', { status: 404 });
    }

    // Verificar que el lote existe y pertenece al proyecto
    const loteExistente = await prisma.lote.findFirst({
      where: {
        id: loteId,
        manzana: {
          proyectoId: proyectoId
        }
      },
      include: {
        manzana: true
      }
    });

    if (!loteExistente) {
      return new NextResponse('Lote no encontrado', { status: 404 });
    }

    // Verificar que la manzana esté activa para poder editar lotes
    if (!loteExistente.manzana.isActive) {
      return new NextResponse(
        'No se pueden editar lotes en una manzana inactiva. Primero debe activar la manzana.',
        { status: 400 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      updatedBy: session.user?.id || null
    };

    // Solo actualizar campos que se proporcionen
    if (loteData.codigo !== undefined) updateData.codigo = loteData.codigo;
    if (loteData.numero !== undefined) updateData.numero = loteData.numero;
    if (loteData.precio !== undefined) updateData.precio = loteData.precio ? parseFloat(loteData.precio) : null;
    if (loteData.latitud !== undefined) updateData.latitud = loteData.latitud ? parseFloat(loteData.latitud) : null;
    if (loteData.longitud !== undefined) updateData.longitud = loteData.longitud ? parseFloat(loteData.longitud) : null;
    if (loteData.linderoFrente !== undefined) updateData.linderoFrente = loteData.linderoFrente;
    if (loteData.linderoFondo !== undefined) updateData.linderoFondo = loteData.linderoFondo;
    if (loteData.linderoIzquierda !== undefined) updateData.linderoIzquierda = loteData.linderoIzquierda;
    if (loteData.linderoDerecha !== undefined) updateData.linderoDerecha = loteData.linderoDerecha;
    if (loteData.dimensionFrente !== undefined) updateData.dimensionFrente = loteData.dimensionFrente ? parseFloat(loteData.dimensionFrente) : null;
    if (loteData.dimensionFondo !== undefined) updateData.dimensionFondo = loteData.dimensionFondo ? parseFloat(loteData.dimensionFondo) : null;
    if (loteData.dimensionIzquierda !== undefined) updateData.dimensionIzquierda = loteData.dimensionIzquierda ? parseFloat(loteData.dimensionIzquierda) : null;
    if (loteData.dimensionDerecha !== undefined) updateData.dimensionDerecha = loteData.dimensionDerecha ? parseFloat(loteData.dimensionDerecha) : null;
    if (loteData.descripcion !== undefined) updateData.descripcion = loteData.descripcion;
    if (loteData.observaciones !== undefined) updateData.observaciones = loteData.observaciones;
    if (loteData.caracteristicas !== undefined) updateData.caracteristicas = loteData.caracteristicas;
    if (loteData.tipoTerreno !== undefined) updateData.tipoTerreno = loteData.tipoTerreno;
    if (loteData.servicios !== undefined) updateData.servicios = loteData.servicios;
    if (loteData.estado !== undefined) updateData.estado = loteData.estado;

    // Recalcular área si se actualizaron las dimensiones
    if (loteData.dimensionFrente !== undefined || loteData.dimensionFondo !== undefined || 
        loteData.dimensionIzquierda !== undefined || loteData.dimensionDerecha !== undefined) {
      const area = calcularAreaLote(
        updateData.dimensionFrente || loteExistente.dimensionFrente,
        updateData.dimensionFondo || loteExistente.dimensionFondo,
        updateData.dimensionIzquierda || loteExistente.dimensionIzquierda,
        updateData.dimensionDerecha || loteExistente.dimensionDerecha
      );
      updateData.area = area;
    }

    // Actualizar el lote
    const lote = await prisma.lote.update({
      where: { id: loteId },
      data: updateData,
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
      }
    });

    // Actualizar estadísticas de la manzana
    await ManzanaService.actualizarEstadisticasManzana(lote.manzanaId);

    return NextResponse.json(lote);
  } catch (error) {
    console.error('Error al actualizar lote:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}

// DELETE /api/proyectos/[proyectoId]/lotes/[loteId]
export async function DELETE(
  request: Request,
  { params }: { params: { proyectoId: string; loteId: string } }
) {
  try {
    console.log('🔍 API DELETE Lote - Iniciando eliminación:', { proyectoId: params.proyectoId, loteId: params.loteId });
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ API DELETE Lote - No autorizado');
      return new NextResponse('No autorizado', { status: 401 });
    }

    // Verificar permisos para eliminar lotes
    const userRole = session.user?.role;
    const canDeleteLotes = [
      'SUPER_ADMIN',
      'GERENTE_GENERAL',
      'PROJECT_MANAGER'
    ].includes(userRole);

    if (!canDeleteLotes) {
      console.log('❌ API DELETE Lote - Sin permisos:', userRole);
      return new NextResponse(
        'No tienes permisos para eliminar lotes. Solo los Project Managers, Gerentes Generales y Super Admins pueden realizar esta acción.',
        { status: 403 }
      );
    }

    const { proyectoId, loteId } = params;
    console.log('✅ API DELETE Lote - Permisos verificados, procediendo con eliminación');

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId }
    });

    if (!proyecto) {
      console.log('❌ API DELETE Lote - Proyecto no encontrado:', proyectoId);
      return new NextResponse('Proyecto no encontrado', { status: 404 });
    }

    console.log('✅ API DELETE Lote - Proyecto encontrado:', proyecto.nombre);

    // Verificar que el lote existe y pertenece al proyecto
    const lote = await prisma.lote.findFirst({
      where: {
        id: loteId,
        manzana: {
          proyectoId: proyectoId
        }
      },
      include: {
        ventasLotes: true,
        manzana: true
      }
    });

    if (!lote) {
      console.log('❌ API DELETE Lote - Lote no encontrado:', loteId);
      return new NextResponse('Lote no encontrado', { status: 404 });
    }

    console.log('✅ API DELETE Lote - Lote encontrado:', { codigo: lote.codigo, ventas: lote.ventasLotes.length });

    // Verificar que la manzana esté activa para poder eliminar lotes
    if (!lote.manzana.isActive) {
      console.log('❌ API DELETE Lote - Manzana inactiva:', lote.manzana.codigo);
      return new NextResponse(
        'No se pueden eliminar lotes en una manzana inactiva. Primero debe activar la manzana.',
        { status: 400 }
      );
    }

    console.log('✅ API DELETE Lote - Manzana activa:', lote.manzana.codigo);

    // Verificar si el lote tiene ventas asociadas
    if (lote.ventasLotes.length > 0) {
      console.log('❌ API DELETE Lote - Lote tiene ventas asociadas:', lote.ventasLotes.length);
      return new NextResponse(
        'No se puede eliminar el lote porque tiene ventas asociadas. Primero debe eliminar las ventas.',
        { status: 400 }
      );
    }

    console.log('✅ API DELETE Lote - Lote sin ventas, procediendo a eliminar');

    // Eliminar el lote
    await prisma.lote.delete({
      where: { id: loteId }
    });

    console.log('✅ API DELETE Lote - Lote eliminado exitosamente');

    // Actualizar estadísticas de la manzana
    await ManzanaService.actualizarEstadisticasManzana(lote.manzanaId);
    console.log('✅ API DELETE Lote - Estadísticas de manzana actualizadas');

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ API DELETE Lote - Error al eliminar lote:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
} 