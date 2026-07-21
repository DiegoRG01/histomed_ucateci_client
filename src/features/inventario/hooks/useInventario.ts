import { createCrudHooks } from '@/lib/crud-hooks-factory'
import { createResourceApi } from '@/lib/api-factory'
import type {
  Insumo,
  CreateMedicamentoRequest,
  Medicamento,
  LoteInventario,
  CreateLoteInventarioRequest,
} from '../types'

const insumosApi = createResourceApi<Insumo, Insumo>('/insumos')
export const useInsumos = createCrudHooks('insumos', insumosApi)

const medicamentosApi = createResourceApi<Medicamento, CreateMedicamentoRequest>('/medicamentos')
export const useMedicamentos = createCrudHooks('medicamentos', medicamentosApi)

const lotesApi = createResourceApi<LoteInventario, CreateLoteInventarioRequest>('/lotes-inventario')
export const useLotes = createCrudHooks('lotes-inventario', lotesApi)
