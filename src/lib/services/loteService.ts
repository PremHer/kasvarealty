export interface Lote {
  id: string;
  numero: string;
  area: number;
  manzanaId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LotePendiente {
  codigo: string;
  numero: string;
  tipo: 'inicial' | 'intermedio';
}

export const loteService = {
  // Obtener todos los lotes de un proyecto
  async obtenerLotes(proyectoId: string): Promise<Lote[]> {
    try {
      const response = await fetch(`/api/proyectos/${proyectoId}/lotes`);
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Error al obtener los lotes');
      }
      return response.json();
    } catch (error) {
      console.error('Error al obtener lotes:', error);
      throw new Error('Error al obtener los lotes');
    }
  },

  // Obtener lotes de una manzana específica
  async obtenerLotesPorManzana(proyectoId: string, manzanaId: string): Promise<Lote[]> {
    try {
      const response = await fetch(`/api/proyectos/${proyectoId}/lotes?manzanaId=${manzanaId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Error al obtener los lotes');
      }
      return response.json();
    } catch (error) {
      console.error('Error al obtener lotes:', error);
      throw new Error('Error al obtener los lotes');
    }
  },

  // Detectar lotes pendientes (huecos) en una manzana
  detectarLotesPendientes(lotes: Lote[], manzanaCodigo: string): LotePendiente[] {
    if (lotes.length === 0) {
      return [];
    }

    // Extraer números de lotes y ordenarlos
    const numerosLotes = lotes
      .map(lote => parseInt(lote.numero))
      .sort((a, b) => a - b);

    const lotesPendientes: LotePendiente[] = [];
    const maxNumero = Math.max(...numerosLotes);

    // Detectar huecos iniciales (desde 1 hasta el primer lote existente)
    const primerNumero = numerosLotes[0];
    for (let i = 1; i < primerNumero; i++) {
      lotesPendientes.push({
        codigo: `${manzanaCodigo}-${i.toString().padStart(2, '0')}`,
        numero: i.toString().padStart(2, '0'),
        tipo: 'inicial'
      });
    }

    // Detectar huecos intermedios
    for (let i = 0; i < numerosLotes.length - 1; i++) {
      const numeroActual = numerosLotes[i];
      const numeroSiguiente = numerosLotes[i + 1];
      
      for (let j = numeroActual + 1; j < numeroSiguiente; j++) {
        lotesPendientes.push({
          codigo: `${manzanaCodigo}-${j.toString().padStart(2, '0')}`,
          numero: j.toString().padStart(2, '0'),
          tipo: 'intermedio'
        });
      }
    }

    return lotesPendientes;
  },

  // Crear lotes en lote
  async crearLotesEnBulk(proyectoId: string, cantidad: number): Promise<Lote[]> {
    try {
      const response = await fetch(`/api/proyectos/${proyectoId}/lotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cantidad }),
      });

      if (!response.ok) {
        throw new Error('Error al crear los lotes');
      }

      return response.json();
    } catch (error) {
      console.error('Error al crear lotes:', error);
      throw new Error('Error al crear los lotes');
    }
  },

  // Eliminar un lote
  async eliminarLote(loteId: string): Promise<void> {
    try {
      const response = await fetch(`/api/proyectos/lotes/${loteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el lote');
      }
    } catch (error) {
      console.error('Error al eliminar lote:', error);
      throw new Error('Error al eliminar el lote');
    }
  }
}; 