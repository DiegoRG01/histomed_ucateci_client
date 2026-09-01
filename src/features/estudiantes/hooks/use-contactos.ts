import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContacto, listContactos } from '../api/contactos-api'

export function useContactosCatalogo() {
  return useQuery({ queryKey: ['contactos'], queryFn: listContactos })
}

export function useCreateContacto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createContacto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contactos'] }),
  })
}
