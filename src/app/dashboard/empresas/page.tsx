'use client'

import { useState, useEffect } from 'react'
import { EmpresaList } from '@/components/empresas/empresa-list'
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { TipoBanco, TipoBilleteraVirtual } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { FiPlus } from 'react-icons/fi'
import NewEmpresaModal from '@/components/empresas/new-empresa-modal'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Empresa {
  id: string
  nombre: string
  ruc: string
  representanteLegalId: string
  representanteLegal: {
    id: string
    nombre: string
    email: string
  }
  direccion: string
  telefono: string
  email: string
  bancos: TipoBanco[]
  billeterasVirtuales: TipoBilleteraVirtual[]
  numeroProyectos: number
  createdAt: string
  updatedAt: string
}

interface SessionUser {
  role?: string
}

interface Session {
  user?: SessionUser
}

export default function EmpresasPage() {
  const { data: session } = useSession() as { data: Session | null }
  const router = useRouter()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    // Verificar si el usuario tiene permiso para ver empresas
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL']
    if (!allowedRoles.includes(session.user.role || '')) {
      router.push('/dashboard')
      return
    }

    fetchEmpresas()
  }, [session, router])

  const canCreateEmpresa = ['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role || '')

  const fetchEmpresas = async () => {
    try {
      const response = await fetch('/api/empresas')
      if (!response.ok) throw new Error('Error al cargar empresas')
      const data = await response.json()
      setEmpresas(data)
    } catch (error) {
      console.error('Error:', error)
      setError('Error al cargar empresas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmpresaCreated = () => {
    fetchEmpresas()
    setIsNewModalOpen(false)
  }

  const handleEmpresaUpdated = () => {
    fetchEmpresas()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Empresas", href: "/dashboard/empresas" }
            ]}
            className="mt-2"
          />
        </div>
        {canCreateEmpresa && (
          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
          >
            <FiPlus className="mr-2 h-5 w-5" />
            Nueva Empresa
          </Button>
        )}
      </div>

      <EmpresaList
        empresas={empresas}
        onEmpresaCreated={handleEmpresaCreated}
        onEmpresaUpdated={handleEmpresaUpdated}
      />

      <NewEmpresaModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onEmpresaCreated={handleEmpresaCreated}
      />
    </div>
  )
} 