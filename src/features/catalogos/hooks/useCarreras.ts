import { useQuery } from '@tanstack/react-query'
import { createResourceApiFlatList } from '@/lib/api-factory'
import type { Carrera, CreateCarreraRequest } from '../types'

const carrerasApi = createResourceApiFlatList<Carrera, CreateCarreraRequest>('/catalogos/carreras')

export function useCarreras() {
  return useQuery({
    queryKey: ['catalogos', 'carreras'],
    queryFn: () => carrerasApi.list(),
  })
}
