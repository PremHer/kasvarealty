import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Obtener los lotes del proyecto
    const lotes = await prisma.lote.findMany({
      where: {
        manzana: {
          proyectoId: proyectoId
        }
      },
      orderBy: {
        numero: 'asc'
      }
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
    const { cantidad } = await request.json();

    if (!cantidad || cantidad <= 0) {
      return new NextResponse('Cantidad inválida', { status: 400 });
    }

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: proyectoId }
    });

    if (!proyecto) {
      return new NextResponse('Proyecto no encontrado', { status: 404 });
    }

    // Obtener la última manzana para asignar los lotes
    const ultimaManzana = await prisma.manzana.findFirst({
      where: { proyectoId },
      orderBy: { codigo: 'desc' }
    });

    if (!ultimaManzana) {
      return new NextResponse('No hay manzanas disponibles', { status: 400 });
    }

    // Crear los lotes
    const lotes = [];
    for (let i = 1; i <= cantidad; i++) {
      const numeroLote = i.toString().padStart(2, '0');
      const lote = await prisma.lote.create({
        data: {
          codigo: `${ultimaManzana.codigo}-${numeroLote}`,
          numero: numeroLote,
          area: 0, // Área por defecto
          estado: 'DISPONIBLE',
          manzanaId: ultimaManzana.id
        }
      });
      lotes.push(lote);
    }

    return NextResponse.json(lotes);
  } catch (error) {
    console.error('Error al crear lotes:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
} 