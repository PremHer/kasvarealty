import { TipoProyecto } from '@/types/project'

interface ProjectTypeSelectProps {
  value: TipoProyecto
  onChange: (value: TipoProyecto) => void
  required?: boolean
}

const projectTypes = {
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

export default function ProjectTypeSelect({ value, onChange, required }: ProjectTypeSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TipoProyecto)}
      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
      required={required}
    >
      <option value="">Seleccione un tipo</option>
      {Object.entries(projectTypes).map(([group, types]) => (
        <optgroup key={group} label={group}>
          {types.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
} 