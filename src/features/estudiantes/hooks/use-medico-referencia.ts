import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MedicoReferenciaRequest } from '../types'
import { getMedicoReferencia, saveMedicoReferencia } from '../api/medico-referencia-api'

export function useMedicoReferencia(estudianteId: number) {
  return useQuery({
    queryKey: ['estudiantes', estudianteId, 'medico-referencia'],
    queryFn: () => getMedicoReferencia(estudianteId),
  })
}

export function useSaveMedicoReferencia(estudianteId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: MedicoReferenciaRequest) => saveMedicoReferencia(estudianteId, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['estudiantes', estudianteId, 'medico-referencia'] }),
  })
}
