import { createResourceApiFlatList } from '@/lib/api-factory'
import type { EnfermedadRequest, EnfermedadResponse } from '../types'

export function enfermedadesApi(estudianteId: number | string) {
  return createResourceApiFlatList<EnfermedadResponse, EnfermedadRequest>(
    `/estudiantes/${estudianteId}/enfermedades`,
  )
}
