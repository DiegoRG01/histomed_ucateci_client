import { createCrudHooks } from '@/lib/crud-hooks-factory'
import type {
  ContactoEstudianteRequest,
  ContactoEstudianteResponse,
  ContactoEstudianteUpdateRequest,
} from '../types'
import { contactosEstudianteApi } from '../api/contactos-estudiante-api'

export function useContactosEstudiante(estudianteId: number) {
  return createCrudHooks<
    ContactoEstudianteResponse,
    ContactoEstudianteRequest,
    ContactoEstudianteUpdateRequest,
    ContactoEstudianteResponse[]
  >(`estudiantes/${estudianteId}/contactos`, contactosEstudianteApi(estudianteId))
}
