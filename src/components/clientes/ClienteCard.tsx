'use client'

import { Cliente } from '@/types/cliente'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiCreditCard, FiBriefcase } from 'react-icons/fi'

interface ClienteCardProps {
  cliente: Cliente
}

export function ClienteCard({ cliente }: ClienteCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            {cliente.nombre} {cliente.apellido}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant={cliente.tipo === 'INDIVIDUAL' ? 'default' : 'secondary'}>
              {cliente.tipo === 'INDIVIDUAL' ? 'Individual' : 'Empresa'}
            </Badge>
            <Badge
              variant={
                cliente.estado === 'ACTIVO'
                  ? 'success'
                  : cliente.estado === 'INACTIVO'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {cliente.estado}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FiMail className="h-4 w-4" />
                <span>Email</span>
              </div>
              <p>{cliente.email}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FiPhone className="h-4 w-4" />
                <span>Teléfono</span>
              </div>
              <p>{cliente.telefono || '-'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FiMapPin className="h-4 w-4" />
              <span>Dirección</span>
            </div>
            <p>{cliente.direccion || '-'}</p>
          </div>

          {cliente.tipo === 'INDIVIDUAL' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FiCreditCard className="h-4 w-4" />
                    <span>DNI</span>
                  </div>
                  <p>{cliente.dni || '-'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FiCalendar className="h-4 w-4" />
                    <span>Fecha de Nacimiento</span>
                  </div>
                  <p>
                    {cliente.fechaNacimiento
                      ? format(new Date(cliente.fechaNacimiento), 'PPP', { locale: es })
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FiUser className="h-4 w-4" />
                    <span>Estado Civil</span>
                  </div>
                  <p>{cliente.estadoCivil || '-'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FiBriefcase className="h-4 w-4" />
                    <span>Ocupación</span>
                  </div>
                  <p>{cliente.ocupacion || '-'}</p>
                </div>
              </div>
            </>
          )}

          {cliente.tipo === 'EMPRESA' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FiCreditCard className="h-4 w-4" />
                    <span>RUC</span>
                  </div>
                  <p>{cliente.ruc || '-'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FiBriefcase className="h-4 w-4" />
                    <span>Razón Social</span>
                  </div>
                  <p>{cliente.razonSocial || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FiUser className="h-4 w-4" />
                    <span>Representante Legal</span>
                  </div>
                  <p>{cliente.representanteLegal || '-'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FiBriefcase className="h-4 w-4" />
                    <span>Cargo del Representante</span>
                  </div>
                  <p>{cliente.cargoRepresentante || '-'}</p>
                </div>
              </div>
            </>
          )}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Registrado el {format(new Date(cliente.createdAt), 'PPP', { locale: es })}</span>
              <span>Última actualización: {format(new Date(cliente.updatedAt), 'PPP', { locale: es })}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 