/**
 * marketplace.ts — Tipos para el módulo marketplace (feat/marketplace-mvp)
 */

export interface LoteDoc {
  id: string
  caficultorId: string
  nombreLote: string
  variedad: string
  proceso: 'lavado' | 'natural' | 'honey' | 'anaerobico'
  altitudMsnm: number
  cosecha: string
  kgDisponibles: number
  kgReservados: number
  precioKgPEN: number
  puntajeOficial?: number
  puntajeSCA?: number
  status: 'activo' | 'pausado' | 'agotado'
  createdAt: string
  updatedAt: string
}

export interface ProcesoLoteDoc {
  id: string
  loteId: string
  caficultorId: string
  // Cosecha
  cosechaFechaInicio?: string
  cosechaFechaFin?: string
  cosechaTipo?: 'selectiva' | 'pasadas' | 'striping' | 'selectivo' | 'por_pase' | 'mecanico'
  cosechaBrix?: number
  // Despulpado
  horasHastaDespulpe?: number
  // Fermentación
  fermentacionTipo?: 'aerobica' | 'anaerobica' | 'sin_fermentacion'
  fermentacionHoras?: number
  fermentacionTempAgua?: number
  // Lavado
  lavadoNumVeces?: number
  lavadoAguaLimpia?: boolean
  // Secado
  secadoMetodo?: 'patio' | 'cama_africana' | 'mecanico' | 'mixto'
  secadoDias?: number
  secadoHumedadFinal?: number
  // Almacenamiento
  almacenamientoCondicion?: 'seco_fresco' | 'humedo' | 'controlado' | 'deficiente'
  almacenamientoDiasReposo?: number
  notas?: string
  createdAt: string
}

export interface FincaDoc {
  id: string
  caficultorId: string
  hectareas?: number
  altitudMsnm?: number
  altitudMin?: number
  altitudMax?: number
  variedades?: string[]
  tipoSuelo?: 'arcilloso' | 'arenoso' | 'franco' | 'volcánico' | 'volcanico'
  tipoCultivo?: 'organico' | 'convencional' | 'transicion'
  tipoSombra?: 'pleno_sol' | 'sombra_parcial' | 'sombra_densa'
  certificaciones?: string[]
  createdAt: string
}
