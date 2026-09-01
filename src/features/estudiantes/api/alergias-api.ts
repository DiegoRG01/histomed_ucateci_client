import { createResourceApiFlatList } from '@/lib/api-factory'
import type { AlergiaRequest, AlergiaResponse } from '../types'

export function alergiasApi(estudianteId: number | string) {
  return createResourceApiFlatList<AlergiaResponse, AlergiaRequest>(
    `/estudiantes/${estudianteId}/alergias`,
  )
}
