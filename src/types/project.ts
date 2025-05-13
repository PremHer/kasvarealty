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

export type EstadoProyecto = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

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
  startDate: string
  endDate: string | null
  precioTerreno: number | null
  inversionInicial: number | null
  inversionTotal: number | null
  inversionActual: number | null
  status: string
  developerCompanyId: string
  developerCompany: {
    id: string
    name: string
  } | null
  managerId: string
  createdById: string
  type: string
  totalArea: number | null
  usableArea: number | null
  totalUnits: number | null
  createdBy: {
    id: string
    name: string
    email: string
  }
  approvedBy: {
    id: string
    name: string
    email: string
  } | null
  manager: {
    id: string
    name: string
    email: string
  }
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

export interface DeveloperCompany {
  id: string
  name: string
  ruc: string
} 