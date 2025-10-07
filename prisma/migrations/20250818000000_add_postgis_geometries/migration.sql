-- Habilitar extensión PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Agregar campos geométricos a proyectos
ALTER TABLE "proyectos" ADD COLUMN IF NOT EXISTS "geometria" GEOMETRY(POLYGON, 4326);
ALTER TABLE "proyectos" ADD COLUMN IF NOT EXISTS "centro" GEOMETRY(POINT, 4326);
ALTER TABLE "proyectos" ADD COLUMN IF NOT EXISTS "perimetro" GEOMETRY(LINESTRING, 4326);
ALTER TABLE "proyectos" ADD COLUMN IF NOT EXISTS "area_geometrica" DOUBLE PRECISION;

-- Agregar campos geométricos a manzanas
ALTER TABLE "manzanas" ADD COLUMN IF NOT EXISTS "geometria" GEOMETRY(POLYGON, 4326);
ALTER TABLE "manzanas" ADD COLUMN IF NOT EXISTS "centro" GEOMETRY(POINT, 4326);
ALTER TABLE "manzanas" ADD COLUMN IF NOT EXISTS "perimetro_geometrico" GEOMETRY(LINESTRING, 4326);
ALTER TABLE "manzanas" ADD COLUMN IF NOT EXISTS "area_geometrica" DOUBLE PRECISION;

-- Agregar campos geométricos a lotes
ALTER TABLE "lotes" ADD COLUMN IF NOT EXISTS "geometria" GEOMETRY(POLYGON, 4326);
ALTER TABLE "lotes" ADD COLUMN IF NOT EXISTS "centro" GEOMETRY(POINT, 4326);
ALTER TABLE "lotes" ADD COLUMN IF NOT EXISTS "perimetro_geometrico" GEOMETRY(LINESTRING, 4326);
ALTER TABLE "lotes" ADD COLUMN IF NOT EXISTS "area_geometrica" DOUBLE PRECISION;

-- Agregar campos geométricos a pabellones
ALTER TABLE "pabellones" ADD COLUMN IF NOT EXISTS "geometria" GEOMETRY(POLYGON, 4326);
ALTER TABLE "pabellones" ADD COLUMN IF NOT EXISTS "centro" GEOMETRY(POINT, 4326);
ALTER TABLE "pabellones" ADD COLUMN IF NOT EXISTS "perimetro_geometrico" GEOMETRY(LINESTRING, 4326);
ALTER TABLE "pabellones" ADD COLUMN IF NOT EXISTS "area_geometrica" DOUBLE PRECISION;

-- Agregar campos geométricos a unidades de cementerio
ALTER TABLE "unidades_cementerio" ADD COLUMN IF NOT EXISTS "geometria" GEOMETRY(POLYGON, 4326);
ALTER TABLE "unidades_cementerio" ADD COLUMN IF NOT EXISTS "centro" GEOMETRY(POINT, 4326);
ALTER TABLE "unidades_cementerio" ADD COLUMN IF NOT EXISTS "area_geometrica" DOUBLE PRECISION;

-- Crear índices espaciales para optimizar consultas
CREATE INDEX IF NOT EXISTS "idx_proyectos_geometria" ON "proyectos" USING GIST ("geometria");
CREATE INDEX IF NOT EXISTS "idx_proyectos_centro" ON "proyectos" USING GIST ("centro");
CREATE INDEX IF NOT EXISTS "idx_manzanas_geometria" ON "manzanas" USING GIST ("geometria");
CREATE INDEX IF NOT EXISTS "idx_manzanas_centro" ON "manzanas" USING GIST ("centro");
CREATE INDEX IF NOT EXISTS "idx_lotes_geometria" ON "lotes" USING GIST ("geometria");
CREATE INDEX IF NOT EXISTS "idx_lotes_centro" ON "lotes" USING GIST ("centro");
CREATE INDEX IF NOT EXISTS "idx_pabellones_geometria" ON "pabellones" USING GIST ("geometria");
CREATE INDEX IF NOT EXISTS "idx_pabellones_centro" ON "pabellones" USING GIST ("centro");
CREATE INDEX IF NOT EXISTS "idx_unidades_cementerio_geometria" ON "unidades_cementerio" USING GIST ("geometria");
CREATE INDEX IF NOT EXISTS "idx_unidades_cementerio_centro" ON "unidades_cementerio" USING GIST ("centro");

-- Función para calcular área automáticamente (en metros cuadrados)
CREATE OR REPLACE FUNCTION calcular_area_geometrica()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.geometria IS NOT NULL THEN
    -- Transformar a EPSG:32718 (UTM Zone 18S para Perú) para cálculo preciso en metros
    NEW.area_geometrica = ST_Area(ST_Transform(NEW.geometria, 32718));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular centro automáticamente
