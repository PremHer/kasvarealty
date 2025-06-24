import { prisma } from '../prisma'
import { PabellonWithRelations, PabellonEstadisticas } from '@/types/cementerio'

export interface PabellonPendiente {
  codigo: string;
  nombre: string;
  tipo: 'inicial' | 'intermedio';
}

export class PabellonService {
  /**
   * Obtiene todos los pabellones de un proyecto
   */
  static async obtenerPabellonesPorProyecto(proyectoId: string, incluirInactivos = false): Promise<PabellonWithRelations[]> {
    const where = {
      proyectoId,
      ...(incluirInactivos ? {} : { isActive: true })
    };

    const pabellones = await prisma.pabellon.findMany({
      where,
      include: {
        unidades: {
          include: {
            parcela: true,
            nicho: true,
            mausoleo: true,
            creadoPorUsuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
              }
            },
            actualizadoPorUsuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
              }
            }
          }
        },
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        },
        actualizadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        }
      },
      orderBy: [
        {
          codigo: 'asc'
        }
      ]
    }) as PabellonWithRelations[];

    // Calcular área total y cantidad de unidades dinámicamente
    const pabellonesConEstadisticas = await Promise.all(pabellones.map(async (pabellon) => {
      const cantidadUnidades = pabellon.unidades.length;
      const totalUnidades = await this.obtenerConteoTotalUnidades(pabellon.id);

      return {
        ...pabellon,
        cantidadUnidades,
        totalUnidades
      };
    }));

    // Asegurar que los pabellones estén ordenados correctamente
    return pabellonesConEstadisticas.sort((a, b) => {
      if (a.codigo.length !== b.codigo.length) {
        return a.codigo.length - b.codigo.length;
      }
      return a.codigo.localeCompare(b.codigo);
    });
  }

  /**
   * Obtiene un pabellón por ID
   */
  static async obtenerPabellonPorId(pabellonId: string): Promise<PabellonWithRelations | null> {
    return await prisma.pabellon.findUnique({
      where: { id: pabellonId },
      include: {
        unidades: {
          include: {
            parcela: true,
            nicho: true,
            mausoleo: true,
            creadoPorUsuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
              }
            },
            actualizadoPorUsuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
              }
            }
          }
        },
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        },
        actualizadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        }
      }
    }) as PabellonWithRelations | null;
  }

  /**
   * Crea un nuevo pabellón
   */
  static async crearPabellon(data: {
    codigo: string;
    nombre: string;
    descripcion?: string;
    observaciones?: string;
    proyectoId: string;
    createdBy: string;
  }): Promise<PabellonWithRelations> {
    return await prisma.pabellon.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        observaciones: data.observaciones,
        proyectoId: data.proyectoId,
        createdBy: data.createdBy
      },
      include: {
        unidades: true,
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        }
      }
    }) as PabellonWithRelations;
  }

  /**
   * Actualiza un pabellón
   */
  static async actualizarPabellon(pabellonId: string, data: {
    codigo?: string;
    nombre?: string;
    descripcion?: string;
    observaciones?: string;
    isActive?: boolean;
    updatedBy: string;
  }): Promise<PabellonWithRelations> {
    return await prisma.pabellon.update({
      where: { id: pabellonId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        unidades: true,
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        },
        actualizadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          }
        }
      }
    }) as PabellonWithRelations;
  }

  /**
   * Elimina un pabellón físicamente de la base de datos
   */
  static async eliminarPabellon(pabellonId: string, updatedBy: string): Promise<void> {
    // Verificar que el pabellón existe
    const pabellon = await prisma.pabellon.findUnique({
      where: { id: pabellonId }
    });

    if (!pabellon) {
      throw new Error('Pabellón no encontrado');
    }

    // Verificar que no tenga unidades registradas (incluyendo inactivas)
    const totalUnidades = await this.obtenerConteoTotalUnidades(pabellonId);
    if (totalUnidades > 0) {
      throw new Error('No se puede eliminar un pabellón que tiene unidades registradas. Primero debe eliminar todas las unidades del pabellón.');
    }

    // Eliminar físicamente el pabellón
    await prisma.pabellon.delete({
      where: { id: pabellonId }
    });
  }

  /**
   * Obtiene el conteo total de unidades de un pabellón
   */
  static async obtenerConteoTotalUnidades(pabellonId: string): Promise<number> {
    return await prisma.unidadCementerio.count({
      where: { pabellonId }
    });
  }

  /**
   * Actualiza las estadísticas de un pabellón
   */
  static async actualizarEstadisticasPabellon(pabellonId: string): Promise<void> {
    const totalUnidades = await this.obtenerConteoTotalUnidades(pabellonId);
    
    await prisma.pabellon.update({
      where: { id: pabellonId },
      data: {
        cantidadUnidades: totalUnidades
      }
    });
  }

  /**
   * Obtiene estadísticas de pabellones por proyecto
   */
  static async obtenerEstadisticasProyecto(proyectoId: string): Promise<PabellonEstadisticas> {
    // Obtener pabellones activos con TODAS las unidades para estadísticas completas
    const pabellones = await prisma.pabellon.findMany({
      where: {
        proyectoId,
        isActive: true
      },
      select: {
        cantidadUnidades: true,
        unidades: {
          select: {
            estado: true,
            precio: true,
            tipoUnidad: true,
          }
        }
      }
    });

    // Obtener TODAS las unidades del proyecto para el total (incluyendo inactivas)
    const todasLasUnidades = await prisma.unidadCementerio.findMany({
      where: {
        pabellon: {
          proyectoId: proyectoId,
          isActive: true
        }
      },
      select: {
        estado: true,
        precio: true,
        tipoUnidad: true,
      }
    });

    const totalPabellones = pabellones.length;
    const totalUnidades = todasLasUnidades.length;
    
    const unidadesDisponibles = pabellones.flatMap(p => p.unidades).filter(u => u.estado === 'DISPONIBLE').length;
    const unidadesVendidas = pabellones.flatMap(p => p.unidades).filter(u => u.estado === 'VENDIDO').length;
    const unidadesReservadas = pabellones.flatMap(p => p.unidades).filter(u => u.estado === 'RESERVADO').length;
    const unidadesOcupadas = pabellones.flatMap(p => p.unidades).filter(u => u.estado === 'OCUPADO').length;
    
    const totalPrecio = pabellones.flatMap(p => p.unidades).reduce((sum, u) => sum + (u.precio || 0), 0);
    const precioPromedio = totalUnidades > 0 ? totalPrecio / totalUnidades : 0;

    const distribucionPorTipo = {
      PARCELA: todasLasUnidades.filter(u => u.tipoUnidad === 'PARCELA').length,
      NICHO: todasLasUnidades.filter(u => u.tipoUnidad === 'NICHO').length,
      MAUSOLEO: todasLasUnidades.filter(u => u.tipoUnidad === 'MAUSOLEO').length,
    };

    return {
      totalPabellones,
      totalUnidades,
      unidadesDisponibles,
      unidadesReservadas,
      unidadesVendidas,
      unidadesOcupadas,
      totalPrecio,
      precioPromedio,
      distribucionPorTipo
    };
  }

  /**
   * Verifica si un código de pabellón ya existe en el proyecto
   */
  static async verificarCodigoExistente(proyectoId: string, codigo: string, excludeId?: string): Promise<boolean> {
    const where: any = {
      proyectoId,
      codigo
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existingPabellon = await prisma.pabellon.findFirst({ where });
    return !!existingPabellon;
  }

  /**
   * Genera el siguiente código de pabellón disponible
   */
  static async generarSiguienteCodigo(proyectoId: string): Promise<string> {
    const ultimoPabellon = await prisma.pabellon.findFirst({
      where: { proyectoId },
      orderBy: { codigo: 'desc' }
    });

    if (!ultimoPabellon) {
      return 'PAB01';
    }

    const match = ultimoPabellon.codigo.match(/PAB(\d+)/);
    if (!match) {
      return 'PAB01';
    }

    const numero = parseInt(match[1]) + 1;
    return `PAB${numero.toString().padStart(2, '0')}`;
  }

  /**
   * Detecta pabellones pendientes (huecos) en un proyecto
   */
  static detectarPabellonesPendientes(pabellones: PabellonWithRelations[]): PabellonPendiente[] {
    if (pabellones.length === 0) {
      return [];
    }

    // Extraer números de pabellones y ordenarlos
    const numerosPabellones = pabellones
      .map(pabellon => {
        const match = pabellon.codigo.match(/PAB(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(numero => numero > 0)
      .sort((a, b) => a - b);

    if (numerosPabellones.length === 0) {
      return [];
    }

    const pabellonesPendientes: PabellonPendiente[] = [];

    // Detectar huecos iniciales (desde 1 hasta el primer pabellón existente)
    const primerNumero = numerosPabellones[0];
    for (let i = 1; i < primerNumero; i++) {
      const codigo = `PAB${i.toString().padStart(2, '0')}`;
      pabellonesPendientes.push({
        codigo,
        nombre: `Pabellón ${codigo}`,
        tipo: 'inicial'
      });
    }

    // Detectar huecos intermedios
    for (let i = 0; i < numerosPabellones.length - 1; i++) {
      const numeroActual = numerosPabellones[i];
      const numeroSiguiente = numerosPabellones[i + 1];
      
      for (let j = numeroActual + 1; j < numeroSiguiente; j++) {
        const codigo = `PAB${j.toString().padStart(2, '0')}`;
        pabellonesPendientes.push({
          codigo,
          nombre: `Pabellón ${codigo}`,
          tipo: 'intermedio'
        });
      }
    }

    return pabellonesPendientes;
  }
} 