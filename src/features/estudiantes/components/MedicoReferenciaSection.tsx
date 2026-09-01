import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { mapApiErrorToForm } from '@/lib/form-errors'
import type { ApiError } from '@/lib/api-client'
import { useMedicoReferencia, useSaveMedicoReferencia } from '../hooks/use-medico-referencia'
import type { MedicoReferenciaRequest, MedicoReferenciaResponse } from '../types'
import { MedicoReferenciaForm, type MedicoReferenciaFormValues } from './MedicoReferenciaForm'

const medicoReferenciaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  especialidad: z.string(),
  telefono: z.string(),
  hospitalClinica: z.string(),
})

const FORM_DEFAULT_VALUES: MedicoReferenciaFormValues = {
  nombre: '',
  especialidad: '',
  telefono: '',
  hospitalClinica: '',
}

function resetValuesFrom(
  row: MedicoReferenciaResponse | null,
): MedicoReferenciaFormValues {
  return {
    nombre: row?.nombre ?? '',
    especialidad: row?.especialidad ?? '',
    telefono: row?.telefono ?? '',
    hospitalClinica: row?.hospitalClinica ?? '',
  }
}

type MedicoReferenciaSectionProps = {
  estudianteId: number
}

export function MedicoReferenciaSection({ estudianteId }: MedicoReferenciaSectionProps) {
  const { data, isLoading } = useMedicoReferencia(estudianteId)
  const saveMutation = useSaveMedicoReferencia(estudianteId)

  const form = useForm<MedicoReferenciaFormValues>({
    resolver: zodResolver(medicoReferenciaSchema),
    defaultValues: FORM_DEFAULT_VALUES,
  })

  useEffect(() => {
    if (!isLoading && !form.formState.isDirty) {
      form.reset(resetValuesFrom(data ?? null))
    }
  }, [data, isLoading, form])

  async function onSubmit(values: MedicoReferenciaFormValues) {
    const body: MedicoReferenciaRequest = {
      nombre: values.nombre,
      ...(values.especialidad ? { especialidad: values.especialidad } : {}),
      ...(values.telefono ? { telefono: values.telefono } : {}),
      ...(values.hospitalClinica ? { hospitalClinica: values.hospitalClinica } : {}),
    }
    try {
      const saved = await saveMutation.mutateAsync(body)
      toast.success('Médico de referencia guardado')
      form.reset(resetValuesFrom(saved))
    } catch (error) {
      mapApiErrorToForm(error as ApiError, form.setError)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Médico de referencia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <MedicoReferenciaForm
            form={form}
            onSubmit={onSubmit}
            isPending={saveMutation.isPending}
          />
        )}
      </CardContent>
    </Card>
  )
}
