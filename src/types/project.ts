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

export type EstadoProyecto = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'PENDING_ASSIGNMENT'
  | 'APPROVED' 
  | 'REJECTED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED'

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
  departamento?: string
  provincia?: string
  distrito?: string
  latitud?: number
  longitud?: number
  startDate: string
  endDate?: string
  precioTerreno?: number
  inversionInicial?: number
  inversionTotal?: number
  inversionActual?: number
  status: EstadoProyecto
  developerCompanyId: string
  developerCompany?: {
    id: string
    name: string
  }
  managerId: string
  createdById: string
  type: TipoProyecto
  totalArea?: number
  usableArea?: number
  totalUnits?: number
  createdAt: string
  updatedAt: string
  budget?: number
  progress?: number
  createdBy: {
    id: string
    name: string
    email: string
  }
  approvedBy?: {
    id: string
    name: string
    email: string
  }
  rejectedBy?: {
    id: string
    name: string
    email: string
  }
  manager: {
    id: string
    name: string
    email: string
  }
  razonRechazo?: string
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