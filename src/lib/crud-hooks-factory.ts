import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function createCrudHooks<TDto, TCreate, TUpdate>(
  queryKey: string,
  api: {
    list: (params?: any) => Promise<any>
    getById: (id: number | string) => Promise<TDto>
    create: (body: TCreate) => Promise<TDto>
    update: (id: number | string, body: TUpdate) => Promise<TDto>
    remove: (id: number | string) => Promise<void>
  },
) {
  return {
    useList: (params?: any) =>
      useQuery({ queryKey: [queryKey, 'list', params], queryFn: () => api.list(params) }),

    useGetById: (id: number | string | undefined) =>
      useQuery({
        queryKey: [queryKey, id],
        queryFn: () => api.getById(id as number | string),
        enabled: id !== undefined,
      }),

    useCreate: () => {
      const queryClient = useQueryClient()
      return useMutation({
        mutationFn: api.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      })
    },

    useUpdate: () => {
      const queryClient = useQueryClient()
      return useMutation({
        mutationFn: ({ id, body }: { id: number | string; body: TUpdate }) => api.update(id, body),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      })
    },

    useRemove: () => {
      const queryClient = useQueryClient()
      return useMutation({
        mutationFn: (id: number | string) => api.remove(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      })
    },
  }
}
