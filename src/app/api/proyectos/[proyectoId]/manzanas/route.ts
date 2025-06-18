import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { ManzanaService } from '@/lib/services/manzanaService';

export async function GET(
  request: NextRequest,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const incluirInactivas = searchParams.get('incluirInactivas') === 'true';
    const calcular = searchParams.get('calcular') === 'true';
    const cantidad = searchParams.get('cantidad');

    if (calcular && cantidad) {
      // Calcular qué manzanas se van a crear
      const info = await ManzanaService.calcularManzanasACrear(
        params.proyectoId,
        parseInt(cantidad)
      );
      return NextResponse.json(info);
    }

    const manzanas = await ManzanaService.obtenerManzanasPorProyecto(
      params.proyectoId,
      incluirInactivas
    );

    return NextResponse.json(manzanas);
  } catch (error) {
    console.error('Error al obtener manzanas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos para crear manzanas
    const userRole = session.user.role;
    const canCreateManzanas = [
      'SUPER_ADMIN',
      'GERENTE_GENERAL',
      'PROJECT_MANAGER'
    ].includes(userRole);

    if (!canCreateManzanas) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear manzanas. Solo los Project Managers, Gerentes Generales y Super Admins pueden realizar esta acción.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { cantidad, codigo, nombre, descripcion, observaciones } = body;

    if (cantidad) {
      // Crear múltiples manzanas automáticamente
      const manzanas = await ManzanaService.crearManzanasEnBulk(
        params.proyectoId,
        parseInt(cantidad)
      );

      return NextResponse.json(manzanas, { status: 201 });
    } else {
      // Crear una manzana individual
      if (!codigo) {
        return NextResponse.json(
          { error: 'El código de manzana es requerido' },
          { status: 400 }
        );
      }

      const manzana = await ManzanaService.crearManzana({
        proyectoId: params.proyectoId,
        codigo,
        nombre,
        descripcion,
        observaciones,
        createdBy: session.user.id,
      });

      return NextResponse.json(manzana, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error al crear manzana:', error);
    
    if (error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Ya existe una manzana con ese código' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 