import { apiClient } from '@/lib/api-client'
import type { ContactoRequest, ContactoResponse } from '../types'

export function listContactos() {
  return apiClient.get<ContactoResponse[]>('/contactos').then((r) => r.data)
}

export function createContacto(body: ContactoRequest) {
  return apiClient.post<ContactoResponse>('/contactos', body).then((r) => r.data)
}
