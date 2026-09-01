import { createCrudHooks } from '@/lib/crud-hooks-factory'
import type { CondicionFisicaRequest, CondicionFisicaResponse } from '../types'
import { condicionesApi } from '../api/condiciones-api'

export function useCondiciones(estudianteId: number) {
  return createCrudHooks<
    CondicionFisicaResponse,
    CondicionFisicaRequest,
    CondicionFisicaRequest,
    CondicionFisicaResponse[]
  >(`estudiantes/${estudianteId}/condiciones`, condicionesApi(estudianteId))
}
