import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

// GET /api/contratos/[id]/test-pdf - Probar datos del contrato
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('Probando datos del contrato:', params.id)

    const contrato = await prisma.contrato.findUnique({
      where: { id: params.id },
      include: {
        ventaLote: {
          include: {
            cliente: {
              include: {
                direcciones: true
              }
            },
            lote: {
              include: {
                manzana: {
                  include: {
                    proyecto: {
                      include: {
                        empresaDesarrolladora: {
                          include: {
                            representanteLegal: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            vendedor: true,
            cuotas: {
              include: {
                pagos: {
                  include: {
                    comprobantePago: true
                  }
                }
              }
            }
          }
        },
        ventaUnidadCementerio: {
          include: {
            cliente: {
              include: {
                direcciones: true
              }
            },
            unidadCementerio: {
              include: {
                pabellon: {
                  include: {
                    proyecto: {
                      include: {
                        empresaDesarrolladora: {
                          include: {
                            representanteLegal: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            vendedor: true,
            cuotas: {
              include: {
                pagos: {
                  include: {
                    comprobantePago: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!contrato) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    console.log('Contrato encontrado:', contrato.numeroContrato)

    // Validar que el contrato tenga una venta asociada
    const venta = contrato.ventaLote || contrato.ventaUnidadCementerio
    if (!venta) {
      return NextResponse.json({ error: 'El contrato no tiene una venta asociada' }, { status: 400 })
    }

    console.log('Venta encontrada:', venta.id)

    // Extraer datos para verificar
    const cliente = venta?.cliente
    const producto = contrato.ventaLote ? (venta as any)?.lote : (venta as any)?.unidadCementerio
    const proyecto = contrato.ventaLote ? producto?.manzana?.proyecto : producto?.pabellon?.proyecto
    const empresa = proyecto?.empresaDesarrolladora

    return NextResponse.json({
      success: true,
      contrato: {
        id: contrato.id,
        numeroContrato: contrato.numeroContrato,
        fechaContrato: contrato.fechaContrato,
        tipoContrato: contrato.tipoContrato,
        estado: contrato.estado
      },
      venta: {
        id: venta.id,
        precio: (venta as any).precio,
        tipoVenta: (venta as any).tipoVenta,
        fechaVenta: (venta as any).fechaVenta
      },
      cliente: cliente ? {
        id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        razonSocial: cliente.razonSocial,
        dni: cliente.dni,
        ruc: cliente.ruc,
        direcciones: cliente.direcciones
      } : null,
      producto: producto ? {
        id: producto.id,
        numero: producto.numero,
        tipo: contrato.ventaLote ? 'Lote' : 'Unidad de Cementerio'
      } : null,
      proyecto: proyecto ? {
        id: proyecto.id,
        nombre: proyecto.nombre,
        ubicacion: proyecto.ubicacion
      } : null,
      empresa: empresa ? {
        id: empresa.id,
        razonSocial: empresa.razonSocial,
        ruc: empresa.ruc,
        direccion: empresa.direccion,
        representanteLegal: empresa.representanteLegal
      } : null
    })
  } catch (error) {
    console.error('Error al probar contrato:', error)
    return NextResponse.json(
      { error: 'Error al probar contrato', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
} 