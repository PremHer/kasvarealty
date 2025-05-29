'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ClienteList } from '@/components/clientes/ClienteList'
import { ClienteModal } from '@/components/clientes/ClienteModal'
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FiPlus, FiSearch } from 'react-icons/fi'
import { CreateClienteData } from '@/types/cliente'

interface Cliente {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  estado: 'ACTIVO' | 'POTENCIAL' | 'INACTIVO'
  tipo: 'INDIVIDUAL' | 'EMPRESA'
  creadoPorId: string
  createdAt: Date
  updatedAt: Date
}

export default function ClientesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'INDIVIDUAL' | 'EMPRESA' | 'ALL'>('ALL')
  const [estadoFilter, setEstadoFilter] = useState<'ACTIVO' | 'POTENCIAL' | 'INACTIVO' | 'ALL'>('ALL')
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    fetchClientes()
  }, [session, router])

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes')
      if (!response.ok) {
        throw new Error('Error al cargar clientes')
      }
      const data = await response.json()
      setClientes(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClienteCreated = async () => {
    await fetchClientes()
  }

  const handleClienteUpdated = async () => {
    await fetchClientes()
  }

  const handleClienteDeleted = async (id: string) => {
    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Error al eliminar el cliente')
      }
      await fetchClientes()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleCreateCliente = async (data: CreateClienteData) => {
    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Error al crear el cliente')
      }

      await handleClienteCreated()
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  }

  const filteredClientes = clientes.filter((cliente) => {
    const matchesSearch =
      search === '' ||
      cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
      cliente.apellido.toLowerCase().includes(search.toLowerCase()) ||
      cliente.email.toLowerCase().includes(search.toLowerCase())

    const matchesTipo = tipoFilter === 'ALL' || cliente.tipo === tipoFilter
    const matchesEstado = estadoFilter === 'ALL' || cliente.estado === estadoFilter

    return matchesSearch && matchesTipo && matchesEstado
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Clientes", href: "/dashboard/clientes" }
            ]}
            className="mt-2"
          />
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
        >
          <FiPlus className="mr-2 h-5 w-5" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={tipoFilter} onValueChange={(value: any) => setTipoFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              <SelectItem value="INDIVIDUAL">Individual</SelectItem>
              <SelectItem value="EMPRESA">Empresa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={estadoFilter} onValueChange={(value: any) => setEstadoFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="ACTIVO">Activo</SelectItem>
              <SelectItem value="POTENCIAL">Potencial</SelectItem>
              <SelectItem value="INACTIVO">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ClienteList
        clientes={filteredClientes}
        onDelete={handleClienteDeleted}
        onCreate={handleClienteCreated}
        onUpdate={handleClienteUpdated}
      />

      <ClienteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreateCliente}
      />
    </div>
  )
} 