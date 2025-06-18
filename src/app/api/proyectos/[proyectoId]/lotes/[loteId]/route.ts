import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/proyectos/[proyectoId]/lotes/[loteId]
export async function DELETE(
  request: Request,
  { params }: { params: { proyectoId: string; loteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
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
      return new NextResponse(
        'No tienes permisos para eliminar lotes. Solo los Project Managers, Gerentes Generales y Super Admins pueden realizar esta acción.',
        { status: 403 }
      );
    }

    const { proyectoId, loteId } = params;

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId }
    });

    if (!proyecto) {
      return new NextResponse('Proyecto no encontrado', { status: 404 });
    }

    // Verificar que el lote existe y pertenece al proyecto
    const lote = await prisma.lote.findFirst({
      where: {
        id: loteId,
        manzana: {
          proyectoId: proyectoId
        }
      }
    });

    if (!lote) {
      return new NextResponse('Lote no encontrado', { status: 404 });
    }

    // Eliminar el lote
    await prisma.lote.delete({
      where: { id: loteId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error al eliminar lote:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
} 