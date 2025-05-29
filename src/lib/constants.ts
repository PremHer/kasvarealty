import { TipoProyecto } from '@prisma/client'

interface ProjectType {
  value: TipoProyecto
  label: string
}

// Eliminando la definición duplicada de PROJECT_TYPES
// Se usa la definición de @/constants/project-types en su lugar 