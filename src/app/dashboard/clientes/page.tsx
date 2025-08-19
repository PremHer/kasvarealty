'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ClienteList } from '@/components/clientes/ClienteList'
import ClienteModal from '@/components/clientes/ClienteModal'
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
import { Cliente, CreateClienteData, TIPO_CLIENTE, EstadoCliente } from '@/types/cliente'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function ClientesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<TIPO_CLIENTE | 'ALL'>('ALL')
  const [estadoFilter, setEstadoFilter] = useState<EstadoCliente | 'ALL'>('ALL')
  const [modalOpen, setModalOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const response = await fetch("/api/clientes")
      if (!response.ok) {
        throw new Error("Error al cargar los clientes")
      }
      const data = await response.json()
      return data.sort((a: Cliente, b: Cliente) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const handleCreateCliente = async (data: CreateClienteData) => {
    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Error al crear el cliente")
      }

      const newCliente = await response.json()
      
      // Actualizar la caché optimistamente
      queryClient.setQueryData(["clientes"], (oldData: Cliente[] = []) => {
        return [newCliente, ...oldData]
      })

      // Refrescar los datos en segundo plano
      queryClient.refetchQueries({ queryKey: ["clientes"] })
      
      toast.success("Cliente creado exitosamente")
      setModalOpen(false)
    } catch (error) {
      console.error("Error al crear cliente:", error)
      toast.error("Error al crear el cliente")
    }
  }

  const handleUpdateCliente = async (updatedCliente: Cliente) => {
    if (!updatedCliente?.id) {
      toast.error("Error: ID de cliente no válido")
      return
    }

    try {
      const response = await fetch(`/api/clientes/${updatedCliente.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCliente),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar el cliente")
      }

      const updatedData = await response.json()

      // Actualizar la caché optimistamente
      queryClient.setQueryData(["clientes"], (oldData: Cliente[] = []) => {
        return oldData.map(cliente => 
          cliente.id === updatedCliente.id ? updatedData : cliente
        )
      })

      // Refrescar los datos en segundo plano
      await queryClient.refetchQueries({ queryKey: ["clientes"] })

      toast.success("Cliente actualizado exitosamente")
    } catch (error) {
      console.error("Error al actualizar cliente:", error)
      toast.error("Error al actualizar el cliente")
    }
  }

  const handleDeleteCliente = async (id: string) => {
    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el cliente")
      }

      // Actualizar la caché optimistamente
      queryClient.setQueryData(["clientes"], (oldData: Cliente[] = []) => {
        return oldData.filter(cliente => cliente.id !== id)
      })

      // Refrescar los datos en segundo plano
      queryClient.refetchQueries({ queryKey: ["clientes"] })

      toast.success("Cliente eliminado exitosamente")
    } catch (error) {
      console.error("Error al eliminar cliente:", error)
      toast.error("Error al eliminar el cliente")
    }
  }

  const filteredClientes = clientes.filter((cliente: Cliente) => {
    const searchLower = search.toLowerCase()
        const matchesSearch =
      search === '' ||
      cliente.nombre?.toLowerCase().includes(searchLower) ||
      cliente.apellido?.toLowerCase().includes(searchLower) ||
      cliente.email.toLowerCase().includes(searchLower) ||
      cliente.razonSocial?.toLowerCase().includes(searchLower) ||
      cliente.dni?.toLowerCase().includes(searchLower) ||
      cliente.ruc?.toLowerCase().includes(searchLower)
    
    const matchesTipo = tipoFilter === 'ALL' || cliente.tipoCliente === tipoFilter
    const matchesEstado = estadoFilter === 'ALL' || cliente.isActive === (estadoFilter === 'ACTIVO')

    return matchesSearch && matchesTipo && matchesEstado
  })

  if (isLoading) {
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
                        <Select value={tipoFilter} onValueChange={(value: TIPO_CLIENTE | 'ALL') => setTipoFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              <SelectItem value={TIPO_CLIENTE.INDIVIDUAL}>Persona Natural</SelectItem>
              <SelectItem value={TIPO_CLIENTE.EMPRESA}>Empresa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={estadoFilter} onValueChange={(value: EstadoCliente | 'ALL') => setEstadoFilter(value)}>
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
        onDelete={handleDeleteCliente}
        onUpdate={handleUpdateCliente}
      />

      <ClienteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreateCliente}
      />
    </div>
  )
} 