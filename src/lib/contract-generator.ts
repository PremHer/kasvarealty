import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx'

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
    
    return `${tratamiento} ${cliente.nombre} ${cliente.apellido} de nacionalidad peruana, estado civil ${cliente.estadoCivil || 'PLACEHOLDER_ESTADO_CIVIL'}, con DNI N° ${cliente.dni || 'PLACEHOLDER_DNI'}, domiciliado en ${direccionCliente ? direccionCliente.direccion : 'PLACEHOLDER_DIRECCION_CLIENTE'}, en el distrito ${direccionCliente?.distrito || 'PLACEHOLDER_DISTRITO_CLIENTE'}, provincia de ${direccionCliente?.provincia || 'PLACEHOLDER_PROVINCIA_CLIENTE'} y departamento de ${direccionCliente?.departamento || 'PLACEHOLDER_DEPARTAMENTO_CLIENTE'}, a quien se le llamará "${denominacion}"`
  }
  
  // Múltiples compradores
  const textosCompradores = clientesPrincipales.map((cliente) => {
    const genero = determinarGenero(cliente)
    const tratamiento = genero === 'femenino' ? 'la señora' : 'el señor'
    const direccionCliente = cliente?.direcciones?.[0]
    
    return `${tratamiento} ${cliente.nombre} ${cliente.apellido} de nacionalidad peruana, estado civil ${cliente.estadoCivil || 'PLACEHOLDER_ESTADO_CIVIL'}, con DNI N° ${cliente.dni || 'PLACEHOLDER_DNI'}, domiciliado en ${direccionCliente ? direccionCliente.direccion : 'PLACEHOLDER_DIRECCION_CLIENTE'}, en el distrito ${direccionCliente?.distrito || 'PLACEHOLDER_DISTRITO_CLIENTE'}, provincia de ${direccionCliente?.provincia || 'PLACEHOLDER_PROVINCIA_CLIENTE'} y departamento de ${direccionCliente?.departamento || 'PLACEHOLDER_DEPARTAMENTO_CLIENTE'}`
  })
  
  return textosCompradores.join(' y ') + ', a quienes en adelante se les denominará "LOS COMPRADORES"'
}

// Función para generar tabla de cuotas
function generarTablaCuotas(venta: any) {
  if (!venta.cuotas || venta.cuotas.length === 0) {
    return new Paragraph({ text: 'No hay cuotas configuradas' })
  }

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Header
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: 'N°', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: 'Fecha de Pago', alignment: AlignmentType.CENTER })], width: { size: 35, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: 'Monto', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: 'Estado', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } })
        ],
        tableHeader: true
      }),
      // Filas de cuotas
      ...venta.cuotas.map((cuota: any, index: number) => 
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: cuota.numeroCuota.toString(), alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ text: formatDate(cuota.fechaVencimiento) })] }),
            new TableCell({ children: [new Paragraph({ text: `S/ ${formatNumber(cuota.monto)}` })] }),
            new TableCell({ 
              children: [new Paragraph({ 
                text: cuota.estado || 'PENDIENTE',
                alignment: AlignmentType.CENTER
              })],
              shading: { fill: cuota.estado === 'PAGADA' ? '90EE90' : 'FFE4E1' }
            })
          ]
        })
      )
    ]
  })

  return table
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

