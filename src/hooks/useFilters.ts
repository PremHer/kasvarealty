import { useState, useMemo } from 'react'

interface SortableField {
  type: 'string' | 'number' | 'date'
  label: string
}

interface FilterField {
  type: 'enum'
  values: string[]
  label: string
}

interface UseFiltersOptions<T> {
  searchFields: (keyof T)[]
  sortableFields: Record<string, SortableField>
  filterFields: Record<string, FilterField>
  itemsPerPage?: number
}

type Filters<T> = {
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
} & {
  [K in keyof T]?: T[K] | 'all'
}

export function useFilters<T>(
  items: T[],
  options: UseFiltersOptions<T>
) {
  const initialFilters: Filters<T> = {
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...Object.fromEntries(
      Object.keys(options.filterFields).map(key => [key, 'all'])
    )
  } as Filters<T>

  const [filters, setFilters] = useState<Filters<T>>(initialFilters)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = options.itemsPerPage || 10

  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' || 
      filters.sortBy !== 'createdAt' || 
      filters.sortOrder !== 'desc' ||
      Object.entries(filters).some(([key, value]) => 
        key !== 'search' && key !== 'sortBy' && key !== 'sortOrder' && value !== 'all'
      )
  }, [filters])

  const filteredItems = useMemo(() => {
    let result = [...items]

    // Aplicar búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(item => 
        options.searchFields.some(field => {
          const value = item[field]
          return value && typeof value === 'string' && value.toLowerCase().includes(searchLower)
        })
      )
    }

    // Aplicar filtros de enumeración
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'search' && key !== 'sortBy' && key !== 'sortOrder' && value !== 'all') {
        result = result.filter(item => item[key as keyof T] === value)
      }
    })

    // Aplicar ordenamiento
    result.sort((a, b) => {
      const field = options.sortableFields[filters.sortBy]
      if (!field) return 0

      const aValue = a[filters.sortBy as keyof T]
      const bValue = b[filters.sortBy as keyof T]

      if (field.type === 'date') {
        const aDate = aValue instanceof Date ? aValue.getTime() : 
                     aValue ? new Date(aValue as string).getTime() : 0
        const bDate = bValue instanceof Date ? bValue.getTime() : 
                     bValue ? new Date(bValue as string).getTime() : 0
        return filters.sortOrder === 'asc' ? aDate - bDate : bDate - aDate
      }

      if (field.type === 'number') {
        const aNum = Number(aValue) || 0
        const bNum = Number(bValue) || 0
        return filters.sortOrder === 'asc' ? aNum - bNum : bNum - aNum
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return 0
    })

    return result
  }, [items, filters, options])

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleFilterChange = (newFilters: Filters<T>) => {
    setFilters(newFilters)
    setCurrentPage(1) // Resetear a la primera página al cambiar filtros
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return {
    filters,
    currentPage,
    totalPages,
    paginatedItems,
    handleFilterChange,
    handlePageChange,
    hasActiveFilters
  }
} 