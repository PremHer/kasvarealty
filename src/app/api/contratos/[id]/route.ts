import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

const CONTRATOS_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'GERENTE_GENERAL',
  'SALES_MANAGER',
  'SALES_REP',
  'SALES_ASSISTANT',
  'PROJECT_MANAGER',
  'FINANCE_MANAGER'
]

// GET /api/contratos/[id] - Obtener un contrato específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!CONTRATOS_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para ver contratos' }, { status: 403 })
    }

    const contrato = await prisma.contrato.findUnique({
      where: { id: params.id },
      include: {
        ventaLote: {
          include: {
            cliente: true,
            lote: true,
            vendedor: true
          }
        },
        ventaUnidadCementerio: {
          include: {
            cliente: true,
            unidadCementerio: true,
            vendedor: true
          }
        }
      }
    })

    if (!contrato) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    return NextResponse.json(contrato)
  } catch (error) {
    console.error('Error al obtener contrato:', error)
    return NextResponse.json(
      { error: 'Error al obtener contrato' },
      { status: 500 }
    )
  }
} 