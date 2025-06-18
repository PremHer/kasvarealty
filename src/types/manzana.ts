import { Manzana, Prisma } from '@prisma/client';

export type ManzanaWithRelations = Manzana & {
  lotes: {
    id: string;
    codigo: string;
    numero: string;
    area: number;
    estado: string;
  }[];
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

export interface ManzanaCreateInput {
  codigo: string;
  nombre: string;
  proyectoId: string;
  createdBy: string;
  descripcion?: string;
  observaciones?: string;
}

export interface ManzanaUpdateInput {
  nombre?: string;
  descripcion?: string;
  observaciones?: string;
  isActive?: boolean;
  updatedBy: string;
} 