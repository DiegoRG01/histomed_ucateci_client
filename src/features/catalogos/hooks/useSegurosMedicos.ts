import { useQuery } from '@tanstack/react-query'
import { createResourceApiFlatList } from '@/lib/api-factory'
import type { SeguroMedico, CreateSeguroMedicoRequest } from '../types'

const segurosMedicosApi = createResourceApiFlatList<SeguroMedico, CreateSeguroMedicoRequest>(
  '/seguros-medicos',
)

export function useSegurosMedicos() {
  return useQuery({
    queryKey: ['catalogos', 'seguros-medicos'],
    queryFn: () => segurosMedicosApi.list(),
  })
}
