'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
import { FiPlus, FiSearch, FiDownload, FiEye } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Contrato {
  id: string
  numeroContrato: string
  fechaContrato: string
  contratoPDF?: string
  ventaLoteId?: string
  ventaUnidadCementerioId?: string
  ventaLote?: {
    id: string
    cliente: {
      nombre: string
      apellido: string
      razonSocial?: string
    }
    lote: {
      numero: string
      manzana: string
    }
    precio: number
  }
  ventaUnidadCementerio?: {
    id: string
    cliente: {
      nombre: string
      apellido: string
      razonSocial?: string
    }
    unidadCementerio: {
      numero: string
      tipo: string
    }
    precio: number
  }
}

export default function ContratosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<'TODOS' | 'GENERADO' | 'NO_GENERADO'>('TODOS')

  const { data: contratos = [], isLoading } = useQuery({
    queryKey: ["contratos"],
    queryFn: async () => {
      const response = await fetch("/api/contratos")
      if (!response.ok) {
        throw new Error("Error al cargar los contratos")
      }
      const data = await response.json()
      return data.sort((a: Contrato, b: Contrato) => {
        return new Date(b.fechaContrato).getTime() - new Date(a.fechaContrato).getTime()
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

  const handleDownloadPDF = async (contratoId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/contratos/${contratoId}/download-pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('PDF descargado correctamente')
      } else {
        toast.error('Error al descargar el PDF')
      }
    } catch (error) {
      console.error('Error al descargar PDF:', error)
      toast.error('Error al descargar el PDF')
    }
  }

  const handleViewPDF = async (contratoId: string) => {
    try {
      const response = await fetch(`/api/contratos/${contratoId}/download-pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
      } else {
        toast.error('Error al abrir el PDF')
      }
    } catch (error) {
      console.error('Error al abrir PDF:', error)
      toast.error('Error al abrir el PDF')
    }
  }

  const getClienteInfo = (contrato: Contrato) => {
    if (contrato.ventaLote) {
      return contrato.ventaLote.cliente.razonSocial || 
             `${contrato.ventaLote.cliente.nombre} ${contrato.ventaLote.cliente.apellido}`
    }
    if (contrato.ventaUnidadCementerio) {
      return contrato.ventaUnidadCementerio.cliente.razonSocial || 
             `${contrato.ventaUnidadCementerio.cliente.nombre} ${contrato.ventaUnidadCementerio.cliente.apellido}`
    }
    return 'Cliente no disponible'
  }

  const getProductoInfo = (contrato: Contrato) => {
    if (contrato.ventaLote) {
      return `Lote ${contrato.ventaLote.lote.numero} - Manzana ${contrato.ventaLote.lote.manzana}`
    }
    if (contrato.ventaUnidadCementerio) {
      return `Unidad ${contrato.ventaUnidadCementerio.unidadCementerio.numero} - ${contrato.ventaUnidadCementerio.unidadCementerio.tipo}`
    }
    return 'Producto no disponible'
  }

  const getPrecio = (contrato: Contrato) => {
    if (contrato.ventaLote) {
      return contrato.ventaLote.precio
    }
    if (contrato.ventaUnidadCementerio) {
      return contrato.ventaUnidadCementerio.precio
    }
    return 0
  }

  const filteredContratos = contratos.filter((contrato: Contrato) => {
    const searchLower = search.toLowerCase()
    const clienteInfo = getClienteInfo(contrato).toLowerCase()
    const productoInfo = getProductoInfo(contrato).toLowerCase()
    const numeroContrato = contrato.numeroContrato.toLowerCase()
    
    const matchesSearch = 
      search === '' ||
      clienteInfo.includes(searchLower) ||
      productoInfo.includes(searchLower) ||
      numeroContrato.includes(searchLower)
    
    const matchesEstado = estadoFilter === 'TODOS' || 
      (estadoFilter === 'GENERADO' && contrato.contratoPDF) ||
      (estadoFilter === 'NO_GENERADO' && !contrato.contratoPDF)

    return matchesSearch && matchesEstado
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
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Contratos', href: '/dashboard/contratos' }
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Gestión de Contratos</h1>
          <p className="text-gray-600 mt-1">
            Administra y descarga los contratos generados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, producto o número de contrato..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Select value={estadoFilter} onValueChange={(value: any) => setEstadoFilter(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los estados</SelectItem>
                <SelectItem value="GENERADO">Generados</SelectItem>
                <SelectItem value="NO_GENERADO">No generados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabla de Contratos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número de Contrato</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Fecha de Generación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContratos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No se encontraron contratos
                  </TableCell>
                </TableRow>
              ) : (
                filteredContratos.map((contrato: Contrato) => (
                  <TableRow key={contrato.id}>
                    <TableCell className="font-medium">
                      {contrato.numeroContrato}
                    </TableCell>
                    <TableCell>
                      {getClienteInfo(contrato)}
                    </TableCell>
                    <TableCell>
                      {getProductoInfo(contrato)}
                    </TableCell>
                    <TableCell>
                      S/ {getPrecio(contrato).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {contrato.fechaContrato ? 
                        (() => {
                          try {
                            const date = new Date(contrato.fechaContrato)
                            if (isNaN(date.getTime())) {
                              return 'Fecha inválida'
                            }
                            return format(date, 'dd/MM/yyyy HH:mm', { locale: es })
                          } catch (error) {
                            return 'Fecha inválida'
                          }
                        })() 
                        : 'No disponible'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={contrato.contratoPDF ? 'success' : 'secondary'}>
                        {contrato.contratoPDF ? 'Generado' : 'No generado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {contrato.contratoPDF ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPDF(contrato.id)}
                            >
                              <FiEye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadPDF(contrato.id, `contrato_${contrato.numeroContrato}.pdf`)}
                            >
                              <FiDownload className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">No disponible</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiPlus className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Contratos</p>
              <p className="text-2xl font-bold text-gray-900">{contratos.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiDownload className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contratos Generados</p>
              <p className="text-2xl font-bold text-gray-900">
                {contratos.filter((c: Contrato) => c.contratoPDF).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiEye className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes de Generar</p>
              <p className="text-2xl font-bold text-gray-900">
                {contratos.filter((c: Contrato) => !c.contratoPDF).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 