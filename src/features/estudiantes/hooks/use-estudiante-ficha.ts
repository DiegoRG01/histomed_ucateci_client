import { useQuery } from '@tanstack/react-query'
import { getFichaEmergencia } from '../api/estudiantes-api'

export function useEstudianteFicha(id: number | undefined) {
  return useQuery({
    queryKey: ['estudiantes', 'ficha', id],
    queryFn: () => getFichaEmergencia(id as number),
    enabled: id !== undefined && Number.isInteger(id),
  })
}
