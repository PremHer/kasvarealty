export type TipoProyecto =
  | 'CASA_INDIVIDUAL'
  | 'CONDOMINIO_CASAS'
  | 'DEPARTAMENTO'
  | 'CONDOMINIO_DEPARTAMENTOS'
  | 'DUPLEX'
  | 'PENTHOUSE'
  | 'TOWNHOUSE'
  | 'CENTRO_COMERCIAL'
  | 'MODULO_COMERCIAL'
  | 'GALERIA_COMERCIAL'
  | 'PLAZA_COMERCIAL'
  | 'OFICINAS'
  | 'BODEGA'
  | 'SHOWROOM'
  | 'MIXTO_RESIDENCIAL_COMERCIAL'
  | 'MIXTO_OFICINAS_COMERCIAL'
  | 'LOTIZACION'
  | 'CEMENTERIO'
  | 'HOTEL'
  | 'HOSPITAL'
  | 'CLINICA'
  | 'COLEGIO'
  | 'UNIVERSIDAD'
  | 'ESTADIO'
  | 'COMPLEJO_DEPORTIVO'
  | 'PARQUE_INDUSTRIAL'

export type EstadoProyecto = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'EN_PROGRESO' | 'COMPLETADO' | 'CANCELADO'

export interface DeveloperCompany {
  id: string
  name: string
  ruc: string
  representanteLegalId: string
}

export interface User {
  id: string
  name: string
  email: string
}

export interface Project {
  id: string
  name: string
  description: string
  location: string
  departamento: string | null
  provincia: string | null
  distrito: string | null
  latitud: number | null
  longitud: number | null
  startDate: Date
  endDate: Date | null
  precioTerreno: number | null
  inversionInicial: number | null
  inversionTotal: number | null
  inversionActual: number | null
  status: EstadoProyecto
  developerCompanyId: string
  developerCompany: DeveloperCompany | null
  managerId: string
  createdById: string
  type: string
  totalArea: number | null
  usableArea: number | null
  totalUnits: number | null
  createdBy: User
  approvedBy: User | null
  manager: User
}

export interface ProjectFormData {
  name: string
  description: string
  location: string
  startDate: string
  type: string
  developerCompanyId: string
  departamento?: string
  provincia?: string
  distrito?: string
  latitud?: string
  longitud?: string
  precioTerreno?: string
  inversionInicial?: string
  totalArea?: string
} 