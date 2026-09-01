import { apiClient, type ApiError } from '@/lib/api-client'
import type { MedicoReferenciaRequest, MedicoReferenciaResponse } from '../types'

export async function getMedicoReferencia(estudianteId: number) {
  try {
    const { data } = await apiClient.get<MedicoReferenciaResponse>(
      `/estudiantes/${estudianteId}/medico-referencia`,
    )
    return data
  } catch (error) {
    if ((error as ApiError).status === 404) return null
    throw error
  }
}

export function saveMedicoReferencia(estudianteId: number, body: MedicoReferenciaRequest) {
  return apiClient
    .post<MedicoReferenciaResponse>(`/estudiantes/${estudianteId}/medico-referencia`, body)
    .then((r) => r.data)
}
