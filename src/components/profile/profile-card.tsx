'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { FiUser, FiMail, FiShield, FiLock, FiCalendar, FiEdit2, FiKey } from 'react-icons/fi'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ProfileCard() {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/users/${session?.user?.id}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Contraseña actualizada correctamente')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordForm(false)
      } else {
        toast.error(data.error || 'Error al cambiar la contraseña')
      }
    } catch (error) {
      toast.error('Error al cambiar la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        {/* Header con gradiente */}
        <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-700 relative">
          <div className="absolute -bottom-16 left-8">
            <div className="h-32 w-32 rounded-xl bg-white p-2 shadow-lg">
              <div className="h-full w-full rounded-lg bg-primary-100 flex items-center justify-center">
                <FiUser className="h-16 w-16 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="pt-20 px-8 pb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{session?.user?.name}</h1>
              <div className="mt-2 flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <FiMail className="h-5 w-5 text-primary-500" />
                  <span className="text-gray-700">{session?.user?.email}</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <FiShield className="h-5 w-5 text-blue-500" />
                  <span className="text-gray-700">{session?.user?.role?.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2"
            >
              <FiEdit2 className="h-4 w-4" />
              <span>{isEditing ? 'Cancelar' : 'Editar Perfil'}</span>
            </Button>
          </div>

          {/* Sección de cambio de contraseña */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FiLock className="h-5 w-5 mr-2 text-primary-600" />
                Seguridad
              </h2>
              {!showPasswordForm && (
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordForm(true)}
                  className="flex items-center space-x-2"
                >
                  <FiKey className="h-4 w-4" />
                  <span>Cambiar Contraseña</span>
                </Button>
              )}
            </div>
            
            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="current-password">Contraseña Actual</Label>
                    <Input
                      type="password"
                      id="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">Nueva Contraseña</Label>
                    <Input
                      type="password"
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                    <Input
                      type="password"
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false)
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Información adicional */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FiCalendar className="h-5 w-5 mr-2 text-primary-600" />
              Información de la Cuenta
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Estado de la Cuenta</h3>
                <Badge variant="success" className="mt-2">Activa</Badge>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Último Acceso</h3>
                <p className="mt-2 text-gray-900">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
} 