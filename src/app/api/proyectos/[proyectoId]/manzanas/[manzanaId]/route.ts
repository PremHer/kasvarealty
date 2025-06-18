import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { ManzanaService } from '@/lib/services/manzanaService';

export async function GET(
  request: NextRequest,
  { params }: { params: { proyectoId: string; manzanaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const manzana = await ManzanaService.obtenerManzanaPorId(params.manzanaId);

    if (!manzana) {
      return NextResponse.json(
        { error: 'Manzana no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la manzana pertenece al proyecto
    if (manzana.proyectoId !== params.proyectoId) {
      return NextResponse.json(
        { error: 'Manzana no pertenece al proyecto' },
        { status: 403 }
      );
    }

    return NextResponse.json(manzana);
  } catch (error) {
    console.error('Error al obtener manzana:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { proyectoId: string; manzanaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, descripcion, observaciones, isActive } = body;

    const manzana = await ManzanaService.actualizarManzana({
      id: params.manzanaId,
      nombre,
      descripcion,
      observaciones,
      isActive,
      updatedBy: session.user.id,
    });

    return NextResponse.json(manzana);
  } catch (error: any) {
    console.error('Error al actualizar manzana:', error);
    
    if (error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Manzana no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { proyectoId: string; manzanaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'El campo isActive es requerido y debe ser un booleano' },
        { status: 400 }
      );
    }

    const manzana = await ManzanaService.actualizarManzana({
      id: params.manzanaId,
      isActive,
      updatedBy: session.user.id,
    });

    return NextResponse.json(manzana);
  } catch (error: any) {
    console.error('Error al cambiar estado de manzana:', error);
    
    if (error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Manzana no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { proyectoId: string; manzanaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos para eliminar manzanas
    const userRole = session.user.role;
    const canDeleteManzanas = [
      'SUPER_ADMIN',
      'GERENTE_GENERAL',
      'PROJECT_MANAGER'
    ].includes(userRole);

    if (!canDeleteManzanas) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar manzanas. Solo los Project Managers, Gerentes Generales y Super Admins pueden realizar esta acción.' },
        { status: 403 }
      );
    }

    await ManzanaService.eliminarManzana(params.manzanaId);

    return NextResponse.json(
      { message: 'Manzana eliminada correctamente' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al eliminar manzana:', error);
    
    if (error.message.includes('No se puede eliminar una manzana que tiene lotes')) {
      return NextResponse.json(
        { error: 'No se puede eliminar una manzana que tiene lotes' },
        { status: 400 }
      );
    }

    if (error.message.includes('Manzana no encontrada')) {
      return NextResponse.json(
        { error: 'Manzana no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 