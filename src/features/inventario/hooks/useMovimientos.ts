import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { MovimientoInventario, CreateMovimientoInventarioRequest } from '../types'

export function useMovimientos() {
  return useQuery({
    queryKey: ['movimientos-inventario', 'list'],
    queryFn: () => apiClient.get<MovimientoInventario[]>('/movimientos-inventario').then((r) => r.data),
  })
}

export function useCreateMovimiento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateMovimientoInventarioRequest) =>
      apiClient.post<MovimientoInventario>('/movimientos-inventario', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['movimientos-inventario'] }),
  })
}
