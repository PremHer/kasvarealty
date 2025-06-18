/**
 * Genera códigos de manzana automáticamente
 * @param cantidad - Número de manzanas a generar
 * @returns Array de códigos de manzana
 */
export function generarCodigosManzana(cantidad: number): string[] {
  const codigos: string[] = [];
  
  for (let i = 0; i < cantidad; i++) {
    codigos.push(generarCodigoManzana(i));
  }
  
  return codigos;
}

/**
 * Genera un código de manzana basado en el índice
 * @param indice - Índice de la manzana (0, 1, 2, ...)
 * @returns Código de manzana (A, B, C, ..., Z, AA, AB, AC, ...)
 */
export function generarCodigoManzana(indice: number): string {
  if (indice < 26) {
    // A-Z
    return String.fromCharCode(65 + indice);
  } else {
    // AA, AB, AC, ...
    const primerCaracter = String.fromCharCode(65 + Math.floor((indice - 26) / 26));
    const segundoCaracter = String.fromCharCode(65 + ((indice - 26) % 26));
    return primerCaracter + segundoCaracter;
  }
}

/**
 * Genera el nombre descriptivo de una manzana
 * @param codigo - Código de la manzana
 * @returns Nombre descriptivo
 */
export function generarNombreManzana(codigo: string): string {
  return `Manzana ${codigo}`;
}

/**
 * Valida si un código de manzana es válido
 * @param codigo - Código a validar
 * @returns true si es válido, false en caso contrario
 */
export function validarCodigoManzana(codigo: string): boolean {
  // Debe ser una letra (A-Z) o dos letras (AA-ZZ)
  const regex = /^[A-Z]{1,2}$/;
  return regex.test(codigo);
}

/**
 * Obtiene el siguiente código de manzana disponible
 * @param codigosExistentes - Array de códigos ya existentes
 * @returns Siguiente código disponible
 */
export function obtenerSiguienteCodigoManzana(codigosExistentes: string[]): string {
  let indice = 0;
  
  while (true) {
    const codigo = generarCodigoManzana(indice);
    if (!codigosExistentes.includes(codigo)) {
      return codigo;
    }
    indice++;
  }
} 