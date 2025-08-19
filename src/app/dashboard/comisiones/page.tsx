'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { FiDollarSign, FiTrendingUp, FiClock, FiCheckCircle, FiAlertCircle, FiPlus, FiFilter, FiDownload } from 'react-icons/fi'
import { VentaConComision, ComisionStats } from '@/types/comision'
import ComisionList from '@/components/comisiones/ComisionList'
import PagoComisionModal from '@/components/comisiones/PagoComisionModal'
import ComisionFilters from '@/components/comisiones/ComisionFilters'

export default function ComisionesPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [ventas, setVentas] = useState<VentaConComision[]>([])
  const [stats, setStats] = useState<ComisionStats>({
    totalComisiones: 0,
    comisionesPagadas: 0,
    comisionesPendientes: 0,
    montoTotalPagado: 0,
    montoTotalPendiente: 0,
    pagosParciales: 0,
    pagosCompletos: 0
  })
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState<VentaConComision | null>(null)
  const [filters, setFilters] = useState({
    vendedorId: '',
    estado: '',
    fechaInicio: '',
    fechaFin: ''
  })

  // Verificar permisos
  const canManageComisiones = ['SUPER_ADMIN', 'FINANCE_MANAGER', 'SALES_MANAGER', 'ACCOUNTANT'].includes(session?.user?.role || '')

  const fetchComisiones = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.vendedorId) params.append('vendedorId', filters.vendedorId)
      if (filters.estado) params.append('estado', filters.estado)
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio)
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin)

      const response = await fetch(`/api/comisiones?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Error al cargar comisiones')
      }
      
      const data = await response.json()
      setVentas(data.ventas)
      setStats(data.stats)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las comisiones',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManageComisiones) {
      fetchComisiones()
    }
  }, [canManageComisiones, filters])

  const handlePagoComision = (venta: VentaConComision) => {
    setSelectedVenta(venta)
    setIsModalOpen(true)
  }

  const handlePagoSuccess = () => {
    fetchComisiones()
    setIsModalOpen(false)
    setSelectedVenta(null)
    toast({
      title: 'Pago registrado',
      description: 'El pago de comisión se registró correctamente',
      variant: 'default'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  if (!canManageComisiones) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-gray-500">No tienes permisos para gestionar comisiones</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Comisiones</h1>
          <p className="text-gray-600 mt-2">
            Administra los pagos de comisiones a vendedores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchComisiones()}>
            <FiDownload className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-800">Total Comisiones</CardTitle>
            <div className="flex items-center justify-center w-10 h-10 bg-blue-200 rounded-full">
              <FiDollarSign className="h-5 w-5 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.totalComisiones}</div>
            <p className="text-xs text-blue-700 mt-1">
              Comisiones totales
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-yellow-800">Pendientes</CardTitle>
            <div className="flex items-center justify-center w-10 h-10 bg-yellow-200 rounded-full">
              <FiClock className="h-5 w-5 text-yellow-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">{stats.comisionesPendientes}</div>
            <p className="text-xs text-yellow-700 mt-1">
              Por pagar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-green-800">Pagadas</CardTitle>
            <div className="flex items-center justify-center w-10 h-10 bg-green-200 rounded-full">
              <FiCheckCircle className="h-5 w-5 text-green-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats.comisionesPagadas}</div>
            <p className="text-xs text-green-700 mt-1">
              Completamente pagadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-orange-800">Monto Pendiente</CardTitle>
            <div className="flex items-center justify-center w-10 h-10 bg-orange-200 rounded-full">
              <FiAlertCircle className="h-5 w-5 text-orange-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{formatCurrency(stats.montoTotalPendiente)}</div>
            <p className="text-xs text-orange-700 mt-1">
              Por pagar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <ComisionFilters 
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Lista de comisiones */}
      <ComisionList
        ventas={ventas}
        loading={loading}
        onPagoComision={handlePagoComision}
        onRefresh={fetchComisiones}
      />

      {/* Modal de pago */}
      {selectedVenta && (
        <PagoComisionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedVenta(null)
          }}
          onSuccess={handlePagoSuccess}
          venta={selectedVenta}
        />
      )}
    </div>
  )
} 