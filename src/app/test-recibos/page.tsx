'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

export default function TestRecibosPage() {
  const { toast } = useToast()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkUserEmpresa()
  }, [])

  const checkUserEmpresa = async () => {
    try {
      const response = await fetch('/api/test-user-empresa')
      const data = await response.json()
      setUserData(data)
      console.log('User data:', data)
    } catch (error) {
      console.error('Error checking user empresa:', error)
    }
  }

  const testReciboGeneration = async () => {
    setLoading(true)
    try {
      // Primero necesitamos obtener una cuota para probar
      const cuotasResponse = await fetch('/api/cuotas')
      const cuotasData = await cuotasResponse.json()
      
      if (!cuotasData.cuotas || cuotasData.cuotas.length === 0) {
        toast({
          title: 'No hay cuotas disponibles',
          description: 'Necesitas crear una cuota primero para probar la generación de recibos.',
          variant: 'destructive',
        })
        return
      }

      const primeraCuota = cuotasData.cuotas[0]
      
      const response = await fetch('/api/test-recibo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cuotaId: primeraCuota.id,
          montoPagado: 1000,
          formaPago: 'EFECTIVO'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: 'Recibo generado exitosamente',
          description: `Recibo ${data.recibo.numeroRecibo} creado con monto S/ ${data.recibo.montoPagado}`,
        })
      } else {
        toast({
          title: 'Error al generar recibo',
          description: data.error || 'Error desconocido',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error testing recibo generation:', error)
      toast({
        title: 'Error',
        description: 'Error al probar la generación de recibos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Prueba de Generación de Recibos</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          {userData ? (
            <div className="space-y-4">
              <div>
                <strong>Usuario:</strong> {userData.usuario?.nombre} ({userData.usuario?.email})
              </div>
              <div>
                <strong>Empresa Desarrolladora:</strong> {userData.usuario?.empresaDesarrolladora?.nombre || 'No asignada'}
              </div>
              <div>
                <strong>RUC:</strong> {userData.usuario?.empresaDesarrolladora?.ruc || 'No disponible'}
              </div>
              <div>
                <strong>Representante Legal:</strong> {userData.usuario?.empresaDesarrolladora?.representanteLegal?.nombre || 'No asignado'}
              </div>
              <div>
                <strong>Tiene Empresa:</strong> {userData.tieneEmpresa ? '✅ Sí' : '❌ No'}
              </div>
            </div>
          ) : (
            <div>Cargando información del usuario...</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empresas Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {userData?.empresasDisponibles ? (
            <div className="space-y-2">
              {userData.empresasDisponibles.map((empresa: any) => (
                <div key={empresa.id} className="p-3 border rounded">
                  <div><strong>{empresa.nombre}</strong></div>
                  <div>RUC: {empresa.ruc}</div>
                  <div>Representante: {empresa.representanteLegal?.nombre || 'No asignado'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div>No hay empresas disponibles</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prueba de Generación</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testReciboGeneration} 
            disabled={loading || !userData?.tieneEmpresa}
          >
            {loading ? 'Generando...' : 'Generar Recibo de Prueba'}
          </Button>
          
          {!userData?.tieneEmpresa && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
              <strong>⚠️ Advertencia:</strong> El usuario no tiene una empresa desarrolladora asociada. 
              Necesitas asignar una empresa al usuario para poder generar recibos.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 