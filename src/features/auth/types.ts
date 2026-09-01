export type LoginRequest = {
  username: string
  password: string
}

export type LoginResponse = {
  token: string
  tokenType: 'Bearer'
  username: string
  nombreCompleto: string // siempre "" por bug conocido del backend — no usar para mostrar nombre
}
