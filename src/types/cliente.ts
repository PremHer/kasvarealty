import { TipoCliente, EstadoCliente } from '@prisma/client'

export interface Cliente {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  direccion?: string
  tipo: TipoCliente
  estado: EstadoCliente
  // Campos para cliente individual
  dni?: string
  fechaNacimiento?: Date
  estadoCivil?: 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO'
  ocupacion?: string
  // Campos para empresa
  razonSocial?: string
  ruc?: string
  representanteLegal?: string
  cargoRepresentante?: string
  // Relaciones
  empresaId?: string
  empresa?: {
    id: string
    nombre: string
  }
  createdAt: Date
  updatedAt: Date
  creadoPorId: string
  actualizadoPorId?: string
}

export type CreateClienteData = {
  nombre: string
  apellido: string
  email: string
  telefono?: string
  direccion?: string
  tipo: 'INDIVIDUAL' | 'EMPRESA'
  estado?: 'ACTIVO' | 'INACTIVO' | 'POTENCIAL'
  // Campos para cliente individual
  dni?: string
  fechaNacimiento?: string
  estadoCivil?: 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO'
  ocupacion?: string
  // Campos para empresa
  razonSocial?: string
  ruc?: string
  representanteLegal?: string
  cargoRepresentante?: string
}

export interface UpdateClienteData extends Partial<CreateClienteData> {
  id: string
}

export interface ClienteFilters {
  search?: string
  tipo?: TipoCliente
  estado?: EstadoCliente
  empresaId?: string
}

export type ClienteFormData = Omit<Cliente, 'id' | 'createdAt' | 'updatedAt' | 'estado'>

export type ClienteTipo = 'INDIVIDUAL' | 'EMPRESA'

export const CLIENTE_TIPOS = {
  INDIVIDUAL: 'Persona Natural',
  EMPRESA: 'Empresa'
} as const 