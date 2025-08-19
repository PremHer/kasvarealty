import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const proyecto = await prisma.proyecto.findUnique({
      where: { id: params.id },
      include: {
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        aprobadoPor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        gerente: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        empresaDesarrolladora: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    if (!proyecto) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    const project = {
      id: proyecto.id,
      name: proyecto.nombre,
      description: proyecto.descripcion,
      location: proyecto.direccion,
      departamento: proyecto.departamento,
      provincia: proyecto.provincia,
      distrito: proyecto.distrito,
      latitud: proyecto.latitud,
      longitud: proyecto.longitud,
      startDate: proyecto.fechaInicio,
      endDate: proyecto.fechaFin,
      precioTerreno: proyecto.precioTerreno,
      inversionInicial: proyecto.inversionInicial,
      inversionTotal: proyecto.inversionTotal,
      inversionActual: proyecto.inversionActual,
      status: proyecto.estado,
      developerCompanyId: proyecto.empresaDesarrolladoraId,
      developerCompany: proyecto.empresaDesarrolladora ? {
        id: proyecto.empresaDesarrolladora.id,
        name: proyecto.empresaDesarrolladora.nombre
      } : null,
      managerId: proyecto.gerenteId,
      createdById: proyecto.creadoPorId,
      type: proyecto.tipo,
      totalArea: proyecto.areaTotal,
      usableArea: proyecto.areaUtil,
      totalUnits: proyecto.cantidadUnidades,
      // Campos del predio matriz para contratos
      extensionTotal: proyecto.extensionTotal,
      unidadCatastral: proyecto.unidadCatastral,
      partidaRegistral: proyecto.partidaRegistral,
      plazoIndependizacion: proyecto.plazoIndependizacion,
      createdBy: {
        id: proyecto.creadoPor.id,
        name: proyecto.creadoPor.nombre,
        email: proyecto.creadoPor.email
      },
      approvedBy: proyecto.estado === 'APPROVED' && proyecto.aprobadoPor
        ? {
            id: proyecto.aprobadoPor.id,
            name: proyecto.aprobadoPor.nombre,
            email: proyecto.aprobadoPor.email
          }
        : null,
      rejectedBy: proyecto.estado === 'REJECTED' && proyecto.aprobadoPor
        ? {
            id: proyecto.aprobadoPor.id,
            name: proyecto.aprobadoPor.nombre,
            email: proyecto.aprobadoPor.email
          }
        : null,
      manager: proyecto.gerente
        ? {
            id: proyecto.gerente.id,
            name: proyecto.gerente.nombre,
            email: proyecto.gerente.email
          }
        : null,
      razonRechazo: proyecto.razonRechazo
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error al obtener proyecto:', error)
    return NextResponse.json(
      { error: 'Error al obtener proyecto' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email! },
      select: { rol: true, id: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar permisos de edición
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: params.id },
      include: {
        empresaDesarrolladora: {
          select: {
            representanteLegalId: true
          }
        }
      }
    })

    if (!proyecto) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar si el usuario tiene permiso para editar
    const canEdit = 
      ['SUPER_ADMIN', 'ADMIN'].includes(usuario.rol) || // Super Admin y Admin pueden editar cualquier proyecto
      (usuario.rol === 'PROJECT_MANAGER') || // Project Manager puede editar cualquier proyecto del sistema
      (usuario.rol === 'SALES_MANAGER') || // Sales Manager puede editar cualquier proyecto del sistema
      (usuario.rol === 'GERENTE_GENERAL' && proyecto.empresaDesarrolladora?.representanteLegalId === usuario.id) // Gerente General solo puede editar proyectos de su empresa

    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar este proyecto' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const {
      name,
      description,
      location,
      departamento,
      provincia,
      distrito,
      latitud,
      longitud,
      startDate,
      endDate,
      precioTerreno,
      inversionInicial,
      inversionTotal,
      inversionActual,
      developerCompanyId,
      type,
      totalArea,
      usableArea,
      totalUnits,
      // Campos del predio matriz para contratos
      extensionTotal,
      unidadCatastral,
      partidaRegistral,
      plazoIndependizacion
    } = data

    // Validar cambio de tipo de proyecto si hay datos relacionados
    if (type && type !== proyecto.tipo) {
      // Verificar si hay manzanas o lotes (para proyectos de lotización)
      const manzanasCount = await prisma.manzana.count({
        where: { proyectoId: params.id }
      })
      
      const lotesCount = await prisma.lote.count({
        where: {
          manzana: {
            proyectoId: params.id
          }
        }
      })

      // Verificar si hay pabellones o unidades de cementerio (para proyectos de cementerio)
      const pabellonesCount = await prisma.pabellon.count({
        where: { proyectoId: params.id }
      })

      const unidadesCementerioCount = await prisma.unidadCementerio.count({
        where: {
          pabellon: {
            proyectoId: params.id
          }
        }
      })

      // Si hay datos relacionados, impedir el cambio de tipo
      if (manzanasCount > 0 || lotesCount > 0 || pabellonesCount > 0 || unidadesCementerioCount > 0) {
        const totalRelatedData = manzanasCount + lotesCount + pabellonesCount + unidadesCementerioCount
        
        const errorMessage = `No se puede cambiar el tipo de proyecto porque ya tiene ${totalRelatedData} elemento(s) de datos relacionados. Para cambiar el tipo de proyecto, primero debe eliminar todos los datos asociados.`
        
        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }
    }

    const proyectoActualizado = await prisma.proyecto.update({
      where: { id: params.id },
      data: {
        nombre: name,
        descripcion: description,
        direccion: location,
        departamento: departamento || null,
        provincia: provincia || null,
        distrito: distrito || null,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null,
        fechaInicio: new Date(startDate),
        fechaFin: endDate ? new Date(endDate) : null,
        precioTerreno: precioTerreno ? parseFloat(precioTerreno) : null,
        inversionInicial: inversionInicial ? parseFloat(inversionInicial) : null,
        inversionTotal: inversionTotal ? parseFloat(inversionTotal) : null,
        inversionActual: inversionActual ? parseFloat(inversionActual) : null,
        empresaDesarrolladoraId: developerCompanyId,
        tipo: type,
        areaTotal: totalArea ? parseFloat(totalArea) : null,
        areaUtil: usableArea ? parseFloat(usableArea) : null,
        cantidadUnidades: totalUnits ? parseInt(totalUnits) : null,
        // Campos del predio matriz para contratos
        extensionTotal: extensionTotal ? parseFloat(extensionTotal) : null,
        unidadCatastral: unidadCatastral || null,
        partidaRegistral: partidaRegistral || null,
        plazoIndependizacion: plazoIndependizacion ? parseInt(plazoIndependizacion) : null
      },
      include: {
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        aprobadoPor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        gerente: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        empresaDesarrolladora: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    return NextResponse.json({
      id: proyectoActualizado.id,
      name: proyectoActualizado.nombre,
      description: proyectoActualizado.descripcion,
      location: proyectoActualizado.direccion,
      departamento: proyectoActualizado.departamento,
      provincia: proyectoActualizado.provincia,
      distrito: proyectoActualizado.distrito,
      latitud: proyectoActualizado.latitud,
      longitud: proyectoActualizado.longitud,
      startDate: proyectoActualizado.fechaInicio,
      endDate: proyectoActualizado.fechaFin,
      precioTerreno: proyectoActualizado.precioTerreno,
      inversionInicial: proyectoActualizado.inversionInicial,
      inversionTotal: proyectoActualizado.inversionTotal,
      inversionActual: proyectoActualizado.inversionActual,
      status: proyectoActualizado.estado,
      developerCompanyId: proyectoActualizado.empresaDesarrolladoraId,
      developerCompany: proyectoActualizado.empresaDesarrolladora ? {
        id: proyectoActualizado.empresaDesarrolladora.id,
        name: proyectoActualizado.empresaDesarrolladora.nombre
      } : null,
      managerId: proyectoActualizado.gerenteId,
      createdById: proyectoActualizado.creadoPorId,
      type: proyectoActualizado.tipo,
      totalArea: proyectoActualizado.areaTotal,
      usableArea: proyectoActualizado.areaUtil,
      totalUnits: proyectoActualizado.cantidadUnidades,
      // Campos del predio matriz para contratos
      extensionTotal: proyectoActualizado.extensionTotal,
      unidadCatastral: proyectoActualizado.unidadCatastral,
      partidaRegistral: proyectoActualizado.partidaRegistral,
      plazoIndependizacion: proyectoActualizado.plazoIndependizacion,
      createdBy: {
        id: proyectoActualizado.creadoPor.id,
        name: proyectoActualizado.creadoPor.nombre,
        email: proyectoActualizado.creadoPor.email
      },
      approvedBy: proyectoActualizado.aprobadoPor
        ? {
            id: proyectoActualizado.aprobadoPor.id,
            name: proyectoActualizado.aprobadoPor.nombre,
            email: proyectoActualizado.aprobadoPor.email
          }
        : null,
      manager: proyectoActualizado.gerente
        ? {
            id: proyectoActualizado.gerente.id,
            name: proyectoActualizado.gerente.nombre,
            email: proyectoActualizado.gerente.email
          }
        : null
    })
  } catch (error) {
    console.error('Error al actualizar proyecto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar proyecto' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email! },
      select: { rol: true, id: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar permisos de eliminación
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: params.id },
      include: {
        empresaDesarrolladora: {
          select: {
            representanteLegalId: true
          }
        },
        actividades: true,
        comentarios: true,
        documentos: true,
        unidades: true
      }
    })

    if (!proyecto) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar si el usuario tiene permiso para eliminar
    const canDelete = 
      ['SUPER_ADMIN', 'ADMIN'].includes(usuario.rol) || // Super Admin y Admin pueden eliminar cualquier proyecto
      (usuario.rol === 'PROJECT_MANAGER') || // Project Manager puede eliminar cualquier proyecto del sistema
      (usuario.rol === 'SALES_MANAGER') || // Sales Manager puede eliminar cualquier proyecto del sistema
      (usuario.rol === 'GERENTE_GENERAL' && proyecto.empresaDesarrolladora?.representanteLegalId === usuario.id) // Gerente General solo puede eliminar proyectos de su empresa

    if (!canDelete) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este proyecto' },
        { status: 403 }
      )
    }

    // Verificar relaciones activas
    const relacionesActivas = []

    if (proyecto.actividades.length > 0) {
      relacionesActivas.push({
        tipo: 'Actividades',
        cantidad: proyecto.actividades.length,
        items: proyecto.actividades.map(a => `${a.tipo} - ${a.descripcion}`)
      })
    }
    if (proyecto.comentarios.length > 0) {
      relacionesActivas.push({
        tipo: 'Comentarios',
        cantidad: proyecto.comentarios.length,
        items: proyecto.comentarios.map(c => c.contenido.substring(0, 50) + '...')
      })
    }
    if (proyecto.documentos.length > 0) {
      relacionesActivas.push({
        tipo: 'Documentos',
        cantidad: proyecto.documentos.length,
        items: proyecto.documentos.map(d => `${d.nombre} (${d.tipo})`)
      })
    }
    if (proyecto.unidades.length > 0) {
      relacionesActivas.push({
        tipo: 'Unidades Inmobiliarias',
        cantidad: proyecto.unidades.length,
        items: proyecto.unidades.map(u => `${u.codigo} - ${u.tipo} (${u.estado})`)
      })
    }

    if (relacionesActivas.length > 0) {
      const mensaje = [
        `No se puede eliminar el proyecto "${proyecto.nombre}" porque tiene las siguientes relaciones activas:`,
        '',
        ...relacionesActivas.map(r => [
          `${r.tipo} (${r.cantidad}):`,
          ...r.items.map(item => `• ${item}`),
          ''
        ]).flat(),
        'Debes eliminar estas relaciones antes de eliminar el proyecto.'
      ].join('\n')

      return NextResponse.json({
        error: 'No se puede eliminar el proyecto',
        detalles: mensaje
      }, { status: 400 })
    }

    // Si no hay relaciones activas, eliminar el proyecto
    await prisma.proyecto.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Proyecto eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar proyecto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el proyecto' },
      { status: 500 }
    )
  }
} 