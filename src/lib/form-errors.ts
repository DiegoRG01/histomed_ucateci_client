import type { UseFormSetError, FieldValues, Path } from 'react-hook-form'
import { toast } from 'sonner'
import type { ApiError } from './api-client'

export function mapApiErrorToForm<T extends FieldValues>(error: ApiError, setError: UseFormSetError<T>) {
  if (error.fieldErrors?.length) {
    for (const fe of error.fieldErrors) {
      setError(fe.field as Path<T>, { message: fe.message })
    }
    return
  }
  toast.error(error.message ?? 'Ocurrió un error inesperado')
}
