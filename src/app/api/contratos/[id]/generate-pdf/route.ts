import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer'
import { generateContractDOC } from '@/lib/contract-generator'
import { Packer } from 'docx'
import fs from 'fs'
import path from 'path'
import { format } from 'date-fns'

const CONTRATOS_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'GERENTE_GENERAL',
  'SALES_MANAGER',
  'SALES_REP',
  'SALES_ASSISTANT',
  'PROJECT_MANAGER',
  'FINANCE_MANAGER'
]

// POST /api/contratos/[id]/generate-pdf - Generar PDF del contrato
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!CONTRATOS_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para generar PDFs' }, { status: 403 })
    }

    // Obtener el tipo de formato solicitado (opcional)
    let formato = 'pdf' // formato por defecto
    
    try {
      const body = await request.json()
      formato = body?.formato || 'pdf'
    } catch (error) {
      // Si no hay body o hay error al parsear, usar formato por defecto
      console.log('No se pudo parsear el body del request, usando formato por defecto:', formato)
    }

    console.log('Generando contrato en formato:', formato, 'para contrato:', params.id)

    const contrato = await prisma.contrato.findUnique({
      where: { id: params.id },
      include: {
        ventaLote: {
          select: {
            id: true,
            precioVenta: true,
            tipoVenta: true,
            montoInicial: true,
            numeroOperacion: true,
            fechaPrimeraCuota: true,
            frecuenciaCuota: true,
            cliente: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                dni: true,
                estadoCivil: true,
                sexo: true,
                direcciones: true
              }
            },
            lote: {
              select: {
                id: true,
                numero: true,
                area: true,
                dimensionFrente: true,
                dimensionFondo: true,
                dimensionIzquierda: true,
                dimensionDerecha: true,
                perimetro: true,
                manzana: {
                  include: {
                    proyecto: {
                      include: {
                        empresaDesarrolladora: {
                          include: {
                            representanteLegal: true
                          }
                        },
                        caracteristicas: {
                          where: { activa: true },
                          orderBy: { orden: 'asc' }
                        }
                      }
                    }
                  }
                }
              }
            },
            vendedor: true,
            clientes: {
              include: {
                cliente: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    dni: true,
                    estadoCivil: true,
                    sexo: true,
                    direcciones: true
                  }
                }
              }
            },
            cuotas: {
              orderBy: { numeroCuota: 'asc' }
            }
          }
        },
        ventaUnidadCementerio: {
          select: {
            id: true,
            precioVenta: true,
            tipoVenta: true,
            montoInicial: true,
            numeroOperacion: true,
            fechaPrimeraCuota: true,
            frecuenciaCuota: true,
            cliente: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                dni: true,
                estadoCivil: true,
                sexo: true,
                direcciones: true
              }
            },
            unidadCementerio: {
              select: {
                id: true,
                codigo: true,
                tipoUnidad: true
              }
            },
            pabellon: {
              include: {
                                                        proyecto: {
                      include: {
                        empresaDesarrolladora: {
                  include: {
                    representanteLegal: true
                  }
                },
                    caracteristicas: {
                      where: { activa: true },
                      orderBy: { orden: 'asc' }
                    }
                  }
                }
              }
            },
            vendedor: true,
            clientes: {
              include: {
                cliente: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    dni: true,
                    estadoCivil: true,
                    sexo: true,
                    direcciones: true
                  }
                }
              }
            },
            cuotas: {
              orderBy: { numeroCuota: 'asc' }
            }
          }
        }
      }
    })

    if (!contrato) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    console.log('🔍 Debug - Contrato encontrado:', contrato.numeroContrato)
    console.log('🔍 Debug - Tipo de venta:', contrato.ventaLote ? 'LOTE' : 'UNIDAD_CEMENTERIO')

    const venta = contrato.ventaLote || contrato.ventaUnidadCementerio
    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    console.log('🔍 Debug - Número de operación:', venta.numeroOperacion)
    console.log('🔍 Debug - Cliente principal:', venta.cliente?.nombre, venta.cliente?.apellido)
    console.log('🔍 Debug - Direcciones del cliente:', venta.cliente?.direcciones)
    
    // Debug de datos críticos
    const empresa = venta.lote?.manzana?.proyecto?.empresaDesarrolladora || venta.unidadCementerio?.manzana?.proyecto?.empresaDesarrolladora
    const representanteLegal = empresa?.representanteLegal
    const proyecto = venta.lote?.manzana?.proyecto || venta.unidadCementerio?.manzana?.proyecto
    
    console.log('🔍 Debug - Empresa:', {
      nombre: empresa?.nombre,
      ruc: empresa?.ruc,
      direccion: empresa?.direccion,
      banco: empresa?.bancoPrincipal,
      cuenta: empresa?.numeroCuenta
    })
    
    console.log('🔍 Debug - Representante Legal:', {
      nombre: representanteLegal?.nombre,
      dni: representanteLegal?.dni,
      estadoCivil: representanteLegal?.estadoCivil,
      profesion: representanteLegal?.profesion,
      direccion: representanteLegal?.direccion,
      distrito: representanteLegal?.distrito,
      provincia: representanteLegal?.provincia,
      departamento: representanteLegal?.departamento
    })
    
    console.log('🔍 Debug - Proyecto:', {
      nombre: proyecto?.nombre,
      distrito: proyecto?.distrito,
      provincia: proyecto?.provincia,
      departamento: proyecto?.departamento,
      plazoIndependizacion: proyecto?.plazoIndependizacion
    })
    
    console.log('🔍 Debug - Cliente:', {
      nombre: venta.cliente?.nombre,
      apellido: venta.cliente?.apellido,
      dni: venta.cliente?.dni,
      estadoCivil: venta.cliente?.estadoCivil,
      direcciones: venta.cliente?.direcciones
    })

    if (formato === 'docx') {
      // Generar documento Word
      console.log('🔍 Debug - Generando documento Word...')
      console.log('🔍 Debug - Llamando a generateContractDOC...')
      
      const doc = generateContractDOC(contrato)
      console.log('🔍 Debug - Documento DOC generado exitosamente')
      const buffer = await Packer.toBuffer(doc)
      
      // Crear directorio si no existe
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'contratos')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      // Generar nombre de archivo
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
      const fileName = `contrato_${contrato.numeroContrato}_${timestamp}.docx`
      const filePath = path.join(uploadsDir, fileName)

      // Guardar archivo
      fs.writeFileSync(filePath, buffer)
      
      console.log('🔍 Debug - Documento Word generado:', fileName)

      return NextResponse.json({
        success: true,
        message: 'Contrato en Word generado correctamente',
        docUrl: `/uploads/contratos/${fileName}`,
        fileName: fileName
      })
    } else {
      // Generar PDF (formato por defecto)
      console.log('🔍 Debug - Generando PDF...')
      
      const html = generateContractHTML(contrato)
      
      // Crear directorio si no existe
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'contratos')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      // Generar nombre de archivo
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
      const fileName = `contrato_${contrato.numeroContrato}_${timestamp}.pdf`
      const filePath = path.join(uploadsDir, fileName)

      // Generar PDF con Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      
                await page.pdf({
            path: filePath,
            format: 'A4',
            margin: {
              top: '20mm',
              right: '25mm',
              bottom: '20mm',
              left: '25mm'
            },
            printBackground: true
          })

      await browser.close()
      
      console.log('🔍 Debug - PDF generado:', fileName)

      return NextResponse.json({
        success: true,
        message: 'PDF generado correctamente',
        pdfUrl: `/uploads/contratos/${fileName}`,
        fileName: fileName
      })
    }

  } catch (error) {
    console.error('Error generando contrato:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para determinar el género basado en el campo sexo del cliente
function determinarGenero(cliente: any): 'masculino' | 'femenino' {
  if (!cliente) return 'masculino'
  
  // Usar el campo sexo del cliente si está disponible
  if (cliente.sexo) {
    return cliente.sexo === 'FEMENINO' ? 'femenino' : 'masculino'
  }
  
  // Fallback: usar el nombre si no hay campo sexo (para compatibilidad)
  if (cliente.nombre) {
    const nombresFemeninos = [
      'maria', 'ana', 'lucia', 'carmen', 'rosa', 'julia', 'isabel', 'patricia',
      'monica', 'laura', 'claudia', 'sandra', 'elena', 'beatriz', 'silvia',
      'adriana', 'vanessa', 'diana', 'natalia', 'gabriela', 'andrea', 'paula',
      'carolina', 'valentina', 'daniela', 'camila', 'sofia', 'isabella',
      'yocely', 'yocelyn', 'yocelina', 'elma'
    ]
    
    const nombreLower = cliente.nombre.toLowerCase()
    return nombresFemeninos.some(nombreFem => nombreLower.includes(nombreFem)) ? 'femenino' : 'masculino'
  }
  
  return 'masculino'
}

// Función para generar texto de compradores
function generarTextoCompradores(clientesPrincipales: any[], esMultipleCompradores: boolean): string {
  if (clientesPrincipales.length === 0) return 'PLACEHOLDER_COMPRADOR'
  
  if (clientesPrincipales.length === 1) {
    const cliente = clientesPrincipales[0]
    const genero = determinarGenero(cliente)
    const tratamiento = genero === 'femenino' ? 'la señora' : 'el señor'
    const denominacion = genero === 'femenino' ? 'LA COMPRADORA' : 'EL COMPRADOR'
    const direccionCliente = cliente?.direcciones?.[0]
    
    return `${tratamiento} <span class="highlight">${cliente.nombre} ${cliente.apellido}</span> de nacionalidad peruana, estado civil <span class="highlight">${cliente.estadoCivil || 'PLACEHOLDER_ESTADO_CIVIL'}</span>, con DNI N° <span class="highlight">${cliente.dni || 'PLACEHOLDER_DNI'}</span>, domiciliado en ${direccionCliente ? direccionCliente.direccion : 'PLACEHOLDER_DIRECCION_CLIENTE'}, en el distrito ${direccionCliente?.distrito || 'PLACEHOLDER_DISTRITO_CLIENTE'}, provincia de ${direccionCliente?.provincia || 'PLACEHOLDER_PROVINCIA_CLIENTE'} y departamento de ${direccionCliente?.departamento || 'PLACEHOLDER_DEPARTAMENTO_CLIENTE'}, a quien se le llamará <span class="clause-number">"${denominacion}"</span>`
  }
  
  // Múltiples compradores
  const textosCompradores = clientesPrincipales.map((cliente) => {
    const genero = determinarGenero(cliente)
    const tratamiento = genero === 'femenino' ? 'la señora' : 'el señor'
    const direccionCliente = cliente?.direcciones?.[0]
    
    return `${tratamiento} <span class="highlight">${cliente.nombre} ${cliente.apellido}</span> de nacionalidad peruana, estado civil <span class="highlight">${cliente.estadoCivil || 'PLACEHOLDER_ESTADO_CIVIL'}</span>, con DNI N° <span class="highlight">${cliente.dni || 'PLACEHOLDER_DNI'}</span>, domiciliado en ${direccionCliente ? direccionCliente.direccion : 'PLACEHOLDER_DIRECCION_CLIENTE'}, en el distrito ${direccionCliente?.distrito || 'PLACEHOLDER_DISTRITO_CLIENTE'}, provincia de ${direccionCliente?.provincia || 'PLACEHOLDER_PROVINCIA_CLIENTE'} y departamento de ${direccionCliente?.departamento || 'PLACEHOLDER_DEPARTAMENTO_CLIENTE'}`
  })
  
  return textosCompradores.join(' y ') + ', a quienes en adelante se les denominará <span class="clause-number">"LOS COMPRADORES"</span>'
}

// Función para generar tabla de cuotas
function generarTablaCuotas(venta: any): string {
  if (!venta.cuotas || venta.cuotas.length === 0) {
    return '<p>No hay cuotas configuradas</p>'
  }

  let tablaHTML = `
    <table class="cuotas-table">
      <thead>
        <tr>
          <th>N°</th>
          <th>Fecha de Pago</th>
          <th>Monto</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
  `

  venta.cuotas.forEach((cuota: any) => {
    const fechaPago = cuota.fechaVencimiento ? formatDate(cuota.fechaVencimiento) : 'PENDIENTE'
    const monto = formatNumber(cuota.monto)
    const estado = cuota.estado || 'PENDIENTE'
    const estadoClass = estado === 'PAGADA' ? 'pagada' : 'pendiente'
    
    tablaHTML += `
      <tr>
        <td>${cuota.numeroCuota}</td>
        <td>${fechaPago}</td>
        <td>S/ ${monto}</td>
        <td class="${estadoClass}">${estado}</td>
      </tr>
    `
  })

  tablaHTML += `
      </tbody>
    </table>
  `

  return tablaHTML
}

// Función para formatear números
function formatNumber(num: number): string {
  return num ? num.toLocaleString('es-PE') : '0'
}

// Función para formatear fechas
function formatDate(date: Date | string): string {
  if (!date) return 'PLACEHOLDER_FECHA'
  const d = new Date(date)
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Función para generar el HTML del contrato
function generateContractHTML(contrato: any): string {
  const venta = contrato.ventaLote || contrato.ventaUnidadCementerio
  if (!venta) {
    throw new Error('Contrato sin venta asociada')
  }

  const empresa = venta.lote?.manzana?.proyecto?.empresaDesarrolladora || venta.unidadCementerio?.manzana?.proyecto?.empresaDesarrolladora
  const representanteLegal = empresa?.representanteLegal
  const proyecto = venta.lote?.manzana?.proyecto || venta.unidadCementerio?.manzana?.proyecto
  const producto = venta.lote || venta.unidadCementerio
  const clientesPrincipales = [venta.cliente, ...(venta.clientes?.map((c: any) => c.cliente) || [])].filter(Boolean)
  const esMultipleCompradores = clientesPrincipales.length > 1

  if (!representanteLegal) {
    throw new Error('Información de representante legal no disponible')
  }

  const bankInfo = getBankInfo()
  const textoCompradores = generarTextoCompradores(clientesPrincipales, esMultipleCompradores)
  const esMultipleCompradores2 = clientesPrincipales.length > 1

  // Debug: Verificar número de operación
  console.log('🔍 Debug HTML - Número de operación:', venta.numeroOperacion)
  console.log('🔍 Debug HTML - Tipo de venta:', venta.tipoVenta)
  console.log('🔍 Debug HTML - Monto inicial:', venta.montoInicial)

  // Determinar género del representante legal
  const generoRepresentante = determinarGenero(representanteLegal)

  // Función auxiliar para texto seguro
  const safeText = (text: string) => text ? text.replace(/[<>]/g, '') : ''

  // Función para obtener información bancaria
  function getBankInfo() {
    return {
      banco: empresa?.bancoPrincipal || 'PLACEHOLDER_BANCO',
      numeroCuenta: empresa?.numeroCuenta || 'PLACEHOLDER_NUMERO_CUENTA'
    }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contrato de Compra Venta</title>
      <style>
        body {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
          margin: 0;
          padding: 40px 60px;
          color: #333;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .title {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 10px;
          color: #000;
        }
        
        .clause-number {
          font-weight: bold;
          color: #000;
          font-size: 14pt;
        }
        
        .highlight {
          font-weight: bold;
        }
        
        .cuotas-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 10pt;
        }
        
        .cuotas-table th,
        .cuotas-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        
        .cuotas-table th {
          background-color: #f5f5f5;
          color: #000;
          font-weight: bold;
          border: 1px solid #000;
        }
        
        .cuotas-table .pagada {
          background-color: #f0f0f0;
          color: #000;
        }
        
        .cuotas-table .pendiente {
          background-color: #f0f0f0;
          color: #000;
        }
        
        .signature-section {
          margin-top: 40px;
          text-align: center;
        }
        
        .signature-section {
          margin-top: 40px;
          text-align: center;
        }
        
        .signature-line {
          border-bottom: 1px solid #000;
          width: 200px;
          margin: 20px auto;
          height: 1px;
        }
        
        .signature-info {
          margin: 10px 0;
          font-size: 11pt;
        }
        
        .signature-name {
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .signature-details {
          font-size: 10pt;
          color: #333;
          line-height: 1.4;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10pt;
          color: #000;
        }
        
        p {
          margin: 10px 0;
          text-align: justify;
        }
        
        .section {
          margin: 30px 0;
        }
        
        .section p {
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">CONTRATO DE COMPRA VENTA</div>
      </div>

      <div class="section">
        <p>
          Conste por el presente contrato de compra y venta de ${contrato.ventaLote ? 'lote de terreno' : 'unidad de cementerio'}, que celebran de una parte; 
          <span class="highlight">${safeText(empresa?.nombre || 'PLACEHOLDER_NOMBRE_EMPRESA')}</span>, 
          empresa constituida legalmente en el Perú, con RUC N° 
          <span class="highlight">${safeText(empresa?.ruc || 'PLACEHOLDER_RUC_EMPRESA')}</span>, 
          con domicilio en 
          <span class="highlight">${safeText(empresa?.direccion || 'PLACEHOLDER_DIRECCION_EMPRESA')}</span>, 
          representada legalmente por ${generoRepresentante === 'femenino' ? 'la señora' : 'el señor'} 
          <span class="highlight">${safeText(representanteLegal?.nombre)}</span>, 
          de nacionalidad peruana, estado civil 
          <span class="highlight">${representanteLegal?.estadoCivil || 'PLACEHOLDER_ESTADO_CIVIL'}</span>, 
          <span class="highlight">${representanteLegal?.profesion || 'PLACEHOLDER_PROFESION'}</span>, 
          identificado con DNI N° 
          <span class="highlight">${representanteLegal?.dni || 'PLACEHOLDER_DNI_REPRESENTANTE'}</span>, 
          con domicilio en 
          <span class="highlight">${representanteLegal?.direccion || 'PLACEHOLDER_DIRECCION_REPRESENTANTE'}</span>, 
          en el distrito 
          <span class="highlight">${representanteLegal?.distrito || 'PLACEHOLDER_DISTRITO_REPRESENTANTE'}</span>, 
          provincia de 
          <span class="highlight">${representanteLegal?.provincia || 'PLACEHOLDER_PROVINCIA_REPRESENTANTE'}</span> 
          y departamento de 
          <span class="highlight">${representanteLegal?.departamento || 'PLACEHOLDER_DEPARTAMENTO_REPRESENTANTE'}</span>, 
          a quien en adelante se le denominará 
          <span class="clause-number">"${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}"</span> 
          y de la otra parte ${textoCompradores}, y suscriben el presente contrato en los términos y condiciones siguientes:
        </p>
      </div>

      <div class="section">
        <p class="clause-number">PRIMERA</p>
        <p>
          <span class="clause-number">"${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}"</span> 
          es propietario del terreno denominado lotización 
          <span class="highlight">"${safeText(proyecto.nombre)}"</span> 
          ubicado en el distrito de 
          <span class="highlight">${proyecto?.distrito || 'PLACEHOLDER_DISTRITO_PROYECTO'}</span>, 
          provincia de 
          <span class="highlight">${proyecto?.provincia || 'PLACEHOLDER_PROVINCIA_PROYECTO'}</span> 
          y departamento de 
          <span class="highlight">${proyecto?.departamento || 'PLACEHOLDER_DEPARTAMENTO_PROYECTO'}</span>.
        </p>
      </div>

      <div class="section">
        <p class="clause-number">SEGUNDA</p>
        <p>
          <span class="clause-number">"${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}"</span> 
          declara el propósito de desarrollar el proyecto con la finalidad de independización de lotes. El proyecto contará dentro de su conformación con las siguientes características:
        </p>
        ${proyecto?.caracteristicas && proyecto.caracteristicas.length > 0 
          ? proyecto.caracteristicas.map((car: any) => 
              `<p>● <span class="highlight">${safeText(car.nombre)}</span></p>`
            ).join('')
          : `
            <p>● <span class="highlight">Habilitación para alumbrado público</span></p>
            <p>● <span class="highlight">Red de distribución de agua potable</span></p>
            <p>● <span class="highlight">Vías de acceso afirmadas</span></p>
            <p>● <span class="highlight">Título de propiedad para cada lote independizado</span></p>
          `
        }
      </div>

      <div class="section">
        <p class="clause-number">TERCERA</p>
        <p>
          Por el presente documento 
          <span class="clause-number">"${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}"</span> 
          otorga a favor de ${esMultipleCompradores2 ? '"LOS COMPRADORES"' : '"EL COMPRADOR"'} 
          la venta real del bien inmueble denominado:
        </p>
        <p>
          <strong>Lote N° ${safeText(producto.numero)} de la manzana "${producto.manzana?.codigo || 'PLACEHOLDER_CODIGO_MANZANA'}" tiene un área de ${producto.area || 'PLACEHOLDER_AREA'} m²</strong>
        </p>
      </div>

      <div class="section">
        <p class="clause-number">CUARTA</p>
        <p>
          Las partes, de común acuerdo han establecido como precio del lote de terreno mencionado en la cláusula que precede, en la suma de S/. ${formatNumber(venta.precioVenta)} (${formatNumber(venta.precioVenta)} soles).
        </p>
        ${venta.montoInicial && venta.montoInicial > 0 ? `
          <p>
            El pago de la cuota inicial de S/. ${formatNumber(venta.montoInicial)} (${formatNumber(venta.montoInicial)} soles) se hizo mediante depósito en la cuenta corriente de 
            <span class="clause-number">"${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}"</span> 
            en el banco ${bankInfo.banco} del Perú con el NRO. de cuenta N° ${bankInfo.numeroCuenta}
            ${venta.numeroOperacion ? ` con número de operación bancaria N° <span class="highlight">${venta.numeroOperacion}</span>` : ''}.
          </p>
        ` : ''}
        ${venta.tipoVenta === 'CUOTAS' ? `
          <p>
            El saldo de S/. ${formatNumber(venta.precioVenta - (venta.montoInicial || 0))} (${formatNumber(venta.precioVenta - (venta.montoInicial || 0))} soles) se cancelará en ${venta.cuotas?.length || 0} cuotas, según el siguiente cronograma:
          </p>
          ${generarTablaCuotas(venta)}
        ` : `
          <p>
            El pago total de S/. ${formatNumber(venta.precioVenta)} (${formatNumber(venta.precioVenta)} soles) se realizó mediante depósito en la cuenta corriente de <span class="clause-number">"${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}"</span> en el banco ${bankInfo.banco} del Perú con el NRO. de cuenta N° ${bankInfo.numeroCuenta}${venta.numeroOperacion ? ` con número de operación bancaria N° <span class="highlight">${venta.numeroOperacion}</span>` : ''}.
          </p>
        `}
      </div>

      <div class="section">
        <p class="clause-number">QUINTA</p>
        <p>
          Las partidas del registro de la propiedad inmueble se abrirán como consecuencia de la independización de las unidades inmobiliarias. En consecuencia, al producirse la independización y obtenida las partidas registrales independientes, 
          <span class="clause-number">"${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}"</span> 
          se compromete a firmar la escritura pública definitiva de compra y venta a favor de ${esMultipleCompradores2 ? '"LOS COMPRADORES"' : '"EL COMPRADOR"'} ante notario público.
        </p>
      </div>

      <div class="section">
        <p class="clause-number">SEXTA</p>
        <p>
          La venta del terreno comprende todos los usos, costumbres, servidumbres, servicios, aires y en general todo cuanto de hecho o por derecho le corresponda o pudiera corresponder sin reserva ni limitación alguna. A la firma de la presente se le suministra la posesión inmediata a ${esMultipleCompradores2 ? '"LOS COMPRADORES"' : '"EL COMPRADOR"'}.
        </p>
      </div>

      <div class="section">
        <p class="clause-number">SÉPTIMA</p>
        <p>
          ${esMultipleCompradores2 ? '"LOS COMPRADORES"' : '"EL COMPRADOR"'} se compromete al cumplimiento del reglamento interno de 
          <span class="highlight">"${safeText(proyecto.nombre)}"</span> 
          el que será aprobado por la junta de propietarios. Para contribuir al ordenamiento y mejora del entorno de la lotización.
        </p>
      </div>

      <div class="section">
        <p class="clause-number">OCTAVA</p>
        <p>
          La fecha prevista para la independización de las unidades inmobiliarias materia del presente contrato, se prorrogará automáticamente cuando medien causas no imputables a las partes que impidan el cumplimiento cabal de esta prestación. No obstante, el compromiso es hacerlo en el plazo de 
          <span class="highlight">${proyecto?.plazoIndependizacion || 'PLACEHOLDER_PLAZO_INDEPENDIZACION'}</span> 
          meses a partir de la suscripción del presente contrato.
        </p>
      </div>

      <div class="section">
        <p class="clause-number">NOVENA</p>
        <p>
          ${esMultipleCompradores2 ? '"LOS COMPRADORES"' : '"EL COMPRADOR"'} declara que es condición esencial en su manifestación de voluntad la celebración del presente contrato y posterior contrato definitivo de compraventa, la adquisición del bien inmueble indicado en el numeral de la presente cláusula.
        </p>
      </div>

      ${venta.tipoVenta === 'CUOTAS' ? `
      <div class="section">
        <p class="clause-number">DÉCIMA</p>
        <p>
          En caso de que ${esMultipleCompradores2 ? 'LOS COMPRADORES' : 'EL COMPRADOR'} incumpla con el pago de tres (3) o más cuotas consecutivas, o manifieste por escrito su decisión de desistir de la compra, ${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'} podrá dar por terminado el presente contrato unilateralmente, sin obligación de devolver las sumas de dinero ya pagadas por ${esMultipleCompradores2 ? 'LOS COMPRADORES' : 'EL COMPRADOR'}. Estas sumas se considerarán como compensación por los gastos administrativos, gestión de venta y daños derivados de la rescisión, los cuales son asumidos exclusivamente por ${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}.
        </p>
      </div>
      ` : ''}

      <div class="section">
        <p class="clause-number">${venta.tipoVenta === 'CUOTAS' ? 'DÉCIMO PRIMERO' : 'DÉCIMA'}</p>
        <p>
          Para todos los efectos de este contrato, los otorgantes se someten a la jurisdicción de los jueces y tribunales de la provincia de 
          <span class="highlight">${proyecto?.provincia || 'PLACEHOLDER_PROVINCIA_PROYECTO'}</span>.
        </p>
      </div>

      <div class="section">
        <p class="clause-number">${venta.tipoVenta === 'CUOTAS' ? 'DÉCIMO SEGUNDO' : 'UNDÉCIMA'}</p>
        <p>
          En todo lo no previsto por las partes en el presente contrato, ambas partes se someten a lo establecido por las normas del código civil y demás del sistema jurídico que resulten aplicables.
        </p>
      </div>

      <div class="signature-section">
        <p>En señal de conformidad y aceptación de las cláusulas del presente contrato, ambas partes firmamos.</p>
        
        <p class="signature-info">
          <span class="highlight">${formatDate(contrato.fechaContrato)} del ${new Date(contrato.fechaContrato).getFullYear()}</span>
        </p>
        
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
          <!-- Vendedor -->
          <div style="text-align: center; flex: 1;">
            <div class="signature-line"></div>
            <div class="signature-name">${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}</div>
            <div class="signature-details">
              <strong>${safeText(empresa?.nombre)}</strong><br>
              Representante Legal<br>
              ${generoRepresentante === 'femenino' ? 'Sra.' : 'Sr.'} ${safeText(representanteLegal?.nombre)}<br>
              DNI: ${representanteLegal?.dni || 'N/A'}
            </div>
          </div>
          
          <!-- Comprador(es) -->
          <div style="text-align: center; flex: 1;">
            <div class="signature-line"></div>
            <div class="signature-name">${esMultipleCompradores2 ? 'LOS COMPRADORES' : 'EL COMPRADOR'}</div>
            <div class="signature-details">
              ${clientesPrincipales.map((c: any) => {
                const genero = determinarGenero(c?.nombre || '')
                const tratamiento = genero === 'femenino' ? 'Sra.' : 'Sr.'
                return `${tratamiento} ${safeText(c.nombre)} ${safeText(c.apellido)}<br>DNI: ${c.dni || 'N/A'}`
              }).join('<br><br>')}
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Documento generado automáticamente por el sistema de gestión inmobiliaria</p>
        <p>Fecha de generación: ${formatDate(new Date())}</p>
      </div>
    </body>
    </html>
  `

  return html
}
