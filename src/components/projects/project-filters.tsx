import { FiX } from 'react-icons/fi'
import { EstadoProyecto } from '@/types/project'

interface ProjectFiltersProps {
  filters: {
    status: 'ALL' | EstadoProyecto
    search: string
  }
  onFilterChange: (filters: { status: 'ALL' | EstadoProyecto; search: string }) => void
  onClose: () => void
}

const statusOptions: { value: 'ALL' | EstadoProyecto; label: string }[] = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'PENDING_APPROVAL', label: 'Pendiente de Aprobación' },
  { value: 'PENDING_ASSIGNMENT', label: 'Pendiente de Asignación' },
  { value: 'APPROVED', label: 'Aprobado' },
  { value: 'REJECTED', label: 'Rechazado' },
  { value: 'IN_PROGRESS', label: 'En Progreso' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'CANCELLED', label: 'Cancelado' }
]

export default function ProjectFilters({
  filters,
  onFilterChange,
  onClose
}: ProjectFiltersProps) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    onFilterChange({
      ...filters,
      [name]: value
    })
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Filtros</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Estado
          </label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700"
          >
            Buscar por nombre
          </label>
          <input
            type="text"
            name="search"
            id="search"
            value={filters.search}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Buscar proyectos..."
          />
        </div>
      </div>
    </div>
  )
} 