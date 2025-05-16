'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiSearch, FiFilter } from 'react-icons/fi'
import { EstadoProyecto, TipoProyecto } from '@prisma/client'

interface ProjectFiltersProps {
  onFilterChange: (filters: {
    search: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    status: EstadoProyecto | 'all'
    type: TipoProyecto | 'all'
  }) => void
}

const PROJECT_TYPES = {
  'Residencial': [
    { value: 'CASA_INDIVIDUAL', label: 'Casa Individual' },
    { value: 'CONDOMINIO_CASAS', label: 'Condominio de Casas' },
    { value: 'DEPARTAMENTO', label: 'Departamento' },
    { value: 'CONDOMINIO_DEPARTAMENTOS', label: 'Condominio de Departamentos' },
    { value: 'DUPLEX', label: 'Dúplex' },
    { value: 'PENTHOUSE', label: 'Penthouse' },
    { value: 'TOWNHOUSE', label: 'Townhouse' }
  ],
  'Comercial': [
    { value: 'CENTRO_COMERCIAL', label: 'Centro Comercial' },
    { value: 'MODULO_COMERCIAL', label: 'Módulo Comercial' },
    { value: 'GALERIA_COMERCIAL', label: 'Galería Comercial' },
    { value: 'PLAZA_COMERCIAL', label: 'Plaza Comercial' },
    { value: 'OFICINAS', label: 'Oficinas' },
    { value: 'BODEGA', label: 'Bodega' },
    { value: 'SHOWROOM', label: 'Showroom' }
  ],
  'Mixto': [
    { value: 'MIXTO_RESIDENCIAL_COMERCIAL', label: 'Mixto Residencial Comercial' },
    { value: 'MIXTO_OFICINAS_COMERCIAL', label: 'Mixto Oficinas Comercial' }
  ],
  'Otros': [
    { value: 'LOTIZACION', label: 'Lotización' },
    { value: 'CEMENTERIO', label: 'Cementerio' },
    { value: 'HOTEL', label: 'Hotel' },
    { value: 'HOSPITAL', label: 'Hospital' },
    { value: 'CLINICA', label: 'Clínica' },
    { value: 'COLEGIO', label: 'Colegio' },
    { value: 'UNIVERSIDAD', label: 'Universidad' },
    { value: 'ESTADIO', label: 'Estadio' },
    { value: 'COMPLEJO_DEPORTIVO', label: 'Complejo Deportivo' },
    { value: 'PARQUE_INDUSTRIAL', label: 'Parque Industrial' }
  ]
}

export function ProjectFilters({ onFilterChange }: ProjectFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
    status: 'all' as EstadoProyecto | 'all',
    type: 'all' as TipoProyecto | 'all'
  })

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

  const handleStatusChange = (value: EstadoProyecto | 'all') => {
    const newFilters = { ...filters, status: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleTypeChange = (value: TipoProyecto | 'all') => {
    const newFilters = { ...filters, type: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nombre o descripción..."
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
            <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
            <SelectItem value="createdAt-desc">Más recientes</SelectItem>
            <SelectItem value="createdAt-asc">Más antiguos</SelectItem>
            <SelectItem value="budget-desc">Presupuesto (mayor)</SelectItem>
            <SelectItem value="budget-asc">Presupuesto (menor)</SelectItem>
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
          value={filters.type}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo de proyecto..." />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(PROJECT_TYPES).map(([category, types]) => (
              <SelectItem key={category} value={category} disabled className="font-semibold text-gray-500">
                {category}
              </SelectItem>
            ))}
            {Object.entries(PROJECT_TYPES).map(([category, types]) => (
              types.map((type) => (
                <SelectItem key={type.value} value={type.value} className="pl-4">
                  {type.label}
                </SelectItem>
              ))
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
} 