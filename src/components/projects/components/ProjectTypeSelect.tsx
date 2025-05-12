import { TipoProyecto } from '@/types/project'
import { PROJECT_TYPES } from '@/constants/project-types'

interface ProjectTypeSelectProps {
  value: TipoProyecto
  onChange: (value: TipoProyecto) => void
  required?: boolean
  className?: string
}

export default function ProjectTypeSelect({
  value,
  onChange,
  required = false,
  className = ''
}: ProjectTypeSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TipoProyecto)}
      required={required}
      className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900 ${className}`}
    >
      <option value="">Seleccione un tipo</option>
      {PROJECT_TYPES.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
} 