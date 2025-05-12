import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

interface EmpresaDesarrolladora {
  id: string
  nombre: string
  ruc: string
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const empresas = await prisma.empresaDesarrolladora.findMany({
      select: {
        id: true,
        nombre: true,
        ruc: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    // Transformar los nombres de los campos al formato en inglés para mantener la compatibilidad
    const companies = empresas.map((empresa: EmpresaDesarrolladora) => ({
      id: empresa.id,
      businessName: empresa.nombre,
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