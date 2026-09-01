export interface VisitasPorCarreraReporteResponse {
  carrera: string
  cantidad: number
}

export interface DistribucionGrupoSanguineoReporteResponse {
  grupoSanguineo: string
  cantidad: number
}

export interface StockBajoAlertaResponse {
  insumoId: number
  insumoNombre: string
  stockActual: number
  stockMinimo: number
}

export interface VencimientoProximoAlertaResponse {
  loteId: number
  numeroLote: string
  insumoNombre: string
  fechaVencimiento: string
  cantidadDisponible: number
}
