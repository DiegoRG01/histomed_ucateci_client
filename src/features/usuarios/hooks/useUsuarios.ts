import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createResourceApiFlatList } from '@/lib/api-factory'
import type { Usuario, CreateUsuarioRequest } from '../types'

const usuariosApi = createResourceApiFlatList<Usuario, CreateUsuarioRequest>('/usuarios')

export function useUsuarios() {
  return useQuery({ queryKey: ['usuarios', 'list'], queryFn: () => usuariosApi.list() })
}

export function useCreateUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usuariosApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}
