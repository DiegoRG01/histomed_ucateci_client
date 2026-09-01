import { createCrudHooks } from '@/lib/crud-hooks-factory'
import type { PageResponse } from '@/types/pagination'
import type { CreateEstudianteRequest, EstudianteResponse } from '../types'
import { estudiantesCrudApi } from '../api/estudiantes-api'

export const useEstudiantes = createCrudHooks<
  EstudianteResponse,
  CreateEstudianteRequest,
  CreateEstudianteRequest,
  PageResponse<EstudianteResponse>
>('estudiantes', estudiantesCrudApi)
