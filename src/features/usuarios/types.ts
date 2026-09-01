export type RolNombre = 'ADMIN' | 'ENFERMERIA' | 'ALMACEN' | 'CONSULTA'

export const ROL_NOMBRES: RolNombre[] = ['ADMIN', 'ENFERMERIA', 'ALMACEN', 'CONSULTA']

export type Usuario = {
  id: number
  username: string
  nombreCompleto: string
  email: string
  roles: RolNombre[]
  activo: boolean
}

export type CreateUsuarioRequest = {
  username: string
  password: string
  nombreCompleto: string
  email: string
  roles: RolNombre[]
}
