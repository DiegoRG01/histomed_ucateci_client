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
