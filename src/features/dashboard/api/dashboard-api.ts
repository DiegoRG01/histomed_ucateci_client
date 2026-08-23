import { apiClient } from '@/lib/api-client'
import type { PageResponse } from '@/types/pagination'
import type { EstudianteResponse } from '@/features/estudiantes/types'
import type {
  StockBajoAlertaResponse,
  VencimientoProximoAlertaResponse,
  DistribucionGrupoSanguineoReporteResponse,
  VisitasPorCarreraReporteResponse,
} from '../types'

export function getStockBajo() {
  return apiClient.get<StockBajoAlertaResponse[]>('/reportes/stock-bajo').then((r) => r.data)
}

export function getVencimientoProximo() {
  return apiClient
    .get<VencimientoProximoAlertaResponse[]>('/reportes/vencimiento-proximo', {
      params: { dias: 30 },
    })
    .then((r) => r.data)
}

export function getDistribucionGrupoSanguineo() {
  return apiClient
    .get<DistribucionGrupoSanguineoReporteResponse[]>('/reportes/distribucion-grupo-sanguineo')
    .then((r) => r.data)
}

export function getVisitasPorCarrera() {
  return apiClient
    .get<VisitasPorCarreraReporteResponse[]>('/reportes/visitas-por-carrera')
    .then((r) => r.data)
}

export function getTotalEstudiantes() {
  return apiClient
    .get<PageResponse<EstudianteResponse>>('/estudiantes', { params: { size: 1 } })
    .then((r) => r.data)
}
