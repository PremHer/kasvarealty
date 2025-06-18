import { Lote, EstadoLote } from '@prisma/client';

export type LoteWithRelations = Lote & {
  manzana: {
    id: string;
    codigo: string;
    nombre: string;
  };
  creadoPorUsuario: {
    id: string;
    nombre: string;
    email: string;
  } | null;
  actualizadoPorUsuario: {
    id: string;
    nombre: string;
    email: string;
  } | null;
};

export interface LoteFormData {
  codigo: string;
  numero: string;
  precio: string;
  latitud: string;
  longitud: string;
  linderoFrente: string;
  linderoFondo: string;
  linderoIzquierda: string;
  linderoDerecha: string;
  dimensionFrente: string;
  dimensionFondo: string;
  dimensionIzquierda: string;
  dimensionDerecha: string;
  descripcion: string;
} 