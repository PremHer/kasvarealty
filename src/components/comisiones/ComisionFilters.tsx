'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiFilter, FiX, FiUser } from 'react-icons/fi'

interface ComisionFiltersProps {
  filters: {
    vendedorId: string
    estado: string
    fechaInicio: string
    fechaFin: string
  }
  onFiltersChange: (filters: any) => void
}

interface Vendedor {
  id: string
  nombre: string
  email: string
}

export default function ComisionFilters({ filters, onFiltersChange }: ComisionFiltersProps) {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar vendedores
  const fetchVendedores = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vendedores')
      if (response.ok) {
        const data = await response.json()
        setVendedores(data.vendedores || [])
      }
    } catch (error) {
      console.error('Error al cargar vendedores:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendedores()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      vendedorId: '',
      estado: '',
      fechaInicio: '',
      fechaFin: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FiFilter className="h-5 w-5 text-gray-600" />
            Filtros
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <FiX className="h-4 w-4 mr-2" />
              Limpiar Filtros
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por Vendedor */}
          <div className="space-y-2">
            <Label htmlFor="vendedorId">Vendedor</Label>
            <Select
              value={filters.vendedorId}
              onValueChange={(value) => handleFilterChange('vendedorId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los vendedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los vendedores</SelectItem>
                {vendedores.map((vendedor) => (
                  <SelectItem key={vendedor.id} value={vendedor.id}>
                    <div className="flex items-center gap-2">
                      <FiUser className="h-4 w-4" />
                      {vendedor.nombre}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Estado */}
          <div className="space-y-2">
            <Label htmlFor="estado">Estado de Comisión</Label>
            <Select
              value={filters.estado}
              onValueChange={(value) => handleFilterChange('estado', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="PARCIAL">Parcial</SelectItem>
                <SelectItem value="PAGADA">Pagada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Fecha Inicio */}
          <div className="space-y-2">
            <Label htmlFor="fechaInicio">Fecha Desde</Label>
            <Input
              type="date"
              value={filters.fechaInicio}
              onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
            />
          </div>

          {/* Filtro por Fecha Fin */}
          <div className="space-y-2">
            <Label htmlFor="fechaFin">Fecha Hasta</Label>
            <Input
              type="date"
              value={filters.fechaFin}
              onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 