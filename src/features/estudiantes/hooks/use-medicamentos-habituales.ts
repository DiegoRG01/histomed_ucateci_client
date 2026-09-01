import { createCrudHooks } from '@/lib/crud-hooks-factory'
import type { MedicamentoHabitualRequest, MedicamentoHabitualResponse } from '../types'
import { medicamentosHabitualesApi } from '../api/medicamentos-habituales-api'

export function useMedicamentosHabituales(estudianteId: number) {
  return createCrudHooks<
    MedicamentoHabitualResponse,
    MedicamentoHabitualRequest,
    MedicamentoHabitualRequest,
    MedicamentoHabitualResponse[]
  >(`estudiantes/${estudianteId}/medicamentos`, medicamentosHabitualesApi(estudianteId))
}
