export enum TIPO_CLIENTE {
  INDIVIDUAL = 'INDIVIDUAL',
  EMPRESA = 'EMPRESA'
}

export enum EstadoCivil {
  SOLTERO = 'SOLTERO',
  CASADO = 'CASADO',
  DIVORCIADO = 'DIVORCIADO',
  VIUDO = 'VIUDO'
}

export enum Sexo {
  MASCULINO = 'MASCULINO',
  FEMENINO = 'FEMENINO'
}

export enum TipoDireccion {
  NACIONAL = 'NACIONAL',
  EXTRANJERA = 'EXTRANJERA'
}

export interface Direccion {
  id?: string
  tipo: TipoDireccion
  pais: string
  distrito: string
  provincia: string
  departamento: string
  direccion: string
  referencia?: string
}

export interface Cliente {
  id: string
  tipoCliente: TIPO_CLIENTE
  nombre?: string
  apellido?: string
  sexo?: Sexo
  razonSocial?: string
  ruc?: string
  dni?: string
  email: string
  telefono?: string
  fechaNacimiento?: Date
  estadoCivil?: EstadoCivil
  ocupacion?: string
  representanteLegal?: string
  cargoRepresentante?: string
  direcciones: Direccion[]
  isActive: boolean
  empresaId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ClienteFormData {
  tipoCliente: TIPO_CLIENTE
  nombre?: string
  apellido?: string
  sexo?: Sexo
  razonSocial?: string
  ruc?: string
  dni?: string
  email: string
  telefono?: string
  fechaNacimiento?: Date
  estadoCivil?: EstadoCivil
  ocupacion?: string
  representanteLegal?: string
  cargoRepresentante?: string
  direcciones: Direccion[]
}

export type CreateClienteData = Omit<ClienteFormData, 'id'>
export type UpdateClienteData = Partial<ClienteFormData>

export type EstadoCliente = 'ACTIVO' | 'INACTIVO' | 'POTENCIAL'

export const ESTADO_CLIENTE = {
  ACTIVO: 'ACTIVO' as EstadoCliente,
  INACTIVO: 'INACTIVO' as EstadoCliente,
  POTENCIAL: 'POTENCIAL' as EstadoCliente
} as const

export interface ClienteFilters {
  search?: string
  tipoCliente?: TIPO_CLIENTE
  estado?: EstadoCliente
  empresaId?: string
}

export const CLIENTE_TIPOS = {
  INDIVIDUAL: 'Persona Natural',
  EMPRESA: 'Empresa'
} as const 