import { createResourceApiFlatList } from '@/lib/api-factory'
import { createCrudHooks } from '@/lib/crud-hooks-factory'
import type { UnidadMedida, CreateUnidadMedidaRequest } from '../types'

const unidadesMedidaApi = createResourceApiFlatList<UnidadMedida, CreateUnidadMedidaRequest>('/unidades-medida')

export const {
  useList: useUnidadesMedida,
  useGetById: useUnidadMedida,
  useCreate: useCreateUnidadMedida,
  useUpdate: useUpdateUnidadMedida,
  useRemove: useRemoveUnidadMedida,
} = createCrudHooks<UnidadMedida, CreateUnidadMedidaRequest, CreateUnidadMedidaRequest, UnidadMedida[]>(
  'unidades-medida',
  unidadesMedidaApi,
)
