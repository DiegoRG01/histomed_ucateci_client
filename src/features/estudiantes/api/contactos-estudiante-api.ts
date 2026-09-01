import { createResourceApiFlatList } from '@/lib/api-factory'
import type {
  ContactoEstudianteRequest,
  ContactoEstudianteResponse,
  ContactoEstudianteUpdateRequest,
} from '../types'

export function contactosEstudianteApi(estudianteId: number | string) {
  return createResourceApiFlatList<
    ContactoEstudianteResponse,
    ContactoEstudianteRequest,
    ContactoEstudianteUpdateRequest
  >(`/estudiantes/${estudianteId}/contactos`)
}
