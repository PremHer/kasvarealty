'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FiDownload, FiEye } from 'react-icons/fi'
import { FormaPago } from '@prisma/client'

interface ReciboPagoWithRelations {
  id: string
  numeroRecibo: string
  empresaDesarrolladora: {
    id: string
    nombre: string
    ruc: string
  }
  venta?: {
    id: string
    numeroVenta: string
    lote?: {
      numero: string
      codigo: string
    }
    proyecto?: {
      nombre: string
    }
  }
  cuota?: {
    numeroCuota: number
    fechaVencimiento: Date
  }
  cliente: {
    id: string
    nombre: string
    apellido?: string
    razonSocial?: string
    dni?: string
    ruc?: string
  }
  vendedor: {
    id: string
    nombre: string
  }
  montoPagado: number
  formaPago: FormaPago
  metodoPago?: string
  concepto: string
  fechaPago: Date
  observaciones?: string
  comprobantePago?: {
    id: string
    nombreArchivo: string
    url: string
  }
  creadoPorUsuario?: {
    id: string
    nombre: string
  }
}

interface ColumnsProps {
  onDownload: (id: string) => void
  onView: (id: string) => void
}

export const columns = ({ onDownload, onView }: ColumnsProps): ColumnDef<ReciboPagoWithRelations>[] => [
  {
    accessorKey: 'numeroRecibo',
    header: 'N° Recibo',
    cell: ({ row }) => (
      <div className="font-mono font-bold text-blue-600">
        {row.getValue('numeroRecibo')}
      </div>
    ),
  },
  {
    accessorKey: 'fechaPago',
    header: 'Fecha',
    cell: ({ row }) => {
      const fecha = new Date(row.getValue('fechaPago'))
      return (
        <div className="text-sm">
          <div>{fecha.toLocaleDateString('es-ES')}</div>
          <div className="text-muted-foreground">{fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      )
    },
  },
  {
    accessorKey: 'cliente',
    header: 'Cliente',
    cell: ({ row }) => {
      const cliente = row.getValue('cliente') as ReciboPagoWithRelations['cliente']
      return (
        <div className="text-sm">
          <div className="font-medium">
            {cliente.razonSocial || `${cliente.nombre} ${cliente.apellido || ''}`}
          </div>
          <div className="text-muted-foreground">
            {cliente.dni ? `DNI: ${cliente.dni}` : cliente.ruc ? `RUC: ${cliente.ruc}` : ''}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'concepto',
    header: 'Concepto',
    cell: ({ row }) => (
      <div className="text-sm max-w-xs truncate" title={row.getValue('concepto')}>
        {row.getValue('concepto')}
      </div>
    ),
  },
  {
    accessorKey: 'montoPagado',
    header: 'Monto',
    cell: ({ row }) => (
      <div className="text-right font-bold text-green-600">
        S/ {Number(row.getValue('montoPagado')).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
      </div>
    ),
  },
  {
    accessorKey: 'formaPago',
    header: 'Forma de Pago',
    cell: ({ row }) => {
      const formaPago = row.getValue('formaPago') as FormaPago
      const metodoPago = row.original.metodoPago
      
      const getBadgeVariant = (forma: FormaPago) => {
        switch (forma) {
          case 'EFECTIVO': return 'default'
          case 'TRANSFERENCIA': return 'secondary'
          case 'DEPOSITO': return 'outline'
          case 'CHEQUE': return 'destructive'
          case 'TARJETA_CREDITO': return 'default'
          case 'TARJETA_DEBITO': return 'default'
          case 'YAPE': return 'secondary'
          case 'PLIN': return 'secondary'
          case 'OTRO': return 'secondary'
          default: return 'secondary'
        }
      }

      return (
        <div className="text-sm">
          <Badge variant={getBadgeVariant(formaPago)}>
            {formaPago}
          </Badge>
          {metodoPago && (
            <div className="text-muted-foreground text-xs mt-1">
              {metodoPago}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'vendedor',
    header: 'Vendedor',
    cell: ({ row }) => {
      const vendedor = row.getValue('vendedor') as ReciboPagoWithRelations['vendedor']
      return (
        <div className="text-sm">
          {vendedor.nombre}
        </div>
      )
    },
  },
  {
    accessorKey: 'venta',
    header: 'Venta/Cuota',
    cell: ({ row }) => {
      const venta = row.original.venta
      const cuota = row.original.cuota
      
      if (cuota) {
        return (
          <div className="text-sm">
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Cuota {cuota.numeroCuota}
            </Badge>
            <div className="text-muted-foreground text-xs mt-1">
              Vence: {new Date(cuota.fechaVencimiento).toLocaleDateString('es-ES')}
            </div>
          </div>
        )
      }
      
      if (venta) {
        return (
          <div className="text-sm">
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Venta
            </Badge>
            <div className="text-muted-foreground text-xs mt-1">
              {venta.numeroVenta}
              {venta.lote && ` - Lote ${venta.lote.numero}`}
            </div>
          </div>
        )
      }
      
      return (
        <div className="text-sm text-muted-foreground">
          Otro
        </div>
      )
    },
  },
  {
    accessorKey: 'comprobantePago',
    header: 'Comprobante',
    cell: ({ row }) => {
      const comprobante = row.original.comprobantePago
      
      if (comprobante) {
        return (
          <Badge variant="secondary" className="text-green-600">
            ✓ Adjunto
          </Badge>
        )
      }
      
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Sin adjunto
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(row.original.id)}
          title="Ver PDF"
        >
          <FiEye className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDownload(row.original.id)}
          title="Descargar PDF"
        >
          <FiDownload className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
] 