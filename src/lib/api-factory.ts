import { apiClient } from './api-client'
import type { PageResponse } from '@/types/pagination'

export function createResourceApi<TDto, TCreate, TUpdate = TCreate>(basePath: string) {
  return {
    list: (params: { filtro?: string; page?: number; size?: number } = {}) =>
      apiClient.get<PageResponse<TDto>>(basePath, { params }).then((r) => r.data),
    getById: (id: number | string) =>
      apiClient.get<TDto>(`${basePath}/${id}`).then((r) => r.data),
    create: (body: TCreate) =>
      apiClient.post<TDto>(basePath, body).then((r) => r.data),
    update: (id: number | string, body: TUpdate) =>
      apiClient.put<TDto>(`${basePath}/${id}`, body).then((r) => r.data),
    remove: (id: number | string) =>
      apiClient.delete<void>(`${basePath}/${id}`).then(() => undefined),
  }
}

// Para entidades cuyo backend aún no pagina el listado (ej. Usuario hoy: GET devuelve array plano)
export function createResourceApiFlatList<TDto, TCreate, TUpdate = TCreate>(basePath: string) {
  return {
    list: () => apiClient.get<TDto[]>(basePath).then((r) => r.data),
    getById: (id: number | string) =>
      apiClient.get<TDto>(`${basePath}/${id}`).then((r) => r.data),
    create: (body: TCreate) =>
      apiClient.post<TDto>(basePath, body).then((r) => r.data),
    update: (id: number | string, body: TUpdate) =>
      apiClient.put<TDto>(`${basePath}/${id}`, body).then((r) => r.data),
    remove: (id: number | string) =>
      apiClient.delete<void>(`${basePath}/${id}`).then(() => undefined),
  }
}
