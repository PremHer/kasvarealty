'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiPlus, FiX, FiUser, FiMail, FiMapPin, FiPhone, FiCreditCard } from 'react-icons/fi'
import { useToast } from '@/components/ui/use-toast'
import { TipoBanco, TipoBilleteraVirtual } from '@prisma/client'
import { Checkbox } from '@/components/ui/checkbox'

interface Usuario {
  id: string
  nombre: string
  email: string
}

interface NewEmpresaModalProps {
  isOpen: boolean
  onClose: () => void
  onEmpresaCreated: () => void
}

export default function NewEmpresaModal({ isOpen, onClose, onEmpresaCreated }: NewEmpresaModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingGerentes, setIsLoadingGerentes] = useState(false)
  const [gerentesGenerales, setGerentesGenerales] = useState<Usuario[]>([])
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    email: '',
    direccion: '',
    telefono: '',
    representanteLegalId: '',
    bancos: [] as TipoBanco[],
    billeterasVirtuales: [] as TipoBilleteraVirtual[]
  })

  useEffect(() => {
    const fetchGerentesGenerales = async () => {
      setIsLoadingGerentes(true)
      try {
        const response = await fetch('/api/users?rol=GERENTE_GENERAL')
        if (response.ok) {
          const data = await response.json()
          setGerentesGenerales(data)
        }
      } catch (error) {
        console.error('Error al cargar gerentes generales:', error)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los gerentes generales',
          variant: 'destructive'
        })
      } finally {
        setIsLoadingGerentes(false)
      }
    }

    if (isOpen) {
      fetchGerentesGenerales()
    }
  }, [isOpen, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validar RUC
    if (!/^\d{11}$/.test(formData.ruc)) {
      toast({
        title: 'Error',
        description: 'El RUC debe tener exactamente 11 dígitos',
        variant: 'destructive'
      })
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/empresas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.code === 'P2002' && error.meta?.target?.includes('ruc')) {
          throw new Error('Ya existe una empresa registrada con este RUC')
        }
        throw new Error(error.message || 'Error al crear la empresa')
      }

      const newEmpresa = await response.json()

      toast({
        title: '¡Éxito!',
        description: 'La empresa se ha creado exitosamente',
        variant: 'success',
        duration: 3000
      })

      onEmpresaCreated()
      onClose()
      setFormData({
        nombre: '',
        ruc: '',
        email: '',
        direccion: '',
        telefono: '',
        representanteLegalId: '',
        bancos: [],
        billeterasVirtuales: []
      })
    } catch (error) {
      console.error('Error al crear empresa:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Hubo un error al crear la empresa',
        variant: 'destructive',
        duration: 5000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBancoChange = (value: TipoBanco) => {
    setFormData(prev => ({
      ...prev,
      bancos: prev.bancos.includes(value)
        ? prev.bancos.filter(b => b !== value)
        : [...prev.bancos, value]
    }))
  }

  const handleBilleteraChange = (value: TipoBilleteraVirtual) => {
    setFormData(prev => ({
      ...prev,
      billeterasVirtuales: prev.billeterasVirtuales.includes(value)
        ? prev.billeterasVirtuales.filter(b => b !== value)
        : [...prev.billeterasVirtuales, value]
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <FiUser className="h-6 w-6 text-primary-600" />
            <span>Nueva Empresa Desarrolladora</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <FiUser className="h-5 w-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Información General</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Empresa</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    required
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ruc">RUC</Label>
                  <Input
                    id="ruc"
                    value={formData.ruc}
                    onChange={(e) => {
                      // Solo permitir números
                      const value = e.target.value.replace(/\D/g, '')
                      // Limitar a 11 dígitos
                      if (value.length <= 11) {
                        setFormData(prev => ({ ...prev, ruc: value }))
                      }
                    }}
                    required
                    className="w-full"
                    placeholder="Ingrese los 11 dígitos del RUC"
                    maxLength={11}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    required
                    className="w-full"
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Textarea
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <FiUser className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Representante Legal</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="representanteLegalId">Seleccionar Representante Legal</Label>
                <Select
                  value={formData.representanteLegalId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, representanteLegalId: value }))}
                  required
                  disabled={isLoadingGerentes}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingGerentes ? "Cargando..." : "Seleccione un representante legal"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {isLoadingGerentes ? (
                      <SelectItem value="loading" disabled>
                        Cargando gerentes generales...
                      </SelectItem>
                    ) : Array.isArray(gerentesGenerales) && gerentesGenerales.length > 0 ? (
                      gerentesGenerales.map((gerente) => (
                        <SelectItem key={gerente.id} value={gerente.id} className="hover:bg-gray-100">
                          {gerente.nombre} - {gerente.email}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-gerentes" disabled>
                        No hay gerentes generales disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <FiCreditCard className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Información Bancaria</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Bancos</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.values(TipoBanco).map((banco) => (
                      <div key={banco} className="flex items-center space-x-2">
                        <Checkbox
                          id={`banco-${banco}`}
                          checked={formData.bancos.includes(banco)}
                          onCheckedChange={() => handleBancoChange(banco)}
                        />
                        <Label htmlFor={`banco-${banco}`} className="text-sm font-normal">
                          {banco}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Billeteras Virtuales</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.values(TipoBilleteraVirtual).map((billetera) => (
                      <div key={billetera} className="flex items-center space-x-2">
                        <Checkbox
                          id={`billetera-${billetera}`}
                          checked={formData.billeterasVirtuales.includes(billetera)}
                          onCheckedChange={() => handleBilleteraChange(billetera)}
                        />
                        <Label htmlFor={`billetera-${billetera}`} className="text-sm font-normal">
                          {billetera}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {isSubmitting ? 'Creando...' : 'Crear Empresa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 