export enum TipoPagoComision {
  PARCIAL = 'PARCIAL',
  COMPLETO = 'COMPLETO'
}

export interface PagoComision {
  id: string
  monto: number
  fechaPago: string
  formaPago: string
  tipoPago: TipoPagoComision
  observaciones?: string
  ventaLoteId?: string
  ventaUnidadCementerioId?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  
  // Relaciones
  ventaLote?: {
    id: string
    precioVenta: number
    comisionVendedor: number
    vendedor: {
      id: string
      nombre: string
      email: string
    }
    cliente: {
      id: string
      nombre: string
      apellido?: string
    }
    lote: {
      id: string
      codigo: string
    }
  }
  ventaUnidadCementerio?: {
    id: string
    precioVenta: number
    comisionVendedor: number
    vendedor: {
      id: string
      nombre: string
      email: string
    }
    cliente: {
      id: string
      nombre: string
      apellido?: string
    }
    unidadCementerio: {
      id: string
      codigo: string
    }
  }
  comprobantes: ComprobantePago[]
  creadoPorUsuario?: {
    id: string
    nombre: string
    email: string
  }
  actualizadoPorUsuario?: {
    id: string
    nombre: string
    email: string
  }
}

export interface ComprobantePago {
  id: string
  tipo: string
  monto: number
  fecha: string
  descripcion?: string
  nombreArchivo: string
  driveFileId?: string
  driveFileUrl?: string
  driveDownloadUrl?: string
  mimeType: string
  tamanio: number
  localFilePath?: string
  guardadoLocal?: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface PagoComisionFormData {
  monto: string
  fechaPago: string
  formaPago: string
  observaciones?: string
  comprobantes: Array<{
    archivo: File
    datos: {
      tipo: string
      monto: number
      fecha: string
      descripcion?: string
    }
  }>
}

export interface ComisionStats {
  totalComisiones: number
  comisionesPagadas: number
  comisionesPendientes: number
  montoTotalPagado: number
  montoTotalPendiente: number
  pagosParciales: number
  pagosCompletos: number
}

export interface ComisionFilters {
  vendedorId?: string
  fechaInicio?: string
  fechaFin?: string
  tipoPago?: TipoPagoComision
  formaPago?: string
  estado?: 'PENDIENTE' | 'PAGADA'
}

export interface VentaConComision {
  id: string
  tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO'
  precioVenta: number
  comisionVendedor: number
  porcentajeComision?: number
  fechaVenta: string
  estado: string
  vendedor: {
    id: string
    nombre: string
    email: string
  }
  cliente: {
    id: string
    nombre: string
    apellido?: string
  }
  unidad: {
    id: string
    codigo: string
  }
  pagosComisiones: PagoComision[]
  montoPagado: number
  montoPendiente: number
  porcentajePagado: number
} 