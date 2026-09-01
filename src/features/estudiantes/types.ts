export interface AptitudDonacion {
  apto: boolean
  motivos: string[]
}

export interface FichaEmergenciaResponse {
  estudianteId: number
  nombre: string
  apellido: string
  grupoSanguineo: string
  email: string
  telefono: string
  carrera: string
  seguroMedico: string
  alergias: string[]
  condicionesFisicas: string[]
  enfermedadesCronicas: string[]
  medicamentosHabituales: string[]
  medicoReferencia: string
  contactoPrincipal: string
  aptitudDonacion: AptitudDonacion
}

export interface EstudianteResponse {
  id: number
  matricula: string
  cedula: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  sexo: string
  grupoSanguineo: string
  email: string
  telefono: string
  carreraId: number
  carreraNombre: string
  seguroMedicoId: number | null
  seguroMedicoNombre: string | null
}

export type Sexo = 'M' | 'F' | 'OTRO'
export type GrupoSanguineo =
  | 'O_POS'
  | 'O_NEG'
  | 'A_POS'
  | 'A_NEG'
  | 'B_POS'
  | 'B_NEG'
  | 'AB_POS'
  | 'AB_NEG'

export type CreateEstudianteRequest = {
  matricula: string
  cedula: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  sexo: Sexo
  grupoSanguineo: GrupoSanguineo
  email: string
  telefono?: string
  carreraId: number
  seguroMedicoId?: number
}

export type TipoAlergia = 'MEDICAMENTO' | 'ALIMENTO' | 'AMBIENTAL' | 'OTRO'
export type AlergiaRequest = { nombre: string; tipoAlergia: TipoAlergia; medicamentoId?: number }
export type AlergiaResponse = { id: number; nombre: string; tipoAlergia: TipoAlergia; medicamentoId: number | null }

export type CondicionFisicaRequest = { nombre: string; descripcion?: string; impideDonacionSangre: boolean }
export type CondicionFisicaResponse = {
  id: number
  nombre: string
  descripcion: string | null
  impideDonacionSangre: boolean
}

export type EnfermedadRequest = { nombre: string; esCronica: boolean; impideDonacionSangre: boolean }
export type EnfermedadResponse = { id: number; nombre: string; esCronica: boolean; impideDonacionSangre: boolean }

export type MedicamentoHabitualRequest = { medicamentoId: number; dosis?: string; frecuencia?: string }
export type MedicamentoHabitualResponse = {
  id: number
  estudianteId: number
  medicamentoId: number
  medicamentoNombre: string
  dosis: string | null
  frecuencia: string | null
}

export type ContactoRequest = { nombre: string; telefono: string; email?: string }
export type ContactoResponse = { id: number; nombre: string; telefono: string; email: string | null }

export type ContactoEstudianteRequest = { contactoId: number; parentesco?: string; esPrincipal?: boolean }
export type ContactoEstudianteUpdateRequest = { parentesco?: string; esPrincipal: boolean }
export type ContactoEstudianteResponse = {
  id: number
  estudianteId: number
  contactoId: number
  contactoNombre: string
  contactoTelefono: string
  contactoEmail: string | null
  parentesco: string | null
  esPrincipal: boolean
}

export type MedicoReferenciaRequest = {
  nombre: string
  especialidad?: string
  telefono?: string
  hospitalClinica?: string
}
export type MedicoReferenciaResponse = {
  id: number
  nombre: string
  especialidad: string | null
  telefono: string | null
  hospitalClinica: string | null
  estudianteId: number
}
