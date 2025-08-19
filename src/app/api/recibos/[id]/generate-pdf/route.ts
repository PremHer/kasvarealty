import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import puppeteer from 'puppeteer'

function generateReciboHTML(recibo: any) {
  const fecha = new Date(recibo.fechaPago).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const hora = new Date(recibo.fechaPago).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const montoEnLetras = (monto: number): string => {
    const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
    const especiales = {
      11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
      16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE'
    }

    if (monto === 0) return 'CERO'
    if (monto < 10) return unidades[monto]
    if (monto < 20) return especiales[monto as keyof typeof especiales]
    if (monto < 100) {
      const decena = Math.floor(monto / 10)
      const unidad = monto % 10
      return decenas[decena] + (unidad > 0 ? ' Y ' + unidades[unidad] : '')
    }
    if (monto < 1000) {
      const centena = Math.floor(monto / 100)
      const resto = monto % 100
      return (centena === 1 ? 'CIENTO' : unidades[centena] + 'CIENTOS') + 
             (resto > 0 ? ' ' + montoEnLetras(resto) : '')
    }
    if (monto < 1000000) {
      const miles = Math.floor(monto / 1000)
      const resto = monto % 1000
      return (miles === 1 ? 'MIL' : montoEnLetras(miles) + ' MIL') + 
             (resto > 0 ? ' ' + montoEnLetras(resto) : '')
    }
    return 'MUCHO'
  }

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recibo de Pago - ${recibo.numeroRecibo}</title>
      <style>
        @page {
          size: A4;
          margin: 1cm;
        }
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
        }
        .company-info {
          font-size: 12px;
          color: #666;
          line-height: 1.4;
        }
        .recibo-title {
          text-align: center;
          font-size: 28px;
          font-weight: bold;
          margin: 30px 0;
          color: #1f2937;
        }
        .recibo-number {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 30px;
        }
        .content {
          margin-bottom: 30px;
        }
        .row {
          display: flex;
          margin-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .label {
          font-weight: bold;
          width: 150px;
          color: #374151;
        }
        .value {
          flex: 1;
          color: #1f2937;
        }
        .amount-section {
          text-align: center;
          margin: 30px 0;
          padding: 20px;
          background-color: #f8fafc;
          border: 2px solid #2563eb;
          border-radius: 8px;
        }
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .amount-words {
          font-size: 14px;
          color: #6b7280;
          font-style: italic;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
        }
        .signature-line {
          width: 200px;
          border-top: 1px solid #000;
          margin: 50px auto 10px;
        }
        .signature-label {
          font-size: 12px;
          color: #6b7280;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          color: rgba(37, 99, 235, 0.1);
          z-index: -1;
          pointer-events: none;
        }
      </style>
    </head>
    <body>
      <div class="watermark">PAGADO</div>
      
      <div class="header">
        <div class="company-name">${recibo.empresaDesarrolladora.nombre}</div>
        <div class="company-info">
          RUC: ${recibo.empresaDesarrolladora.ruc}<br>
          ${recibo.empresaDesarrolladora.direccion}<br>
          ${recibo.empresaDesarrolladora.representanteLegal ? 
            `Representante Legal: ${recibo.empresaDesarrolladora.representanteLegal.nombre}` : 
            'Representante Legal: No especificado'
          }
        </div>
      </div>

      <div class="recibo-title">RECIBO DE PAGO</div>
      <div class="recibo-number">N° ${recibo.numeroRecibo}</div>

      <div class="content">
        <div class="row">
          <div class="label">Fecha:</div>
          <div class="value">${fecha} - ${hora}</div>
        </div>
        
        <div class="row">
          <div class="label">Cliente:</div>
          <div class="value">
            ${recibo.cliente.razonSocial || `${recibo.cliente.nombre} ${recibo.cliente.apellido || ''}`}
            ${recibo.cliente.dni ? ` - DNI: ${recibo.cliente.dni}` : ''}
            ${recibo.cliente.ruc ? ` - RUC: ${recibo.cliente.ruc}` : ''}
          </div>
        </div>

        ${recibo.venta ? `
        <div class="row">
          <div class="label">Venta:</div>
          <div class="value">
            ${recibo.venta.numeroVenta} - ${recibo.venta.lote?.numero || 'N/A'}
            ${recibo.venta.proyecto ? ` (${recibo.venta.proyecto.nombre})` : ''}
          </div>
        </div>
        ` : ''}

        ${recibo.cuota ? `
        <div class="row">
          <div class="label">Cuota:</div>
          <div class="value">
            Cuota ${recibo.cuota.numeroCuota} - Vence: ${new Date(recibo.cuota.fechaVencimiento).toLocaleDateString('es-ES')}
          </div>
        </div>
        ` : ''}

        <div class="row">
          <div class="label">Concepto:</div>
          <div class="value">${recibo.concepto}</div>
        </div>

        <div class="row">
          <div class="label">Forma de Pago:</div>
          <div class="value">${recibo.formaPago}${recibo.metodoPago ? ` - ${recibo.metodoPago}` : ''}</div>
        </div>

        <div class="row">
          <div class="label">Vendedor:</div>
          <div class="value">${recibo.vendedor.nombre}</div>
        </div>
      </div>

      <div class="amount-section">
        <div class="amount">S/ ${recibo.montoPagado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
        <div class="amount-words">${montoEnLetras(Math.floor(recibo.montoPagado))} Y ${String(recibo.montoPagado).split('.')[1]?.padEnd(2, '0') || '00'} /100 SOLES</div>
      </div>

      ${recibo.observaciones ? `
      <div class="content">
        <div class="row">
          <div class="label">Observaciones:</div>
          <div class="value">${recibo.observaciones}</div>
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <div class="signature-line"></div>
        <div class="signature-label">Firma y Sello</div>
      </div>
    </body>
    </html>
  `
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el recibo con todas las relaciones
    const recibo = await prisma.reciboPago.findUnique({
      where: { id: params.id },
      include: {
        empresaDesarrolladora: {
          include: {
            representanteLegal: true
          }
        },
        venta: {
          include: {
            lote: true,
            proyecto: true
          }
        },
        cuota: true,
        cliente: true,
        vendedor: true,
        comprobantePago: true,
        creadoPorUsuario: true,
      }
    })

    if (!recibo) {
      return NextResponse.json({ error: 'Recibo no encontrado' }, { status: 404 })
    }

    // Generar HTML del recibo
    const html = generateReciboHTML(recibo)

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    })

    await browser.close()

    // Devolver el PDF
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="recibo-${recibo.numeroRecibo}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error al generar PDF del recibo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 