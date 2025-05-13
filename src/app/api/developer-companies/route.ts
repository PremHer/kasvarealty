import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const empresas = await prisma.empresaDesarrolladora.findMany({
      orderBy: {
        nombre: 'asc'
      }
    })

    const companies = empresas.map(empresa => ({
      id: empresa.id,
      name: empresa.nombre,
      ruc: empresa.ruc
    }))

    return NextResponse.json(companies)
  } catch (error) {
    console.error('Error al obtener empresas desarrolladoras:', error)
    return NextResponse.json(
      { error: 'Error al obtener empresas desarrolladoras' },
      { status: 500 }
    )
  }
} 