CREATE OR REPLACE FUNCTION calcular_centro_geometrico()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.geometria IS NOT NULL THEN
    NEW.centro = ST_Centroid(NEW.geometria);
  ELSIF NEW.latitud IS NOT NULL AND NEW.longitud IS NOT NULL THEN
    NEW.centro = ST_SetSRID(ST_MakePoint(NEW.longitud, NEW.latitud), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular perímetro automáticamente
CREATE OR REPLACE FUNCTION calcular_perimetro_geometrico()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.geometria IS NOT NULL THEN
    NEW.perimetro = ST_Boundary(NEW.geometria);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualización automática
CREATE TRIGGER trigger_calcular_area_geometrica
  BEFORE INSERT OR UPDATE ON "proyectos"
  FOR EACH ROW EXECUTE FUNCTION calcular_area_geometrica();

CREATE TRIGGER trigger_calcular_centro_geometrico_proyectos
  BEFORE INSERT OR UPDATE ON "proyectos"
  FOR EACH ROW EXECUTE FUNCTION calcular_centro_geometrico();

CREATE TRIGGER trigger_calcular_perimetro_geometrico_proyectos
  BEFORE INSERT OR UPDATE ON "proyectos"
  FOR EACH ROW EXECUTE FUNCTION calcular_perimetro_geometrico();

CREATE TRIGGER trigger_calcular_area_geometrica_manzanas
  BEFORE INSERT OR UPDATE ON "manzanas"
  FOR EACH ROW EXECUTE FUNCTION calcular_area_geometrica();

CREATE TRIGGER trigger_calcular_centro_geometrico_manzanas
  BEFORE INSERT OR UPDATE ON "manzanas"
  FOR EACH ROW EXECUTE FUNCTION calcular_centro_geometrico();

CREATE TRIGGER trigger_calcular_perimetro_geometrico_manzanas
  BEFORE INSERT OR UPDATE ON "manzanas"
  FOR EACH ROW EXECUTE FUNCTION calcular_perimetro_geometrico();

CREATE TRIGGER trigger_calcular_area_geometrica_lotes
  BEFORE INSERT OR UPDATE ON "lotes"
  FOR EACH ROW EXECUTE FUNCTION calcular_area_geometrica();

CREATE TRIGGER trigger_calcular_centro_geometrico_lotes
  BEFORE INSERT OR UPDATE ON "lotes"
  FOR EACH ROW EXECUTE FUNCTION calcular_centro_geometrico();

CREATE TRIGGER trigger_calcular_perimetro_geometrico_lotes
  BEFORE INSERT OR UPDATE ON "lotes"
  FOR EACH ROW EXECUTE FUNCTION calcular_perimetro_geometrico();

CREATE TRIGGER trigger_calcular_area_geometrica_pabellones
  BEFORE INSERT OR UPDATE ON "pabellones"
  FOR EACH ROW EXECUTE FUNCTION calcular_area_geometrica();

CREATE TRIGGER trigger_calcular_centro_geometrico_pabellones
  BEFORE INSERT OR UPDATE ON "pabellones"
  FOR EACH ROW EXECUTE FUNCTION calcular_centro_geometrico();

CREATE TRIGGER trigger_calcular_perimetro_geometrico_pabellones
  BEFORE INSERT OR UPDATE ON "pabellones"
  FOR EACH ROW EXECUTE FUNCTION calcular_perimetro_geometrico();

CREATE TRIGGER trigger_calcular_area_geometrica_unidades_cementerio
  BEFORE INSERT OR UPDATE ON "unidades_cementerio"
  FOR EACH ROW EXECUTE FUNCTION calcular_area_geometrica();

CREATE TRIGGER trigger_calcular_centro_geometrico_unidades_cementerio
  BEFORE INSERT OR UPDATE ON "unidades_cementerio"
  FOR EACH ROW EXECUTE FUNCTION calcular_centro_geometrico();

-- Función para validar geometrías
CREATE OR REPLACE FUNCTION validar_geometria()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.geometria IS NOT NULL AND NOT ST_IsValid(NEW.geometria) THEN
    RAISE EXCEPTION 'Geometría inválida para %', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de validación
CREATE TRIGGER trigger_validar_geometria_proyectos
  BEFORE INSERT OR UPDATE ON "proyectos"
  FOR EACH ROW EXECUTE FUNCTION validar_geometria();

CREATE TRIGGER trigger_validar_geometria_manzanas
  BEFORE INSERT OR UPDATE ON "manzanas"
  FOR EACH ROW EXECUTE FUNCTION validar_geometria();

CREATE TRIGGER trigger_validar_geometria_lotes
  BEFORE INSERT OR UPDATE ON "lotes"
  FOR EACH ROW EXECUTE FUNCTION validar_geometria();

CREATE TRIGGER trigger_validar_geometria_pabellones
  BEFORE INSERT OR UPDATE ON "pabellones"
  FOR EACH ROW EXECUTE FUNCTION validar_geometria();

CREATE TRIGGER trigger_validar_geometria_unidades_cementerio
  BEFORE INSERT OR UPDATE ON "unidades_cementerio"
  FOR EACH ROW EXECUTE FUNCTION validar_geometria();
