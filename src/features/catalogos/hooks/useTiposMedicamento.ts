import { createResourceApi } from '@/lib/api-factory'
import { createCrudHooks } from '@/lib/crud-hooks-factory'
import type { TipoMedicamento, CreateTipoMedicamentoRequest } from '../types'

const tiposMedicamentoApi = createResourceApi<TipoMedicamento, CreateTipoMedicamentoRequest>('/tipos-medicamento')

export const {
  useList: useTiposMedicamento,
  useGetById: useTipoMedicamento,
  useCreate: useCreateTipoMedicamento,
  useUpdate: useUpdateTipoMedicamento,
  useRemove: useRemoveTipoMedicamento,
} = createCrudHooks('tipos-medicamento', tiposMedicamentoApi)
