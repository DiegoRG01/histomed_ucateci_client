import { createResourceApiFlatList } from '@/lib/api-factory'
import type { CondicionFisicaRequest, CondicionFisicaResponse } from '../types'

export function condicionesApi(estudianteId: number | string) {
  return createResourceApiFlatList<CondicionFisicaResponse, CondicionFisicaRequest>(
    `/estudiantes/${estudianteId}/condiciones`,
  )
}
