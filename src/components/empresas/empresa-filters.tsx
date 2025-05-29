'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'
import { Button } from '@/components/ui/button'

interface EmpresaFiltersProps {
  onFilterChange: (filters: {
    search: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }) => void
}

export function EmpresaFilters({ onFilterChange }: EmpresaFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  const hasActiveFilters = filters.search !== '' || 
    filters.sortBy !== 'createdAt' || 
    filters.sortOrder !== 'desc'

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-')
    const newFilters = { ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearFilters = () => {
    const defaultFilters = {
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc' as 'asc' | 'desc'
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nombre, RUC o email..."
          className="pl-10"
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <FiFilter className="text-gray-400" />
        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nombre-asc">Nombre (A-Z)</SelectItem>
            <SelectItem value="nombre-desc">Nombre (Z-A)</SelectItem>
            <SelectItem value="ruc-asc">RUC (A-Z)</SelectItem>
            <SelectItem value="ruc-desc">RUC (Z-A)</SelectItem>
            <SelectItem value="numeroProyectos-desc">Más proyectos</SelectItem>
            <SelectItem value="numeroProyectos-asc">Menos proyectos</SelectItem>
            <SelectItem value="createdAt-desc">Más recientes</SelectItem>
            <SelectItem value="createdAt-asc">Más antiguos</SelectItem>
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