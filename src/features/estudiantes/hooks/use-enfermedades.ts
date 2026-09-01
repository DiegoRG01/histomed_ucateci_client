import { createCrudHooks } from '@/lib/crud-hooks-factory'
import type { EnfermedadRequest, EnfermedadResponse } from '../types'
import { enfermedadesApi } from '../api/enfermedades-api'

export function useEnfermedades(estudianteId: number) {
  return createCrudHooks<
    EnfermedadResponse,
    EnfermedadRequest,
    EnfermedadRequest,
    EnfermedadResponse[]
  >(`estudiantes/${estudianteId}/enfermedades`, enfermedadesApi(estudianteId))
}
