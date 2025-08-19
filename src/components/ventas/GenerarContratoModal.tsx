'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { FiFileText, FiDownload, FiLoader } from 'react-icons/fi'

interface GenerarContratoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ventaId: string
  ventaTipo: 'LOTE' | 'UNIDAD_CEMENTERIO'
  numeroContrato: string
}

export default function GenerarContratoModal({
  open,
  onOpenChange,
  ventaId,
  ventaTipo,
  numeroContrato
}: GenerarContratoModalProps) {
  const [loading, setLoading] = useState(false)
  const [formato, setFormato] = useState<'pdf' | 'docx'>('pdf')
  const { toast } = useToast()

  const handleGeneratePDF = async () => {
    setLoading(true)
    try {
      const requestData = {
        numeroContrato,
        ventaId,
        ventaTipo,
        formato
      }

      console.log('Datos a enviar:', requestData)

      // Crear o actualizar el contrato
      const contratoResponse = await fetch('/api/contratos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const contratoData = await contratoResponse.json()
      
      if (!contratoResponse.ok) {
        console.error('Error del servidor:', contratoData)
        throw new Error(`Error al crear el contrato: ${contratoData.error || 'Error desconocido'}`)
      }

      // Si el contrato se actualizó o se creó, usar el contrato devuelto
      const contrato = contratoData.contrato || contratoData
      console.log('Contrato procesado:', contrato)

      // Generar el PDF
      const pdfResponse = await fetch(`/api/contratos/${contrato.id}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formato }),
      })

      if (!pdfResponse.ok) {
        const errorData = await pdfResponse.json()
        console.error('Error del servidor PDF:', errorData)
        throw new Error(`Error al generar el PDF: ${errorData.error || 'Error desconocido'}`)
      }

      const pdfData = await pdfResponse.json()
      console.log('Archivo generado:', pdfData)
      
      // Descargar el archivo según el formato
      if (formato === 'docx' && pdfData.docUrl) {
        // Descargar archivo Word
        const downloadResponse = await fetch(`/api/contratos/${contrato.id}/download-docx`)
        if (downloadResponse.ok) {
          const blob = await downloadResponse.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = pdfData.fileName || `contrato_${contrato.numeroContrato}.docx`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      } else if (formato === 'pdf' && pdfData.pdfUrl) {
        // Descargar PDF
        const downloadResponse = await fetch(`/api/contratos/${contrato.id}/download-pdf`)
        if (downloadResponse.ok) {
          const blob = await downloadResponse.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = pdfData.fileName || `contrato_${contrato.numeroContrato}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }

      toast({
        title: 'Contrato generado',
        description: `El contrato se ha generado en formato ${formato.toUpperCase()} y descargado correctamente`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error al generar contrato:', error)
      toast({
        title: 'Error',
        description: 'Error al generar el contrato',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiFileText className="w-5 h-5" />
            Generar Contrato
          </DialogTitle>
          <DialogDescription>
            Se generará un contrato de venta para esta transacción. 
            Puedes elegir entre formato PDF (recomendado para impresión) o Word (.DOCX) para edición.
            El archivo se descargará automáticamente una vez generado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Información del Contrato</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div><strong>Número de Contrato:</strong> {numeroContrato}</div>
              <div><strong>Tipo de Venta:</strong> {ventaTipo === 'LOTE' ? 'Lote' : 'Unidad de Cementerio'}</div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Formato de Salida</h4>
            <div className="space-y-2">
              <label className="text-sm text-green-800 font-medium">Selecciona el formato del contrato:</label>
              <Select value={formato} onValueChange={(value: 'pdf' | 'docx') => setFormato(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">📄 PDF (Recomendado)</SelectItem>
                  <SelectItem value="docx">📝 Word (.DOCX)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-green-700 mt-2">
                {formato === 'pdf' 
                  ? 'PDF optimizado para impresión y distribución digital'
                  : 'Documento Word editable para modificaciones posteriores'
                }
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Importante</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• El contrato incluirá todos los datos de la venta</li>
              <li>• Se generará un PDF profesional con 10 cláusulas detalladas</li>
              <li>• El archivo se descargará automáticamente</li>
              <li>• El contrato quedará registrado en el sistema</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FiDownload className="w-4 h-4 mr-2" />
                Generar Contrato {formato === 'docx' ? '(.DOCX)' : '(.PDF)'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 