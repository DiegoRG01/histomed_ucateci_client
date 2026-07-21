export type TipoMedicamento = { id: number; nombre: string; activo: boolean }
export type CreateTipoMedicamentoRequest = { nombre: string }
export type Carrera = { id: number; nombre: string; codigo: string; activo: boolean }
export type CreateCarreraRequest = { nombre: string; codigo: string }
export type SeguroMedico = { id: number; nombre: string; cobertura: string; activo: boolean }
export type CreateSeguroMedicoRequest = { nombre: string; cobertura: string }
