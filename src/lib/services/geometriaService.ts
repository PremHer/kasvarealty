import { prisma } from '@/lib/prisma'

export interface Coordenada {
  latitud: number
  longitud: number
}

export interface Poligono {
  coordenadas: Coordenada[]
}

export interface LoteGeometrico {
  id: string
  codigo: string
  numero: string
  geometria: string // WKT (Well-Known Text)
  centro: string
  perimetro: string
  areaGeometrica: number
  estado: string
  precio: number
}

export interface ManzanaGeometrica {
  id: string
  codigo: string
  nombre: string
  geometria: string
  centro: string
  perimetro: string
  areaGeometrica: number
  lotes: LoteGeometrico[]
}

export class GeometriaService {
  /**
   * Crear geometría de polígono desde coordenadas
   */
  static crearPoligono(coordenadas: Coordenada[]): string {
    if (coordenadas.length < 3) {
      throw new Error('Se necesitan al menos 3 coordenadas para crear un polígono')
    }

    // Cerrar el polígono si no está cerrado
    const coords = [...coordenadas]
    if (coords[0].latitud !== coords[coords.length - 1].latitud || 
        coords[0].longitud !== coords[coords.length - 1].longitud) {
      coords.push(coords[0])
    }

    const puntos = coords.map(coord => `${coord.longitud} ${coord.latitud}`).join(', ')
    return `POLYGON((${puntos}))`
  }

  /**
   * Crear punto desde coordenadas
   */
  static crearPunto(latitud: number, longitud: number): string {
    return `POINT(${longitud} ${latitud})`
  }

  /**
   * Generar polígono rectangular desde centro y dimensiones
   */
  static generarPoligonoRectangular(
    latitudCentro: number,
    longitudCentro: number,
    frente: number, // metros
    fondo: number,  // metros
    orientacion: number = 0 // grados
  ): string {
    // Convertir metros a grados (aproximadamente)
    const latOffset = fondo / 111320 // 1 grado ≈ 111.32km
    const lngOffset = frente / (111320 * Math.cos(latitudCentro * Math.PI / 180))

    // Aplicar rotación si es necesaria
    const rad = orientacion * Math.PI / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)

    const puntos = [
      [-lngOffset/2, -latOffset/2],
      [lngOffset/2, -latOffset/2],
      [lngOffset/2, latOffset/2],
      [-lngOffset/2, latOffset/2]
    ]

    const coordenadasRotadas = puntos.map(([x, y]) => ({
      latitud: latitudCentro + (x * cos - y * sin),
      longitud: longitudCentro + (x * sin + y * cos)
    }))

