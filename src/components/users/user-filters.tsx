'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'
import { Rol } from '@prisma/client'
import { Button } from '@/components/ui/button'

interface UserFiltersProps {
  onFilterChange: (filters: {
    search: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    role?: Rol
    status?: 'active' | 'inactive' | 'all'
  }) => void
}

export function UserFilters({ onFilterChange }: UserFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    role: undefined as Rol | undefined,
    status: 'all' as 'active' | 'inactive' | 'all'
  })

  const hasActiveFilters = filters.search !== '' || 
    filters.role !== undefined || 
    filters.status !== 'all' || 
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

  const handleRoleChange = (value: Rol | 'all') => {
    const newFilters = { 
      ...filters, 
      role: value === 'all' ? undefined : value 
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleStatusChange = (value: 'active' | 'inactive' | 'all') => {
    const newFilters = { ...filters, status: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearFilters = () => {
    const defaultFilters = {
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc' as 'asc' | 'desc',
      role: undefined as Rol | undefined,
      status: 'all' as 'active' | 'inactive' | 'all'
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
          placeholder="Buscar por nombre o email..."
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
            <SelectItem value="email-asc">Email (A-Z)</SelectItem>
            <SelectItem value="email-desc">Email (Z-A)</SelectItem>
            <SelectItem value="createdAt-desc">Más recientes</SelectItem>
            <SelectItem value="createdAt-asc">Más antiguos</SelectItem>
            <SelectItem value="lastLogin-desc">Último acceso (reciente)</SelectItem>
            <SelectItem value="lastLogin-asc">Último acceso (antiguo)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={filters.role || 'all'}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por rol..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Administrador</SelectItem>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="GERENTE_GENERAL">Gerente General</SelectItem>
            <SelectItem value="SALES_MANAGER">Gerente de Ventas</SelectItem>
            <SelectItem value="PROJECT_MANAGER">Gerente de Proyectos</SelectItem>
            <SelectItem value="FINANCE_MANAGER">Gerente Financiero</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={filters.status}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Estado..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
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