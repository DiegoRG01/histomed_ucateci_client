import { createResourceApiFlatList } from '@/lib/api-factory'
import type { MedicamentoHabitualRequest, MedicamentoHabitualResponse } from '../types'

export function medicamentosHabitualesApi(estudianteId: number | string) {
  return createResourceApiFlatList<MedicamentoHabitualResponse, MedicamentoHabitualRequest>(
    `/estudiantes/${estudianteId}/medicamentos`,
  )
}