    return this.crearPoligono(coordenadasRotadas)
  }

  /**
   * Calcular área de un polígono en metros cuadrados
   */
  static async calcularArea(geometriaWKT: string): Promise<number> {
    const result = await prisma.$queryRaw<[{ st_area: number }]>`
      SELECT ST_Area(ST_Transform(ST_GeomFromText(${geometriaWKT}, 4326), 32718)) as st_area
    `
    return result[0].st_area
  }

  /**
   * Calcular centro de un polígono
   */
  static async calcularCentro(geometriaWKT: string): Promise<string> {
    const result = await prisma.$queryRaw<[{ st_astext: string }]>`
      SELECT ST_AsText(ST_Centroid(ST_GeomFromText(${geometriaWKT}, 4326))) as st_astext
    `
    return result[0].st_astext
  }

  /**
   * Calcular perímetro de un polígono
   */
  static async calcularPerimetro(geometriaWKT: string): Promise<string> {
    const result = await prisma.$queryRaw<[{ st_astext: string }]>`
      SELECT ST_AsText(ST_Boundary(ST_GeomFromText(${geometriaWKT}, 4326))) as st_astext
    `
    return result[0].st_astext
  }

  /**
   * Validar geometría
   */
  static async validarGeometria(geometriaWKT: string): Promise<boolean> {
    const result = await prisma.$queryRaw<[{ st_isvalid: boolean }]>`
      SELECT ST_IsValid(ST_GeomFromText(${geometriaWKT}, 4326)) as st_isvalid
    `
    return result[0].st_isvalid
  }

  /**
   * Actualizar geometría de un lote
   */
  static async actualizarGeometriaLote(
    loteId: string,
    geometriaWKT: string
  ): Promise<void> {
    // Validar geometría
    const esValida = await this.validarGeometria(geometriaWKT)
    if (!esValida) {
      throw new Error('Geometría inválida')
    }

    // Calcular propiedades geométricas
    const [area, centro, perimetro] = await Promise.all([
      this.calcularArea(geometriaWKT),
      this.calcularCentro(geometriaWKT),
      this.calcularPerimetro(geometriaWKT)
    ])

    // Actualizar en la base de datos
    await prisma.$executeRaw`
      UPDATE lotes 
      SET geometria = ST_GeomFromText(${geometriaWKT}, 4326),
          centro = ST_GeomFromText(${centro}, 4326),
          "perimetroGeometrico" = ST_GeomFromText(${perimetro}, 4326),
          "area_geometrica" = ${area}
      WHERE id = ${loteId}
    `
  }

  /**
   * Actualizar geometría de una manzana
   */
  static async actualizarGeometriaManzana(
    manzanaId: string,
    geometriaWKT: string
  ): Promise<void> {
    const esValida = await this.validarGeometria(geometriaWKT)
    if (!esValida) {
      throw new Error('Geometría inválida')
    }

    const [area, centro, perimetro] = await Promise.all([
      this.calcularArea(geometriaWKT),
      this.calcularCentro(geometriaWKT),
      this.calcularPerimetro(geometriaWKT)
    ])

    await prisma.$executeRaw`
      UPDATE manzanas 
      SET geometria = ST_GeomFromText(${geometriaWKT}, 4326),
          centro = ST_GeomFromText(${centro}, 4326),
          "perimetroGeometrico" = ST_GeomFromText(${perimetro}, 4326),
          "area_geometrica" = ${area}
      WHERE id = ${manzanaId}
    `
  }

  /**
   * Obtener lotes con geometría por proyecto
   */
  static async obtenerLotesConGeometria(proyectoId: string): Promise<LoteGeometrico[]> {
    const result = await prisma.$queryRaw<LoteGeometrico[]>`
      SELECT 
        l.id,
        l.codigo,
        l.numero,
        ST_AsText(l.geometria) as geometria,
        ST_AsText(l.centro) as centro,
        ST_AsText(l."perimetroGeometrico") as perimetro,
        l."area_geometrica",
        l.estado,
        l.precio
      FROM lotes l
      INNER JOIN manzanas m ON l."manzanaId" = m.id
      WHERE m."proyectoId" = ${proyectoId}
        AND l.geometria IS NOT NULL
      ORDER BY m.codigo, l.codigo
    `
    return result
  }

  /**
   * Obtener manzanas con geometría por proyecto
   */
  static async obtenerManzanasConGeometria(proyectoId: string): Promise<ManzanaGeometrica[]> {
    const manzanas = await prisma.$queryRaw<ManzanaGeometrica[]>`
      SELECT 
        m.id,
        m.codigo,
        m.nombre,
        ST_AsText(m.geometria) as geometria,
        ST_AsText(m.centro) as centro,
        ST_AsText(m."perimetroGeometrico") as perimetro,
        m."area_geometrica"
      FROM manzanas m
      WHERE m."proyectoId" = ${proyectoId}
        AND m.geometria IS NOT NULL
      ORDER BY m.codigo
    `

    // Obtener lotes para cada manzana
    for (const manzana of manzanas) {
      const lotes = await prisma.$queryRaw<LoteGeometrico[]>`
        SELECT 
          l.id,
          l.codigo,
          l.numero,
          ST_AsText(l.geometria) as geometria,
          ST_AsText(l.centro) as centro,
          ST_AsText(l."perimetroGeometrico") as perimetro,
          l."area_geometrica",
          l.estado,
          l.precio
        FROM lotes l
        WHERE l."manzanaId" = ${manzana.id}
          AND l.geometria IS NOT NULL
        ORDER BY l.codigo
      `
      manzana.lotes = lotes
    }

    return manzanas
  }

  /**
   * Buscar lotes por proximidad (dentro de un radio)
   */
  static async buscarLotesPorProximidad(
    latitud: number,
    longitud: number,
    radioMetros: number,
    proyectoId?: string
  ): Promise<LoteGeometrico[]> {
    const punto = this.crearPunto(latitud, longitud)
    const radio = radioMetros / 111320 // Convertir metros a grados aproximados

    let query = `
      SELECT 
        l.id,
        l.codigo,
        l.numero,
        ST_AsText(l.geometria) as geometria,
        ST_AsText(l.centro) as centro,
        ST_AsText(l."perimetroGeometrico") as perimetro,
        l."area_geometrica",
        l.estado,
        l.precio,
        ST_Distance(l.centro, ST_GeomFromText(${punto}, 4326)) as distancia
      FROM lotes l
      INNER JOIN manzanas m ON l."manzanaId" = m.id
      WHERE l.centro IS NOT NULL
        AND ST_DWithin(l.centro, ST_GeomFromText(${punto}, 4326), ${radio})
    `

    if (proyectoId) {
      query += ` AND m."proyectoId" = '${proyectoId}'`
    }

    query += ` ORDER BY distancia`

    const result = await prisma.$queryRawUnsafe<LoteGeometrico[]>(query)
    return result
  }

  /**
   * Verificar si un punto está dentro de un polígono
   */
  static async puntoDentroDePoligono(
    latitud: number,
    longitud: number,
    geometriaWKT: string
  ): Promise<boolean> {
    const punto = this.crearPunto(latitud, longitud)
    const result = await prisma.$queryRaw<[{ st_within: boolean }]>`
      SELECT ST_Within(ST_GeomFromText(${punto}, 4326), ST_GeomFromText(${geometriaWKT}, 4326)) as st_within
    `
    return result[0].st_within
  }

  /**
   * Calcular distancia entre dos puntos
   */
  static async calcularDistancia(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): Promise<number> {
    const result = await prisma.$queryRaw<[{ st_distance: number }]>`
      SELECT ST_Distance(
        ST_Transform(ST_SetSRID(ST_MakePoint(${lng1}, ${lat1}), 4326), 32718),
        ST_Transform(ST_SetSRID(ST_MakePoint(${lng2}, ${lat2}), 4326), 32718)
      ) as st_distance
    `
    return result[0].st_distance
  }

  /**
   * Obtener estadísticas geométricas del proyecto
   */
  static async obtenerEstadisticasGeometricas(proyectoId: string) {
    const result = await prisma.$queryRaw<[{
      total_area: number
      total_lotes: number
      lotes_con_geometria: number
      manzanas_con_geometria: number
    }]>`
      SELECT 
        COALESCE(SUM(m."area_geometrica"), 0) as total_area,
        COUNT(l.id) as total_lotes,
        COUNT(l.geometria) as lotes_con_geometria,
        COUNT(m.geometria) as manzanas_con_geometria
      FROM manzanas m
      LEFT JOIN lotes l ON m.id = l."manzanaId"
      WHERE m."proyectoId" = ${proyectoId}
    `

    return result[0]
  }
}

