import { TipoProyecto } from '@/types/project'

interface ProjectTypeOption {
  value: TipoProyecto
  label: string
}

interface ProjectTypeGroup {
  label: string
  options: ProjectTypeOption[]
}

export const PROJECT_TYPES: ProjectTypeGroup[] = [
  {
    label: 'Proyectos Residenciales',
    options: [
      { value: 'CASA_INDIVIDUAL', label: 'Casa Individual' },
      { value: 'CONDOMINIO_CASAS', label: 'Condominio de Casas' },
      { value: 'DEPARTAMENTO', label: 'Departamento' },
      { value: 'CONDOMINIO_DEPARTAMENTOS', label: 'Condominio de Departamentos' },
      { value: 'DUPLEX', label: 'Dúplex' },
      { value: 'PENTHOUSE', label: 'Penthouse' },
      { value: 'TOWNHOUSE', label: 'Townhouse' }
    ]
  },
  {
    label: 'Proyectos Comerciales',
    options: [
      { value: 'CENTRO_COMERCIAL', label: 'Centro Comercial' },
      { value: 'MODULO_COMERCIAL', label: 'Módulo Comercial' },
      { value: 'GALERIA_COMERCIAL', label: 'Galería Comercial' },
      { value: 'PLAZA_COMERCIAL', label: 'Plaza Comercial' },
      { value: 'OFICINAS', label: 'Oficinas' },
      { value: 'BODEGA', label: 'Bodega' },
      { value: 'SHOWROOM', label: 'Showroom' }
    ]
  },
  {
    label: 'Proyectos Mixtos',
    options: [
      { value: 'MIXTO_RESIDENCIAL_COMERCIAL', label: 'Mixto Residencial-Comercial' },
      { value: 'MIXTO_OFICINAS_COMERCIAL', label: 'Mixto Oficinas-Comercial' }
    ]
  },
  {
    label: 'Proyectos Especializados',
    options: [
      { value: 'LOTIZACION', label: 'Loteo' },
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
] 