'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { FiDownload, FiEye, FiSearch, FiFilter, FiPlus, FiRefreshCw } from 'react-icons/fi'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { FormaPago } from '@prisma/client'

export default function RecibosPage() {
  const { toast } = useToast()
  const [filters, setFilters] = useState({
    search: '',
    empresaId: '',
    formaPago: '',
    fechaDesde: '',
    fechaHasta: '',
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)

  // Fetch recibos
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recibos', page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      })

      const response = await fetch(`/api/recibos?${params}`)
      if (!response.ok) throw new Error('Error al cargar recibos')
      return response.json()
    },
  })

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
    setPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleDownloadPDF = async (reciboId: string) => {
    try {
      const response = await fetch(`/api/recibos/${reciboId}/download-pdf`)
      if (!response.ok) throw new Error('Error al descargar PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recibo-${reciboId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'PDF descargado',
        description: 'El recibo se ha descargado correctamente.',
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo descargar el PDF.',
        variant: 'destructive',
      })
    }
  }

  const handleViewPDF = async (reciboId: string) => {
    try {
      const response = await fetch(`/api/recibos/${reciboId}/generate-pdf`)
      if (!response.ok) throw new Error('Error al generar PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      window.URL.revokeObjectURL(url)

      toast({
        title: 'PDF generado',
        description: 'El recibo se ha abierto en una nueva pestaña.',
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo generar el PDF.',
        variant: 'destructive',
      })
    }
  }

  const recibos = data?.recibos || []
  const pagination = data?.pagination || { page: 1, limit: 50, total: 0, pages: 0 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recibos de Pago</h1>
          <p className="text-muted-foreground">
            Gestiona y genera recibos de pago para ventas y cuotas
          </p>
        </div>
        <Button onClick={() => refetch()}>
          <FiRefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiFilter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar recibos..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.formaPago} onValueChange={(value) => handleFilterChange('formaPago', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Forma de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las formas</SelectItem>
                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                <SelectItem value="DEPOSITO">Depósito</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
                <SelectItem value="TARJETA_CREDITO">Tarjeta de Crédito</SelectItem>
                <SelectItem value="TARJETA_DEBITO">Tarjeta de Débito</SelectItem>
                <SelectItem value="YAPE">Yape</SelectItem>
                <SelectItem value="PLIN">Plin</SelectItem>
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Fecha desde"
              value={filters.fechaDesde}
              onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
            />

            <Input
              type="date"
              placeholder="Fecha hasta"
              value={filters.fechaHasta}
              onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Recibos</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Este Mes</p>
                <p className="text-2xl font-bold">
                  {recibos.filter((r: any) => {
                    const fecha = new Date(r.fechaPago)
                    const ahora = new Date()
                    return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cobrado</p>
                <p className="text-2xl font-bold">
                  S/ {recibos.reduce((sum: number, r: any) => sum + Number(r.montoPagado), 0).toLocaleString('es-PE')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Este Mes</p>
                <p className="text-2xl font-bold">
                  S/ {recibos
                    .filter((r: any) => {
                      const fecha = new Date(r.fechaPago)
                      const ahora = new Date()
                      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
                    })
                    .reduce((sum: number, r: any) => sum + Number(r.montoPagado), 0)
                    .toLocaleString('es-PE')
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de recibos */}
      <Card>
        <CardHeader>
          <CardTitle>Recibos de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns({
              onDownload: handleDownloadPDF,
              onView: handleViewPDF,
            })}
            data={recibos}
          />
        </CardContent>
      </Card>
    </div>
  )
} 