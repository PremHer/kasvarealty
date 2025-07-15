'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export default function VentasTestPage() {
  const { data: session } = useSession()
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ventas/test')
      const data = await response.json()
      
      if (response.ok) {
        setTestResult(data)
        toast({
          title: 'Prueba exitosa',
          description: 'El sistema de ventas está funcionando correctamente',
        })
      } else {
        throw new Error(data.error || 'Error en la prueba')
      }
    } catch (error) {
      console.error('Error en prueba:', error)
      toast({
        title: 'Error en la prueba',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prueba del Sistema de Ventas</h1>
        <p className="text-muted-foreground">
          Página de prueba para verificar que el sistema de ventas funcione correctamente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>ID:</strong> {session?.user?.id || 'No disponible'}</p>
            <p><strong>Nombre:</strong> {session?.user?.name || 'No disponible'}</p>
            <p><strong>Email:</strong> {session?.user?.email || 'No disponible'}</p>
            <p><strong>Rol:</strong> {session?.user?.role || 'No disponible'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prueba de API</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runTest} disabled={loading}>
            {loading ? 'Ejecutando prueba...' : 'Ejecutar prueba'}
          </Button>

          {testResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Resultado de la prueba:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enlaces de Prueba</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <a 
              href="/dashboard/ventas" 
              className="block text-blue-600 hover:text-blue-800 underline"
            >
              Ir a Sistema de Ventas
            </a>
            <a 
              href="/api/ventas/test" 
              className="block text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Probar API directamente
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 