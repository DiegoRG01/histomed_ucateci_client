import { createCrudHooks } from '@/lib/crud-hooks-factory'
import type { AlergiaRequest, AlergiaResponse } from '../types'
import { alergiasApi } from '../api/alergias-api'

export function useAlergias(estudianteId: number) {
  return createCrudHooks<AlergiaResponse, AlergiaRequest, AlergiaRequest, AlergiaResponse[]>(
    `estudiantes/${estudianteId}/alergias`,
    alergiasApi(estudianteId),
  )
}
