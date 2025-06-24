import { Pabellon, UnidadCementerio, Parcela, Nicho, Mausoleo } from '@prisma/client'

export type PabellonWithRelations = Pabellon & {
  unidades: UnidadCementerioWithRelations[]
  creadoPorUsuario?: {
    id: string
    nombre: string
    email: string
  } | null
  actualizadoPorUsuario?: {
    id: string
    nombre: string
    email: string
  } | null
}

export type UnidadCementerioWithRelations = UnidadCementerio & {
  pabellon: {
    id: string
    codigo: string
    nombre: string
  }
  parcela?: Parcela | null
  nicho?: Nicho | null
  mausoleo?: Mausoleo | null
  creadoPorUsuario?: {
    id: string
    nombre: string
    email: string
  } | null
  actualizadoPorUsuario?: {
    id: string
    nombre: string
    email: string
  } | null
}

export type ParcelaWithRelations = Parcela & {
  unidadCementerio: UnidadCementerioWithRelations
}

export type NichoWithRelations = Nicho & {
  unidadCementerio: UnidadCementerioWithRelations
}

export type MausoleoWithRelations = Mausoleo & {
  unidadCementerio: UnidadCementerioWithRelations
}

export interface CreatePabellonData {
  codigo: string
  nombre: string
  descripcion?: string
  observaciones?: string
}

export interface UpdatePabellonData {
  codigo?: string
  nombre?: string
  descripcion?: string
  observaciones?: string
  isActive?: boolean
}

export interface CreateUnidadCementerioData {
  codigo: string
  tipoUnidad: 'PARCELA' | 'NICHO' | 'MAUSOLEO'
  precio: number
  latitud?: number
  longitud?: number
  descripcion?: string
  observaciones?: string
  pabellonId: string
  // Campos específicos según el tipo
  parcela?: {
    dimensionLargo: number
    dimensionAncho: number
    capacidad: number
    tipoTerreno: 'TIERRA' | 'CEMENTO' | 'JARDIN' | 'CESPED'
  }
  nicho?: {
    nivelVertical: number
    capacidadUrnas: number
    material: 'CONCRETO' | 'MARMOL' | 'OTROS'
    medidaAlto: number
    medidaAncho: number
    medidaProfundidad: number
  }
  mausoleo?: {
    dimensionLargo: number
    dimensionAncho: number
    capacidadPersonas: number
    tipoConstruccion: 'FAMILIAR' | 'COLECTIVO' | 'OTRO'
    material: 'LADRILLO' | 'CONCRETO' | 'GRANITO' | 'OTRO'
    niveles: number
  }
}

export interface UpdateUnidadCementerioData {
  codigo?: string
  precio?: number
  estado?: 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'OCUPADO' | 'INACTIVO' | 'RETIRADO'
  latitud?: number
  longitud?: number
  descripcion?: string
  observaciones?: string
  // Campos específicos según el tipo
  parcela?: {
    dimensionLargo?: number
    dimensionAncho?: number
    capacidad?: number
    tipoTerreno?: 'TIERRA' | 'CEMENTO' | 'JARDIN' | 'CESPED'
  }
  nicho?: {
    nivelVertical?: number
    capacidadUrnas?: number
    material?: 'CONCRETO' | 'MARMOL' | 'OTROS'
    medidaAlto?: number
    medidaAncho?: number
    medidaProfundidad?: number
  }
  mausoleo?: {
    dimensionLargo?: number
    dimensionAncho?: number
    capacidadPersonas?: number
    tipoConstruccion?: 'FAMILIAR' | 'COLECTIVO' | 'OTRO'
    material?: 'LADRILLO' | 'CONCRETO' | 'GRANITO' | 'OTRO'
    niveles?: number
  }
}

export interface PabellonEstadisticas {
  totalPabellones: number
  totalUnidades: number
  unidadesDisponibles: number
  unidadesReservadas: number
  unidadesVendidas: number
  unidadesOcupadas: number
  totalPrecio: number
  precioPromedio: number
  distribucionPorTipo: {
    PARCELA: number
    NICHO: number
    MAUSOLEO: number
  }
}

export interface PabellonPendiente {
  codigo: string;
  nombre: string;
  tipo: 'inicial' | 'intermedio';
} 