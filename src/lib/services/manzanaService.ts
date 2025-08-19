import { prisma } from '../prisma';
import { generarCodigosManzana, generarNombreManzana } from '../utils/manzanaUtils';
import { ManzanaCreateInput, ManzanaUpdateInput, ManzanaWithRelations } from '@/types/manzana';
import { Prisma, Manzana } from '@prisma/client';

interface ManzanaEstadisticas {
  areaTotal: number;
  cantidadLotes: number;
  lotes: {
    estado: string;
    precio: number;
  }[];
}

export class ManzanaService {
  /**
   * Obtiene todas las manzanas de un proyecto
   */
  static async obtenerManzanasPorProyecto(proyectoId: string, incluirInactivas = false): Promise<ManzanaWithRelations[]> {
    const where = {
      proyectoId,
      ...(incluirInactivas ? {} : { isActive: true })
    };

    const manzanas = await prisma.manzana.findMany({
      where,
      include: {
        lotes: {
          where: { 
            estado: {
              in: ['DISPONIBLE', 'RESERVADO', 'VENDIDO', 'ENTREGADO']
            }
          },
          select: {
            id: true,
            codigo: true,
            numero: true,
            area: true,
            estado: true,
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
    }) as ManzanaWithRelations[];

    // Calcular área total y cantidad de lotes dinámicamente
    const manzanasConEstadisticas = await Promise.all(manzanas.map(async (manzana) => {
      const areaTotal = manzana.lotes.reduce((sum, lote) => sum + (lote.area || 0), 0);
      const cantidadLotes = manzana.lotes.length;
      const totalLotes = await this.obtenerConteoTotalLotes(manzana.id);

      return {
        ...manzana,
        areaTotal,
        cantidadLotes,
        totalLotes
      };
    }));

    // Asegurar que las manzanas estén ordenadas correctamente
    return manzanasConEstadisticas.sort((a, b) => {
      if (a.codigo.length !== b.codigo.length) {
        return a.codigo.length - b.codigo.length;
      }
      return a.codigo.localeCompare(b.codigo);
    });
  }

  /**
   * Obtiene una manzana por su ID
   */
  static async obtenerManzanaPorId(id: string): Promise<ManzanaWithRelations | null> {
    const manzana = await prisma.manzana.findUnique({
      where: { id },
      include: {
        proyecto: {
          select: {
            id: true,
            nombre: true
          }
        },
        lotes: {
          where: { estado: 'DISPONIBLE' },
          select: {
            id: true,
            codigo: true,
            numero: true,
            area: true,
            estado: true,
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
    }) as ManzanaWithRelations | null;

    if (!manzana) {
      return null;
    }

    // Calcular área total y cantidad de lotes dinámicamente
    const areaTotal = manzana.lotes.reduce((sum, lote) => sum + (lote.area || 0), 0);
    const cantidadLotes = manzana.lotes.length;

    return {
      ...manzana,
      areaTotal,
      cantidadLotes
    };
  }

  /**
   * Crea una nueva manzana
   */
  static async crearManzana(data: ManzanaCreateInput) {
    return await prisma.manzana.create({
      data: {
        ...data,
        areaTotal: 0,
        cantidadLotes: 0
      }
    });
  }

  /**
   * Actualiza una manzana existente
   */
  static async actualizarManzana(data: { id: string } & ManzanaUpdateInput) {
    const { id, ...updateData } = data;
    return await prisma.manzana.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Elimina una manzana físicamente de la base de datos
   */
  static async eliminarManzana(id: string) {
    // Verificar que la manzana existe
    const manzana = await prisma.manzana.findUnique({
      where: { id }
    });

    if (!manzana) {
      throw new Error('Manzana no encontrada');
    }

    // Verificar que no tenga lotes registrados (incluyendo inactivos)
    const totalLotes = await this.obtenerConteoTotalLotes(id);
    if (totalLotes > 0) {
      throw new Error('No se puede eliminar una manzana que tiene lotes registrados. Primero debe eliminar todos los lotes de la manzana.');
    }

    // Eliminar físicamente la manzana
    return await prisma.manzana.delete({
      where: { id }
    });
  }

  /**
   * Calcula qué manzanas se van a crear para mostrar en la interfaz
   */
  static async calcularManzanasACrear(proyectoId: string, cantidad: number) {
    // Obtener todas las manzanas existentes del proyecto
    const manzanasExistentes = await prisma.manzana.findMany({
      where: { proyectoId },
      select: { codigo: true },
      orderBy: { codigo: 'asc' }
    });

    // Crear un Set con los códigos existentes para búsqueda rápida
    const codigosExistentes = new Set(manzanasExistentes.map((m: { codigo: string }) => m.codigo));

    // Encontrar espacios vacíos y el siguiente código disponible
    const espaciosVacios = this.encontrarEspaciosVacios(codigosExistentes);
    const siguienteCodigo = this.obtenerSiguienteCodigoDisponible(codigosExistentes);

    // Calcular qué manzanas se van a crear
    const manzanasARellenar: string[] = [];
    const manzanasNuevas: string[] = [];
    let contadorManzanas = 0;

    // Primero llenar los espacios vacíos
    for (const codigo of espaciosVacios) {
      if (contadorManzanas >= cantidad) break;
      manzanasARellenar.push(codigo);
      contadorManzanas++;
    }

    // Si aún necesitamos más manzanas, continuar desde el siguiente código disponible
    if (contadorManzanas < cantidad) {
      let indiceActual = this.codigoAIndice(siguienteCodigo);
      
      while (contadorManzanas < cantidad) {
        const codigo = this.indiceACodigo(indiceActual);
        
        // Verificar si el código ya existe
        if (!codigosExistentes.has(codigo)) {
          manzanasNuevas.push(codigo);
          contadorManzanas++;
        }
        indiceActual++;
      }
    }

    return {
      codigosExistentes: Array.from(codigosExistentes).sort((a, b) => {
        if (a.length !== b.length) {
          return a.length - b.length;
        }
        return a.localeCompare(b);
      }),
      espaciosVacios,
      siguienteCodigo,
      cantidadACrear: cantidad,
      enEspaciosVacios: manzanasARellenar.length,
      nuevas: manzanasNuevas.length,
      rellenarEspaciosVacios: manzanasARellenar,
      nuevasManzanas: manzanasNuevas
    };
  }

  /**
   * Crea múltiples manzanas para un proyecto
   */
  static async crearManzanasEnBulk(proyectoId: string, cantidad: number): Promise<Manzana[]> {
    try {
      // Obtener todas las manzanas existentes del proyecto
      const manzanasExistentes = await prisma.manzana.findMany({
        where: { proyectoId },
        select: { codigo: true },
        orderBy: { codigo: 'asc' }
      });

      // Crear un Set con los códigos existentes para búsqueda rápida
      const codigosExistentes = new Set(manzanasExistentes.map((m: { codigo: string }) => m.codigo));

      // Encontrar espacios vacíos y el siguiente código disponible
      const espaciosVacios = this.encontrarEspaciosVacios(codigosExistentes);
      const siguienteCodigo = this.obtenerSiguienteCodigoDisponible(codigosExistentes);

      // Crear las nuevas manzanas
      const nuevasManzanas = [];
      let contadorManzanas = 0;

      // Primero llenar los espacios vacíos
      for (const codigo of espaciosVacios) {
        if (contadorManzanas >= cantidad) break;
        
        nuevasManzanas.push({
          codigo,
          nombre: `Manzana ${codigo}`,
          proyectoId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        contadorManzanas++;
      }

      // Si aún necesitamos más manzanas, continuar desde el siguiente código disponible
      if (contadorManzanas < cantidad) {
        let indiceActual = this.codigoAIndice(siguienteCodigo);
        
        while (contadorManzanas < cantidad) {
          let codigo: string;
          if (indiceActual < 26) {
            codigo = String.fromCharCode(65 + indiceActual);
          } else {
            const primerChar = Math.floor((indiceActual - 26) / 26);
            const segundoChar = (indiceActual - 26) % 26;
            codigo = String.fromCharCode(65 + primerChar) + String.fromCharCode(65 + segundoChar);
          }

          // Verificar si el código ya existe
          if (!codigosExistentes.has(codigo)) {
            nuevasManzanas.push({
              codigo,
              nombre: `Manzana ${codigo}`,
              proyectoId,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            contadorManzanas++;
          }
          indiceActual++;
        }
      }

      // Crear las nuevas manzanas en la base de datos
      if (nuevasManzanas.length > 0) {
        await prisma.manzana.createMany({
          data: nuevasManzanas
        });

        // Obtener las manzanas recién creadas
        return await prisma.manzana.findMany({
          where: {
            proyectoId,
            codigo: {
              in: nuevasManzanas.map(m => m.codigo)
            }
          },
          orderBy: { codigo: 'asc' }
        });
      }

      return [];
    } catch (error) {
      console.error('Error al crear manzanas en bulk:', error);
      throw error;
    }
  }

  /**
   * Encuentra los espacios vacíos en la secuencia de códigos
   * Considera espacios vacíos los códigos que faltan al inicio y entre manzanas existentes
   */
  private static encontrarEspaciosVacios(codigosExistentes: Set<string>): string[] {
    const espaciosVacios: string[] = [];
    
    // Si no hay códigos existentes, no hay espacios vacíos
    if (codigosExistentes.size === 0) {
      return [];
    }

    // Obtener los códigos existentes ordenados
    const codigosOrdenados = Array.from(codigosExistentes).sort((a, b) => {
      if (a.length !== b.length) {
        return a.length - b.length;
      }
      return a.localeCompare(b);
    });

    // Encontrar espacios vacíos al inicio (antes de la primera manzana)
    const primeraManzana = codigosOrdenados[0];
    const indicePrimeraManzana = this.codigoAIndice(primeraManzana);
    
    // Buscar códigos faltantes desde A hasta la primera manzana
    for (let i = 0; i < indicePrimeraManzana; i++) {
      const codigoFaltante = this.indiceACodigo(i);
      espaciosVacios.push(codigoFaltante);
    }

    // Encontrar espacios vacíos entre los códigos existentes
    for (let i = 0; i < codigosOrdenados.length - 1; i++) {
      const codigoActual = codigosOrdenados[i];
      const codigoSiguiente = codigosOrdenados[i + 1];
      
      const indiceActual = this.codigoAIndice(codigoActual);
      const indiceSiguiente = this.codigoAIndice(codigoSiguiente);
      
      // Buscar códigos faltantes entre el actual y el siguiente
      for (let j = indiceActual + 1; j < indiceSiguiente; j++) {
        const codigoFaltante = this.indiceACodigo(j);
        espaciosVacios.push(codigoFaltante);
      }
    }

    return espaciosVacios;
  }

  /**
   * Obtiene el siguiente código disponible después de los existentes
   */
  private static obtenerSiguienteCodigoDisponible(codigosExistentes: Set<string>): string {
    // Si no hay códigos existentes, empezar con A
    if (codigosExistentes.size === 0) {
      return 'A';
    }

    // Encontrar el código más alto existente
    const codigosOrdenados = Array.from(codigosExistentes).sort((a, b) => {
      if (a.length !== b.length) {
        return a.length - b.length;
      }
      return a.localeCompare(b);
    });

    const ultimoCodigo = codigosOrdenados[codigosOrdenados.length - 1];
    const siguienteIndice = this.codigoAIndice(ultimoCodigo) + 1;
    
    return this.indiceACodigo(siguienteIndice);
  }

  /**
   * Convierte un código de manzana a su índice numérico
   */
  private static codigoAIndice(codigo: string): number {
    if (codigo.length === 1) {
      return codigo.charCodeAt(0) - 65;
    } else if (codigo.length === 2) {
      const primerChar = codigo.charCodeAt(0) - 65;
      const segundoChar = codigo.charCodeAt(1) - 65;
      return (primerChar + 1) * 26 + segundoChar;
    }
    return 0;
  }

  /**
   * Convierte un índice numérico a código de manzana
   */
  private static indiceACodigo(indice: number): string {
    if (indice < 26) {
      return String.fromCharCode(65 + indice);
    } else {
      const primerChar = Math.floor((indice - 26) / 26);
      const segundoChar = (indice - 26) % 26;
      return String.fromCharCode(65 + primerChar) + String.fromCharCode(65 + segundoChar);
    }
  }

  /**
   * Obtiene estadísticas de manzanas por proyecto
   */
  static async obtenerEstadisticasProyecto(proyectoId: string) {
    // Obtener manzanas activas con lotes operativos para estadísticas comerciales
    const manzanas = await prisma.manzana.findMany({
      where: {
        proyectoId,
        isActive: true
      },
      select: {
        areaTotal: true,
        cantidadLotes: true,
        lotes: {
          where: { 
            estado: {
              in: ['DISPONIBLE', 'RESERVADO', 'VENDIDO', 'ENTREGADO']
            }
          },
          select: {
            estado: true,
            precio: true,
          }
        }
      }
    }) as ManzanaEstadisticas[];

    // Obtener TODOS los lotes del proyecto para el total (incluyendo inactivos)
    const todosLosLotes = await prisma.lote.findMany({
      where: {
        manzana: {
          proyectoId: proyectoId,
          isActive: true
        }
      },
      select: {
        estado: true
      }
    });

    // Obtener TODOS los lotes con sus áreas para calcular el área total real
    const todosLosLotesConArea = await prisma.lote.findMany({
      where: {
        manzana: {
          proyectoId: proyectoId,
          isActive: true
        }
      },
      select: {
        area: true
      }
    });

    const totalManzanas = manzanas.length;
    const totalArea = todosLosLotesConArea.reduce((sum, lote) => sum + (lote.area || 0), 0); // Suma de TODOS los lotes
    const totalLotes = todosLosLotes.length; // Total de TODOS los lotes
    
    const lotesDisponibles = manzanas.flatMap(m => m.lotes).filter(l => l.estado === 'DISPONIBLE').length;
    const lotesVendidos = manzanas.flatMap(m => m.lotes).filter(l => l.estado === 'VENDIDO').length;
    const lotesReservados = manzanas.flatMap(m => m.lotes).filter(l => l.estado === 'RESERVADO').length;

    return {
      totalManzanas,
      totalArea,
      totalLotes,
      lotesDisponibles,
      lotesVendidos,
      lotesReservados,
    };
  }

  /**
   * Actualiza las estadísticas de una manzana (área total y cantidad de lotes)
   */
  static async actualizarEstadisticasManzana(manzanaId: string): Promise<void> {
    // Obtener todos los lotes operativos de la manzana
    const lotes = await prisma.lote.findMany({
      where: {
        manzanaId,
        estado: {
          in: ['DISPONIBLE', 'RESERVADO', 'VENDIDO', 'ENTREGADO']
        }
      },
      select: {
        area: true
      }
    });

    // Calcular estadísticas
    const areaTotal = lotes.reduce((sum, lote) => sum + (lote.area || 0), 0);
    const cantidadLotes = lotes.length;

    // Actualizar la manzana
    await prisma.manzana.update({
      where: { id: manzanaId },
      data: {
        areaTotal,
        cantidadLotes
      }
    });
  }

  /**
   * Obtiene el conteo total de lotes de una manzana (incluyendo inactivos)
   */
  static async obtenerConteoTotalLotes(manzanaId: string): Promise<number> {
    const conteo = await prisma.lote.count({
      where: {
        manzanaId: manzanaId
      }
    });
    
    return conteo;
  }
} 