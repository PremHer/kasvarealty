import { FormaPago } from '@prisma/client'

export interface ReciboPago {
  id: string
  numeroRecibo: string
  empresaDesarrolladoraId: string
  ventaId?: string
  cuotaId?: string
  clienteId: string
  vendedorId: string
  montoPagado: number
  formaPago: FormaPago
  metodoPago?: string
  concepto: string
  fechaPago: Date
  observaciones?: string
  comprobantePagoId?: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export interface ReciboPagoWithRelations extends ReciboPago {
  empresaDesarrolladora: {
    id: string
    nombre: string
    ruc: string
    direccion: string
    representanteLegal?: {
      id: string
      nombre: string
      dni?: string
    }
  }
  venta?: {
    id: string
    numeroVenta: string
    precioVenta: number
    lote?: {
      id: string
      numero: string
      codigo: string
    }
    proyecto?: {
      id: string
      nombre: string
    }
  }
  cuota?: {
    id: string
    numeroCuota: number
    montoCuota: number
    fechaVencimiento: Date
  }
  cliente: {
    id: string
    nombre: string
    apellido?: string
    dni?: string
    ruc?: string
    razonSocial?: string
  }
  vendedor: {
    id: string
    nombre: string
    email?: string
  }
  comprobantePago?: {
    id: string
    nombreArchivo: string
    url: string
  }
  creadoPorUsuario?: {
    id: string
    nombre: string
  }
  actualizadoPorUsuario?: {
    id: string
    nombre: string
  }
}

export interface ReciboPagoFormData {
  ventaId?: string
  cuotaId?: string
  clienteId: string
  vendedorId: string
  montoPagado: number
  formaPago: FormaPago
  metodoPago?: string
  concepto: string
  fechaPago: string
  observaciones?: string
  comprobantePagoId?: string
}

export interface ReciboPagoFilters {
  search?: string
  empresaDesarrolladoraId?: string
  ventaId?: string
  clienteId?: string
  vendedorId?: string
  formaPago?: FormaPago
  fechaDesde?: Date
  fechaHasta?: Date
} 