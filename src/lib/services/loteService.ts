export interface Lote {
  id: string;
  numero: string;
  area: number;
  manzanaId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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