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

export interface Project {
  id: string
  name: string
  description: string
  location: string
  startDate: string
  endDate: string | null
  budget: number
  type: TipoProyecto
  totalArea: number
  usableArea: number
  totalUnits: number
  developerCompanyId: string
  developerCompany?: {
    businessName: string
  }
}

export interface ProjectFormData {
  name: string
  description: string
  location: string
  startDate: string
  endDate: string
  budget: string
  type: TipoProyecto
  totalArea: string
  usableArea: string
  totalUnits: string
  developerCompanyId: string
}

export interface DeveloperCompany {
  id: string
  businessName: string
  ruc: string
} 