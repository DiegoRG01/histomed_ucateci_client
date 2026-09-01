import { useQuery } from '@tanstack/react-query'
import { searchEstudiantes } from '../api/estudiantes-api'

export function useEstudianteSearch(filtro: string) {
  const trimmed = filtro.trim()
  return useQuery({
    queryKey: ['estudiantes', 'search', trimmed],
    queryFn: () => searchEstudiantes(trimmed),
    enabled: trimmed.length >= 2,
  })
}
