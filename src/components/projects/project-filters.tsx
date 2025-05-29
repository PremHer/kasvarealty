'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'
import { EstadoProyecto, TipoProyecto } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { PROJECT_TYPES } from '@/constants/project-types'

interface ProjectFiltersProps {
  onFilterChange: (filters: {
    search: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    status: EstadoProyecto | 'all'
    type: TipoProyecto | 'all'
  }) => void
  filters: {
    search: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    status: EstadoProyecto | 'all'
    type: TipoProyecto | 'all'
  }
  hasActiveFilters: boolean
}

const defaultFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc' as 'asc' | 'desc',
  status: 'all' as EstadoProyecto | 'all',
  type: 'all' as TipoProyecto | 'all'
}

export function ProjectFilters({ onFilterChange, filters = defaultFilters, hasActiveFilters }: ProjectFiltersProps) {
  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value }
    onFilterChange(newFilters)
  }

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-')
    const newFilters = { ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }
    onFilterChange(newFilters)
  }

  const handleStatusChange = (value: EstadoProyecto | 'all') => {
    const newFilters = { ...filters, status: value }
    onFilterChange(newFilters)
  }

  const handleTypeChange = (value: TipoProyecto | 'all') => {
    const newFilters = { ...filters, type: value }
    onFilterChange(newFilters)
  }

  const handleClearFilters = () => {
    onFilterChange(defaultFilters)
  }

  // Asegurarnos de que filters tenga todos los valores necesarios
  const safeFilters = {
    ...defaultFilters,
    ...filters
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nombre o descripción..."
          className="pl-10"
          value={safeFilters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <FiFilter className="text-gray-400" />
        <Select
          value={`${safeFilters.sortBy}-${safeFilters.sortOrder}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
            <SelectItem value="createdAt-desc">Más recientes</SelectItem>
            <SelectItem value="createdAt-asc">Más antiguos</SelectItem>
            <SelectItem value="budget-desc">Presupuesto (mayor)</SelectItem>
            <SelectItem value="budget-asc">Presupuesto (menor)</SelectItem>
            <SelectItem value="progress-desc">Progreso (mayor)</SelectItem>
            <SelectItem value="progress-asc">Progreso (menor)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={safeFilters.status}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Estado..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="APPROVED">Aprobado</SelectItem>
            <SelectItem value="REJECTED">Rechazado</SelectItem>
            <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
            <SelectItem value="COMPLETED">Completado</SelectItem>
            <SelectItem value="ON_HOLD">En Pausa</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={safeFilters.type}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo de proyecto..." />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            <SelectItem value="all">Todos los tipos</SelectItem>
            {PROJECT_TYPES.map((group) => (
              <div key={group.label}>
                <SelectItem value={group.label} disabled className="font-semibold text-gray-500">
                  {group.label}
                </SelectItem>
                {group.options.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="pl-4">
                    {type.label}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="flex items-center gap-2"
        >
          <FiX className="h-4 w-4" />
          Limpiar filtros
        </Button>
      )}
    </div>
  )
} 