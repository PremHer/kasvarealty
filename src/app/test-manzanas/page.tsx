'use client';

import { useState } from 'react';
import ManzanasList from '@/components/proyectos/ManzanasList';
import ManzanasStats from '@/components/proyectos/ManzanasStats';

export default function TestManzanasPage() {
  const [proyectoId, setProyectoId] = useState('test-proyecto-id');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Prueba de Funcionalidad de Manzanas</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          ID del Proyecto (para pruebas):
        </label>
        <input
          type="text"
          value={proyectoId}
          onChange={(e) => setProyectoId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Ingresa un ID de proyecto válido"
        />
      </div>

      <div className="space-y-6">
        <ManzanasStats proyectoId={proyectoId} />
        <ManzanasList proyectoId={proyectoId} />
      </div>
    </div>
  );
} 