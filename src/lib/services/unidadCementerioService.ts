import { prisma } from '../prisma'
import { UnidadCementerioWithRelations, CreateUnidadCementerioData, UpdateUnidadCementerioData } from '@/types/cementerio'
import { PabellonService } from './pabellonService'

export class UnidadCementerioService {
  /**
   * Obtiene todas las unidades de cementerio de un proyecto
   */
  static async obtenerUnidadesPorProyecto(proyectoId: string): Promise<UnidadCementerioWithRelations[]> {
    return await prisma.unidadCementerio.findMany({
      where: {
        pabellon: {
          proyectoId: proyectoId,
          isActive: true
        }
      },
      include: {
        pabellon: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        },
        parcela: true,
        nicho: true,
        mausoleo: true,
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        actualizadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: [
        { pabellon: { codigo: 'asc' } },
        { codigo: 'asc' }
      ]
    }) as UnidadCementerioWithRelations[];
  }

  /**
   * Obtiene unidades de cementerio de un pabellón específico
   */
  static async obtenerUnidadesPorPabellon(proyectoId: string, pabellonId: string): Promise<UnidadCementerioWithRelations[]> {
    return await prisma.unidadCementerio.findMany({
      where: {
        pabellonId: pabellonId,
        pabellon: {
          proyectoId: proyectoId,
          isActive: true
        }
      },
      include: {
        pabellon: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        },
        parcela: true,
        nicho: true,
        mausoleo: true,
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        actualizadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: [
        { codigo: 'asc' }
      ]
    }) as UnidadCementerioWithRelations[];
  }

  /**
   * Obtiene una unidad de cementerio por ID
   */
  static async obtenerUnidadPorId(unidadId: string): Promise<UnidadCementerioWithRelations | null> {
    return await prisma.unidadCementerio.findUnique({
      where: { id: unidadId },
      include: {
        pabellon: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        },
        parcela: true,
        nicho: true,
        mausoleo: true,
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        actualizadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    }) as UnidadCementerioWithRelations | null;
  }

  /**
   * Crea una nueva unidad de cementerio
   */
  static async crearUnidad(data: CreateUnidadCementerioData & { createdBy: string }): Promise<UnidadCementerioWithRelations> {
    const { parcela, nicho, mausoleo, ...unidadData } = data;

    // Verificar que el código no exista en el pabellón
    const codigoExistente = await this.verificarCodigoExistente(data.pabellonId, data.codigo);
    if (codigoExistente) {
      throw new Error(`El código ${data.codigo} ya existe en este pabellón`);
    }

    // Crear la unidad de cementerio con transacción
    const unidad = await prisma.$transaction(async (tx) => {
      const unidadCreada = await tx.unidadCementerio.create({
        data: {
          codigo: unidadData.codigo,
          tipoUnidad: unidadData.tipoUnidad,
          precio: unidadData.precio,
          latitud: unidadData.latitud,
          longitud: unidadData.longitud,
          descripcion: unidadData.descripcion,
          observaciones: unidadData.observaciones,
          pabellonId: unidadData.pabellonId,
          createdBy: unidadData.createdBy
        },
        include: {
          pabellon: {
            select: {
              id: true,
              codigo: true,
              nombre: true
            }
          },
          creadoPorUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        }
      });

      // Crear el registro específico según el tipo
      if (unidadData.tipoUnidad === 'PARCELA' && parcela) {
        await tx.parcela.create({
          data: {
            unidadCementerioId: unidadCreada.id,
            dimensionLargo: parcela.dimensionLargo,
            dimensionAncho: parcela.dimensionAncho,
            capacidad: parcela.capacidad,
            tipoTerreno: parcela.tipoTerreno
          }
        });
      } else if (unidadData.tipoUnidad === 'NICHO' && nicho) {
        await tx.nicho.create({
          data: {
            unidadCementerioId: unidadCreada.id,
            nivelVertical: nicho.nivelVertical,
            capacidadUrnas: nicho.capacidadUrnas,
            material: nicho.material,
            medidaAlto: nicho.medidaAlto,
            medidaAncho: nicho.medidaAncho,
            medidaProfundidad: nicho.medidaProfundidad
          }
        });
      } else if (unidadData.tipoUnidad === 'MAUSOLEO' && mausoleo) {
        await tx.mausoleo.create({
          data: {
            unidadCementerioId: unidadCreada.id,
            dimensionLargo: mausoleo.dimensionLargo,
            dimensionAncho: mausoleo.dimensionAncho,
            capacidadPersonas: mausoleo.capacidadPersonas,
            tipoConstruccion: mausoleo.tipoConstruccion,
            material: mausoleo.material,
            niveles: mausoleo.niveles
          }
        });
      }

      return unidadCreada;
    });

    // Actualizar estadísticas del pabellón
    await PabellonService.actualizarEstadisticasPabellon(data.pabellonId);

    return unidad as UnidadCementerioWithRelations;
  }

