import { createResourceApi } from '@/lib/api-factory'
import { apiClient } from '@/lib/api-client'
import type { PageResponse } from '@/types/pagination'
import type { CreateEstudianteRequest, EstudianteResponse, FichaEmergenciaResponse } from '../types'

export function searchEstudiantes(filtro: string) {
  return apiClient
    .get<PageResponse<EstudianteResponse>>('/estudiantes', {
      params: { filtro, size: 8 },
    })
    .then((r) => r.data)
}

export function getFichaEmergencia(id: number) {
  return apiClient
    .get<FichaEmergenciaResponse>(`/estudiantes/${id}/ficha`)
    .then((r) => r.data)
}

export const estudiantesCrudApi = createResourceApi<EstudianteResponse, CreateEstudianteRequest>(
  '/estudiantes',
)
