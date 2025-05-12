'use client'

import { useState, useEffect } from 'react'
import { EmpresaList } from '@/components/empresas/empresa-list'

interface Empresa {
  id: string
  nombre: string
  ruc: string
  representanteLegal: {
    id: string
    nombre: string
    email: string
  }
  direccion: string
  telefono: string
  email: string
  bancos: string[]
  billeterasVirtuales: string[]
  numeroProyectos: number
  createdAt: string
  updatedAt: string
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    fetchEmpresas()
  }, [])

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
    <div className="w-full">
      <EmpresaList
        empresas={empresas}
        onEmpresaCreated={fetchEmpresas}
        onEmpresaUpdated={fetchEmpresas}
      />
    </div>
  )
} 