  /**
   * Actualiza una unidad de cementerio
   */
  static async actualizarUnidad(unidadId: string, data: UpdateUnidadCementerioData & { updatedBy: string }): Promise<UnidadCementerioWithRelations> {
    const { parcela, nicho, mausoleo, ...unidadData } = data;

    // Verificar que el código no exista en el pabellón (excluyendo la unidad actual)
    if (unidadData.codigo) {
      const unidadActual = await this.obtenerUnidadPorId(unidadId);
      if (unidadActual) {
        const codigoExistente = await this.verificarCodigoExistente(unidadActual.pabellonId, unidadData.codigo, unidadId);
        if (codigoExistente) {
          throw new Error(`El código ${unidadData.codigo} ya existe en este pabellón`);
        }
      }
    }

    // Actualizar la unidad de cementerio con transacción
    const unidad = await prisma.$transaction(async (tx) => {
      const unidadActualizada = await tx.unidadCementerio.update({
        where: { id: unidadId },
        data: {
          ...unidadData,
          updatedAt: new Date()
        },
        include: {
          pabellon: {
            select: {
              id: true,
              codigo: true,
              nombre: true
            }
          },
          creadoPorUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          },
          actualizadoPorUsuario: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        }
      });

      // Actualizar el registro específico según el tipo
      if (parcela) {
        await tx.parcela.update({
          where: { unidadCementerioId: unidadId },
          data: parcela
        });
      } else if (nicho) {
        await tx.nicho.update({
          where: { unidadCementerioId: unidadId },
          data: nicho
        });
      } else if (mausoleo) {
        await tx.mausoleo.update({
          where: { unidadCementerioId: unidadId },
          data: mausoleo
        });
      }

      return unidadActualizada;
    });

    // Actualizar estadísticas del pabellón
    const unidadActual = await this.obtenerUnidadPorId(unidadId);
    if (unidadActual) {
      await PabellonService.actualizarEstadisticasPabellon(unidadActual.pabellonId);
    }