// Función para generar el contrato en formato Word (.docx)
export function generateContractDOC(contrato: any) {
  console.log('🔍 Debug DOCX - Iniciando generación de documento Word')
  
  // Extraer datos del contrato (misma lógica que generateContractHTML)
  const venta = contrato.ventaLote || contrato.ventaUnidadCementerio
  if (!venta) {
    throw new Error('Contrato sin venta asociada')
  }

  const empresa = venta.lote?.manzana?.proyecto?.empresaDesarrolladora || venta.pabellon?.proyecto?.empresaDesarrolladora
  const representanteLegal = empresa?.representanteLegal
  const proyecto = venta.lote?.manzana?.proyecto || venta.pabellon?.proyecto
  const producto = venta.lote || venta.unidadCementerio
  const clientesPrincipales = [venta.cliente, ...(venta.clientes?.map((c: any) => c.cliente) || [])].filter(Boolean)
  const esMultipleCompradores = clientesPrincipales.length > 1

  // Determinar género del representante legal
  const generoRepresentante = determinarGenero(representanteLegal)

  // Función auxiliar para texto seguro
  const safeText = (text: string) => text ? text.replace(/[<>]/g, '') : ''

  // Debug: Verificar número de operación
  console.log('🔍 Debug DOCX - Número de operación:', venta.numeroOperacion)
  console.log('🔍 Debug DOCX - Tipo de venta:', venta.tipoVenta)
  console.log('🔍 Debug DOCX - Monto inicial:', venta.montoInicial)
  console.log('🔍 Debug DOCX - Precio venta:', venta.precioVenta)

  // Función para obtener información bancaria
  function getBankInfo() {
    return {
      banco: empresa?.bancoPrincipal || 'PLACEHOLDER_BANCO',
      numeroCuenta: empresa?.numeroCuenta || 'PLACEHOLDER_NUMERO_CUENTA'
    }
  }

  const bankInfo = getBankInfo()
  const textoCompradores = generarTextoCompradores(clientesPrincipales, esMultipleCompradores)

  // Generar el documento Word
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 2880, bottom: 1440, left: 2880 } // 2 inch margins on sides
        }
      },
      children: [
        // Título principal
        new Paragraph({
          text: "CONTRATO DE COMPRA VENTA",
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 600 }
        }),

        // Introducción
        new Paragraph({
          children: [
            new TextRun({
              text: `Conste por el presente contrato de compra y venta de ${contrato.ventaLote ? 'lote de terreno' : 'unidad de cementerio'}, que celebran de una parte; `,
            }),
            new TextRun({
              text: `${safeText(empresa?.nombre || 'PLACEHOLDER_NOMBRE_EMPRESA')}`,
              bold: true
            }),
            new TextRun({
              text: `, empresa constituida legalmente en el Perú, con RUC N° `,
            }),
            new TextRun({
              text: `${safeText(empresa?.ruc || 'PLACEHOLDER_RUC_EMPRESA')}`,
              bold: true
            }),
            new TextRun({
              text: `, con domicilio en `,
            }),
            new TextRun({
              text: `${safeText(empresa?.direccion || 'PLACEHOLDER_DIRECCION_EMPRESA')}`,
              bold: true
            }),
            new TextRun({
              text: `, representada legalmente por ${generoRepresentante === 'femenino' ? 'la señora' : 'el señor'} `,
            }),
            new TextRun({
              text: `${safeText(representanteLegal?.nombre)}`,
              bold: true
            }),
            new TextRun({
              text: `, de nacionalidad peruana, estado civil `,
            }),
            new TextRun({
              text: `${representanteLegal?.estadoCivil || 'PLACEHOLDER_ESTADO_CIVIL'}`,
              bold: true
            }),
            new TextRun({
              text: `, `,
            }),
            new TextRun({
              text: `${representanteLegal?.profesion || 'PLACEHOLDER_PROFESION'}`,
              bold: true
            }),
            new TextRun({
              text: `, identificado con DNI N° `,
            }),
            new TextRun({
              text: `${representanteLegal?.dni || 'PLACEHOLDER_DNI_REPRESENTANTE'}`,
              bold: true
            }),
            new TextRun({
              text: `, con domicilio en `,
            }),
            new TextRun({
              text: `${representanteLegal?.direccion || 'PLACEHOLDER_DIRECCION_REPRESENTANTE'}`,
              bold: true
            }),
            new TextRun({
              text: `, en el distrito `,
            }),
            new TextRun({
              text: `${representanteLegal?.distrito || 'PLACEHOLDER_DISTRITO_REPRESENTANTE'}`,
              bold: true
            }),
            new TextRun({
              text: `, provincia de `,
            }),
            new TextRun({
              text: `${representanteLegal?.provincia || 'PLACEHOLDER_PROVINCIA_REPRESENTANTE'}`,
              bold: true
            }),
            new TextRun({
              text: ` y departamento de `,
            }),
            new TextRun({
              text: `${representanteLegal?.departamento || 'PLACEHOLDER_DEPARTAMENTO_REPRESENTANTE'}`,
              bold: true
            }),
            new TextRun({
              text: `, a quien en adelante se le denominará `,
            }),
            new TextRun({
              text: `"${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}"`,
              bold: true
            }),
            new TextRun({
              text: ` y de la otra parte `,
            }),
            new TextRun({
              text: textoCompradores,
            }),
            new TextRun({
              text: `, y suscriben el presente contrato en los términos y condiciones siguientes:`,
            })
          ],
          spacing: { after: 400 }
        }),

        // Primera cláusula
        new Paragraph({
          text: "PRIMERA",
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `"${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}" es propietario del terreno denominado lotización `,
            }),
            new TextRun({
              text: `"${safeText(proyecto.nombre)}"`,
              bold: true
            }),
            new TextRun({
              text: ` ubicado en el distrito de `,
            }),
            new TextRun({
              text: `${proyecto?.distrito || 'PLACEHOLDER_DISTRITO_PROYECTO'}`,
              bold: true
            }),
            new TextRun({
              text: `, provincia de `,
            }),
            new TextRun({
              text: `${proyecto?.provincia || 'PLACEHOLDER_PROVINCIA_PROYECTO'}`,
              bold: true
            }),
            new TextRun({
              text: ` y departamento de `,
            }),
            new TextRun({
              text: `${proyecto?.departamento || 'PLACEHOLDER_DEPARTAMENTO_PROYECTO'}`,
              bold: true
            }),
            new TextRun({
              text: `.`,
            })
          ],
          spacing: { after: 200 }
        }),

        // Segunda cláusula
        new Paragraph({
          text: "SEGUNDA",
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `"${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}" declara el propósito de desarrollar el proyecto con la finalidad de independización de lotes. El proyecto contará dentro de su conformación con las siguientes características:`,
            })
          ],
          spacing: { after: 200 }
        }),

        // Características del proyecto
        ...(proyecto?.caracteristicas && proyecto.caracteristicas.length > 0 
          ? proyecto.caracteristicas.map((car: any) => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: `● ${safeText(car.nombre)}`,
                  })
                ],
                spacing: { after: 100 }
              })
            )
          : [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "● Habilitación para alumbrado Público",
                  })
                ],
                spacing: { after: 100 }
              })
            ]
        ),

        // Tercera cláusula
        new Paragraph({
          text: "TERCERA",
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Por el presente documento "${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}" otorga a favor de ${esMultipleCompradores ? '"LOS COMPRADORES"' : '"EL COMPRADOR"'} la venta real del bien inmueble denominado:`,
            })
          ],
          spacing: { after: 200 }
        }),

        // Detalles del producto
        new Paragraph({
          children: [
            new TextRun({
              text: contrato.ventaLote 
                ? `Lote N° ${safeText(producto.numero)} de la manzana "${producto.manzana?.codigo || 'PLACEHOLDER_CODIGO_MANZANA'}" tiene un área de ${producto.area || 'PLACEHOLDER_AREA'} m²`
                : `Unidad N° ${safeText(producto.codigo)} del pabellón "${venta.pabellon?.codigo || 'PLACEHOLDER_CODIGO_PABELLON'}" de tipo ${producto.tipoUnidad || 'PLACEHOLDER_TIPO'}`,
              bold: true
            })
          ],
          spacing: { after: 200 }
        }),

        // Cuarta cláusula
        new Paragraph({
          text: "CUARTA",
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Las partes, de común acuerdo han establecido como precio del lote de terreno mencionado en la cláusula que precede, en la suma de S/. ${formatNumber(venta.precioVenta)} (${formatNumber(venta.precioVenta)} soles).`,
            })
          ],
          spacing: { after: 200 }
        }),

        // Información de pago
        ...(venta.montoInicial && venta.montoInicial > 0 ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `El pago de la cuota inicial de S/. ${formatNumber(venta.montoInicial)} (${formatNumber(venta.montoInicial)} soles) se hizo mediante depósito en la cuenta corriente de "${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}" en el banco ${bankInfo.banco} del Perú con el NRO. de cuenta N° ${bankInfo.numeroCuenta}`,
              }),
              ...(venta.numeroOperacion ? [
                new TextRun({
                  text: ` con número de operación bancaria N° ${venta.numeroOperacion}`,
                })
              ] : [])
            ],
            spacing: { after: 200 }
          })
        ] : []),

        // Tabla de cuotas si aplica
        ...(venta.tipoVenta === 'CUOTAS' ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `El saldo de S/. ${formatNumber(venta.precioVenta - (venta.montoInicial || 0))} (${formatNumber(venta.precioVenta - (venta.montoInicial || 0))} soles) se cancelará en ${venta.cuotas?.length || 0} cuotas, según el siguiente cronograma:`,
              })
            ],
            spacing: { after: 200 }
          }),
          generarTablaCuotas(venta)
        ] : [
          new Paragraph({
            children: [
              new TextRun({
                text: `El pago total de S/. ${formatNumber(venta.precioVenta)} (${formatNumber(venta.precioVenta)} soles) se realizó mediante depósito en la cuenta corriente de "${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}" en el banco ${bankInfo.banco} del Perú con el NRO. de cuenta N° ${bankInfo.numeroCuenta}`,
              }),
              ...(venta.numeroOperacion ? [
                new TextRun({
                  text: ` con número de operación bancaria N° ${venta.numeroOperacion}`,
                })
              ] : []),
              new TextRun({
                text: `.`
              })
            ],
            spacing: { after: 200 }
          })
        ]),

        // Quinta cláusula
        new Paragraph({
          text: "QUINTA",
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Las partidas del registro de la propiedad inmueble se abrirán como consecuencia de la independización de las unidades inmobiliarias. En consecuencia, al producirse la independización y obtenida las partidas registrales independientes, "${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}" se compromete a firmar la escritura pública definitiva de compra y venta a favor de ${esMultipleCompradores ? '"LOS COMPRADORES"' : '"EL COMPRADOR"'} ante notario público.`,
            })
          ],
          spacing: { after: 200 }
        }),

        // Sexta cláusula
        new Paragraph({
          text: "SEXTA",
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `La venta del terreno comprende todos los usos, costumbres, servidumbres, servicios, aires y en general todo cuanto de hecho o por derecho le corresponda o pudiera corresponder sin reserva ni limitación alguna. A la firma de la presente se le suministra la posesión inmediata a ${esMultipleCompradores ? '"LOS COMPRADORES"' : '"EL COMPRADOR"'}.`,
            })
          ],
          spacing: { after: 200 }
        }),

        // Séptima cláusula
        new Paragraph({
          text: "SÉPTIMA",
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${esMultipleCompradores ? '"LOS COMPRADORES"' : '"EL COMPRADOR"'} se compromete al cumplimiento del reglamento interno de `,
            }),
            new TextRun({
              text: `"${safeText(proyecto.nombre)}"`,
              bold: true
            }),
            new TextRun({
              text: ` el que será aprobado por la junta de propietarios. Para contribuir al ordenamiento y mejora del entorno de la lotización.`,
            })
          ],
          spacing: { after: 200 }
        }),

        // Octava cláusula
        new Paragraph({
          text: "OCTAVA",
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `La fecha prevista para la independización de las unidades inmobiliarias materia del presente contrato, se prorrogará automáticamente cuando medien causas no imputables a las partes que impidan el cumplimiento cabal de esta prestación. No obstante, el compromiso es hacerlo en el plazo de `,
            }),
            new TextRun({
              text: `${proyecto?.plazoIndependizacion || 'PLACEHOLDER_PLAZO_INDEPENDIZACION'}`,
              bold: true
            }),
            new TextRun({
              text: ` meses a partir de la suscripción del presente contrato.`,
            })
          ],
          spacing: { after: 200 }
        }),

        // Novena cláusula
        new Paragraph({
          text: "NOVENA",
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${esMultipleCompradores ? '"LOS COMPRADORES"' : '"EL COMPRADOR"'} declara que es condición esencial en su manifestación de voluntad la celebración del presente contrato y posterior contrato definitivo de compraventa, la adquisición del bien inmueble indicado en el numeral de la presente cláusula.`,
            })
          ],
          spacing: { after: 200 }
        }),

        // Décima cláusula (solo para ventas a cuotas)
        ...(venta.tipoVenta === 'CUOTAS' ? [
          new Paragraph({
            text: "DÉCIMA",
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `En caso de que ${esMultipleCompradores ? 'LOS COMPRADORES' : 'EL COMPRADOR'} incumpla con el pago de tres (3) o más cuotas consecutivas, o manifieste por escrito su decisión de desistir de la compra, ${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'} podrá dar por terminado el presente contrato unilateralmente, sin obligación de devolver las sumas de dinero ya pagadas por ${esMultipleCompradores ? 'LOS COMPRADORES' : 'EL COMPRADOR'}. Estas sumas se considerarán como compensación por los gastos administrativos, gestión de venta y daños derivados de la rescisión, los cuales son asumidos exclusivamente por ${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}.`,
              })
            ],
            spacing: { after: 200 }
          })
        ] : []),

        // Décimo primero (o Décima si no hay cuotas)
        new Paragraph({
          text: venta.tipoVenta === 'CUOTAS' ? "DÉCIMO PRIMERO" : "DÉCIMA",
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Para todos los efectos de este contrato, los otorgantes se someten a la jurisdicción de los jueces y tribunales de la provincia de `,
            }),
            new TextRun({
              text: `${proyecto?.provincia || 'PLACEHOLDER_PROVINCIA_PROYECTO'}`,
              bold: true
            }),
            new TextRun({
              text: `.`,
            })
          ],
          spacing: { after: 200 }
        }),

        // Décimo segundo (o Undécima si no hay cuotas)
        new Paragraph({
          text: venta.tipoVenta === 'CUOTAS' ? "DÉCIMO SEGUNDO" : "UNDÉCIMA",
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `En todo lo no previsto por las partes en el presente contrato, ambas partes se someten a lo establecido por las normas del código civil y demás del sistema jurídico que resulten aplicables.`,
            })
          ],
          spacing: { after: 400 }
        }),

        // Firma
        new Paragraph({
          text: "En señal de conformidad y aceptación de las cláusulas del presente contrato, ambas partes firmamos.",
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 }
        }),

        // Fecha
        new Paragraph({
          children: [
            new TextRun({
              text: `${formatDate(contrato.fechaContrato)} del ${new Date(contrato.fechaContrato).getFullYear()}`,
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // Firmas - Vendedor
        new Paragraph({
          text: `${generoRepresentante === 'femenino' ? 'LA VENDEDORA' : 'EL VENDEDOR'}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${safeText(empresa?.nombre)}`,
            }),
            new TextRun({
              text: `\nRepresentante Legal\n${generoRepresentante === 'femenino' ? 'Sra.' : 'Sr.'} ${safeText(representanteLegal?.nombre)}\nDNI: ${representanteLegal?.dni || 'N/A'}`,
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // Firmas - Comprador(es)
        new Paragraph({
          text: `${esMultipleCompradores ? 'LOS COMPRADORES' : 'EL COMPRADOR'}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: clientesPrincipales.map((c: any) => {
                const genero = determinarGenero(c?.nombre || '')
                const tratamiento = genero === 'femenino' ? 'Sra.' : 'Sr.'
                return `${tratamiento} ${safeText(c.nombre)} ${safeText(c.apellido)}\nDNI: ${c.dni || 'N/A'}`
              }).join('\n\n'),
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // Footer
        new Paragraph({
          text: "Documento generado automáticamente por el sistema de gestión inmobiliaria",
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 100 }
        }),
        new Paragraph({
          text: `Fecha de generación: ${formatDate(new Date())}`,
          alignment: AlignmentType.CENTER
        })
      ]
    }]
  })

  console.log('🔍 Debug DOCX - Documento Word generado exitosamente')
  return doc
}
