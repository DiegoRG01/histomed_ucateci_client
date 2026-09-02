export type TipoInsumo = 'MEDICAMENTO' | 'INSUMO'
export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'MERMA'

export type Insumo = {
  id: number
  nombre: string
  tipo: TipoInsumo
  unidadMedida: string
  unidadMedidaId: number
  stockMinimo: number
  activo: boolean
}

export type Medicamento = Insumo & {
  controlado: boolean
  concentracion: string
  viaAdministracion: string
  tiposMedicamentoIds: number[]
}

export type CreateMedicamentoRequest = Omit<Medicamento, 'id' | 'activo' | 'unidadMedida'>

export type LoteInventario = {
  id: number
  insumoId: number
  insumoNombre: string
  numeroLote: string
  fechaVencimiento: string
  cantidadDisponible: number
  activo: boolean
}

export type CreateLoteInventarioRequest = Omit<LoteInventario, 'id' | 'insumoNombre' | 'activo'>

export type MovimientoInventario = {
  id: number
  insumoId: number
  loteId: number | null
  tipo: TipoMovimiento
  cantidad: number
  fecha: string
  motivo: string
  usuarioId: number
}

export type CreateMovimientoInventarioRequest = Omit<MovimientoInventario, 'id' | 'fecha' | 'usuarioId'>
