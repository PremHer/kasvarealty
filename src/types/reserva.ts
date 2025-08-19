import { EstadoReserva } from '@prisma/client'

export interface Reserva {
  id: string
  numeroReserva: string
  proyectoId: string
  loteId?: string
  unidadCementerioId?: string
  clienteId: string
  vendedorId: string
  montoReserva: number
  fechaReserva: Date
  fechaVencimiento: Date
  estado: EstadoReserva
  observaciones?: string
  ventaId?: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
  
  // Relaciones
  proyecto?: Proyecto
  lote?: Lote
  unidadCementerio?: UnidadCementerio
  cliente?: Cliente
  vendedor?: Usuario
  venta?: VentaLote
  creadoPorUsuario?: Usuario
  actualizadoPorUsuario?: Usuario
}

export interface ReservaWithRelations extends Reserva {
  proyecto: Proyecto
  lote?: Lote
  unidadCementerio?: UnidadCementerio
  cliente: Cliente
  vendedor: Usuario
  venta?: VentaLote
  creadoPorUsuario?: Usuario
  actualizadoPorUsuario?: Usuario
}

export interface ReservaFormData {
  proyectoId: string
  loteId?: string
  unidadCementerioId?: string
  clienteId: string
  vendedorId: string
  montoReserva: number
  fechaVencimiento: string
  observaciones?: string
}

export interface ReservaFilters {
  search?: string
  estado?: EstadoReserva | 'TODOS'
  proyectoId?: string
  vendedorId?: string
  fechaDesde?: Date
  fechaHasta?: Date
}

// Tipos auxiliares (importados de otros archivos)
interface Proyecto {
  id: string
  nombre: string
  tipo: string
  estado: string
}

interface Lote {
  id: string
  codigo: string
  numero: string
  area: number
  precio?: number
  estado: string
}

interface UnidadCementerio {
  id: string
  codigo: string
  tipoUnidad: string
  precio: number
  estado: string
}

interface Cliente {
  id: string
  nombre: string
  apellido?: string
  dni?: string
  ruc?: string
  tipoCliente: string
  razonSocial?: string
}

interface Usuario {
  id: string
  nombre: string
  email?: string
  rol: string
}

interface VentaLote {
  id: string
  precioVenta: number
  estado: string
  fechaVenta: Date
} 