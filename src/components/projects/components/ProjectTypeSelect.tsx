import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TipoProyecto } from '@prisma/client'
import { PROJECT_TYPES } from '@/constants/project-types'

interface ProjectTypeSelectProps {
  value: string
  onChange: (value: TipoProyecto) => void
  required?: boolean
}

export default function ProjectTypeSelect({ value, onChange, required }: ProjectTypeSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(value) => onChange(value as TipoProyecto)}
      required={required}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecciona un tipo" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto">
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
  )
} 