    return unidad as UnidadCementerioWithRelations;
  }

  /**
   * Elimina una unidad de cementerio físicamente de la base de datos
   */
  static async eliminarUnidad(unidadId: string, updatedBy: string): Promise<void> {
    // Obtener la unidad antes de eliminarla para actualizar estadísticas
    const unidad = await prisma.unidadCementerio.findUnique({
      where: { id: unidadId },
      select: { pabellonId: true }
    });

    if (!unidad) {
      throw new Error('Unidad no encontrada');
    }

    // Eliminar físicamente la unidad con transacción
    await prisma.$transaction(async (tx) => {
      // Eliminar registros específicos según el tipo
      await tx.parcela.deleteMany({
        where: { unidadCementerioId: unidadId }
      });
      
      await tx.nicho.deleteMany({
        where: { unidadCementerioId: unidadId }
      });
      
      await tx.mausoleo.deleteMany({
        where: { unidadCementerioId: unidadId }
      });

      // Eliminar la unidad principal
      await tx.unidadCementerio.delete({
        where: { id: unidadId }
      });
    });

    // Actualizar estadísticas del pabellón
    await PabellonService.actualizarEstadisticasPabellon(unidad.pabellonId);
  }

  /**
   * Verifica si un código de unidad ya existe en el pabellón
   */
  static async verificarCodigoExistente(pabellonId: string, codigo: string, excludeId?: string): Promise<boolean> {
    const where: any = {
      pabellonId,
      codigo,
      estado: 'DISPONIBLE' // Solo considerar unidades activas
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existingUnidad = await prisma.unidadCementerio.findFirst({ where });
    return !!existingUnidad;
  }

  /**
   * Genera el siguiente código de unidad disponible para un tipo específico
   */
  static async generarSiguienteCodigo(pabellonId: string, tipoUnidad: 'PARCELA' | 'NICHO' | 'MAUSOLEO'): Promise<string> {
    const pabellon = await prisma.pabellon.findUnique({
      where: { id: pabellonId },
      select: { codigo: true }
    });

    if (!pabellon) {
      throw new Error('Pabellón no encontrado');
    }

    // Obtener todas las unidades del tipo específico (sin importar el estado)
    const unidades = await prisma.unidadCementerio.findMany({
      where: {
        pabellonId,
        tipoUnidad
      },
      select: { codigo: true },
      orderBy: { codigo: 'asc' }
    });

    const prefijo = tipoUnidad === 'PARCELA' ? 'PAR' : tipoUnidad === 'NICHO' ? 'NIC' : 'MAU';
    const codigoPabellon = pabellon.codigo;

    if (unidades.length === 0) {
      return `${codigoPabellon}-${prefijo}-01`;
    }

    // Extraer números de las unidades existentes
    const numerosExistentes = unidades
      .map(unidad => {
        const match = unidad.codigo.match(new RegExp(`${codigoPabellon}-${prefijo}-(\\d+)`));
        return match ? parseInt(match[1]) : null;
      })
      .filter(num => num !== null)
      .sort((a, b) => a! - b!);

    // Encontrar el siguiente número disponible
    let siguienteNumero = 1;
    for (const numero of numerosExistentes) {
      if (numero === siguienteNumero) {
        siguienteNumero++;
      } else {
        break;
      }
    }

    return `${codigoPabellon}-${prefijo}-${siguienteNumero.toString().padStart(2, '0')}`;
  }

  /**
   * Detecta huecos en la secuencia de unidades de un pabellón
   */
  static async detectarHuecosUnidades(pabellonId: string): Promise<{
    PARCELA: string[];
    NICHO: string[];
    MAUSOLEO: string[];
  }> {
    const pabellon = await prisma.pabellon.findUnique({
      where: { id: pabellonId },
      select: { codigo: true }
    });

    if (!pabellon) {
      throw new Error('Pabellón no encontrado');
    }

    const codigoPabellon = pabellon.codigo;
    const huecos: { PARCELA: string[]; NICHO: string[]; MAUSOLEO: string[] } = {
      PARCELA: [],
      NICHO: [],
      MAUSOLEO: []
    };

    // Detectar huecos para cada tipo de unidad
    for (const tipoUnidad of ['PARCELA', 'NICHO', 'MAUSOLEO'] as const) {
      const prefijo = tipoUnidad === 'PARCELA' ? 'PAR' : tipoUnidad === 'NICHO' ? 'NIC' : 'MAU';
      
      // Obtener todas las unidades del tipo específico (sin importar el estado)
      const unidades = await prisma.unidadCementerio.findMany({
        where: {
          pabellonId,
          tipoUnidad
        },
        select: { codigo: true },
        orderBy: { codigo: 'asc' }
      });

      // Extraer números de las unidades existentes
      const numerosExistentes = unidades
        .map(unidad => {
          const match = unidad.codigo.match(new RegExp(`${codigoPabellon}-${prefijo}-(\\d+)`));
          return match ? parseInt(match[1]) : null;
        })
        .filter(num => num !== null)
        .sort((a, b) => a! - b!);

      // Detectar huecos
      if (numerosExistentes.length > 0) {
        const primerNumero = numerosExistentes[0]!;
        const ultimoNumero = numerosExistentes[numerosExistentes.length - 1]!;

        // Verificar huecos desde 01 hasta el último número
        for (let i = 1; i <= ultimoNumero; i++) {
          if (!numerosExistentes.includes(i)) {
            const codigoHueco = `${codigoPabellon}-${prefijo}-${i.toString().padStart(2, '0')}`;
            huecos[tipoUnidad].push(codigoHueco);
          }
        }
      }
    }

    return huecos;
  }

  /**
   * Obtiene el siguiente código disponible considerando huecos
   */
  static async obtenerSiguienteCodigoConHuecos(pabellonId: string, tipoUnidad: 'PARCELA' | 'NICHO' | 'MAUSOLEO'): Promise<string> {
    const huecos = await this.detectarHuecosUnidades(pabellonId);
    const huecosTipo = huecos[tipoUnidad];

    // Si hay huecos, devolver el primero
    if (huecosTipo.length > 0) {
      return huecosTipo[0];
    }

    // Si no hay huecos, generar el siguiente código normal
    return await this.generarSiguienteCodigo(pabellonId, tipoUnidad);
  }

  /**
   * Obtiene el siguiente código disponible sin considerar huecos (secuencia normal)
   */
  static async obtenerSiguienteCodigoSinHuecos(pabellonId: string, tipoUnidad: 'PARCELA' | 'NICHO' | 'MAUSOLEO'): Promise<string> {
    // Generar el siguiente código normal sin considerar huecos
    return await this.generarSiguienteCodigo(pabellonId, tipoUnidad);
  }

  /**
   * Cambia el estado de una unidad de cementerio
   */
  static async cambiarEstadoUnidad(unidadId: string, nuevoEstado: 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'OCUPADO' | 'INACTIVO' | 'RETIRADO', updatedBy: string): Promise<UnidadCementerioWithRelations> {
    const unidad = await prisma.unidadCementerio.update({
      where: { id: unidadId },
      data: {
        estado: nuevoEstado,
        updatedBy
      },
      include: {
        pabellon: {
          select: {
            id: true,
            codigo: true,
            nombre: true
          }
        },
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        actualizadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        parcela: true,
        nicho: true,
        mausoleo: true
      }
    });

    // Actualizar estadísticas del pabellón
    await PabellonService.actualizarEstadisticasPabellon(unidad.pabellonId);

    return unidad;
  }
} 