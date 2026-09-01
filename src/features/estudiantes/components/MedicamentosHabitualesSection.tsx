import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { PencilIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { mapApiErrorToForm } from '@/lib/form-errors'
import type { ApiError } from '@/lib/api-client'
import { useMedicamentosHabituales } from '../hooks/use-medicamentos-habituales'
import type { MedicamentoHabitualRequest, MedicamentoHabitualResponse } from '../types'
import {
  MedicamentoHabitualForm,
  type MedicamentoHabitualFormValues,
} from './MedicamentoHabitualForm'

const medicamentoHabitualSchema = z.object({
  medicamentoId: z
    .number({ message: 'Seleccione un medicamento' })
    .min(1, 'Seleccione un medicamento'),
  dosis: z.string(),
  frecuencia: z.string(),
})

const FORM_DEFAULT_VALUES: MedicamentoHabitualFormValues = {
  medicamentoId: 0,
  dosis: '',
  frecuencia: '',
}

type MedicamentosHabitualesSectionProps = {
  estudianteId: number
}

export function MedicamentosHabitualesSection({ estudianteId }: MedicamentosHabitualesSectionProps) {
  const medicamentosHabitualesHooks = useMedicamentosHabituales(estudianteId)
  const { data, isLoading } = medicamentosHabitualesHooks.useList()
  const createMutation = medicamentosHabitualesHooks.useCreate()
  const updateMutation = medicamentosHabitualesHooks.useUpdate()
  const removeMutation = medicamentosHabitualesHooks.useRemove()

  const [editing, setEditing] = useState<MedicamentoHabitualResponse | null>(null)

  const form = useForm<MedicamentoHabitualFormValues>({
    resolver: zodResolver(medicamentoHabitualSchema),
    defaultValues: FORM_DEFAULT_VALUES,
  })

  const columns: Column<MedicamentoHabitualResponse>[] = [
    { header: 'Medicamento', cell: (row) => row.medicamentoNombre },
    { header: 'Dosis', cell: (row) => row.dosis ?? '—' },
    { header: 'Frecuencia', cell: (row) => row.frecuencia ?? '—' },
  ]

  function cancelEdit() {
    setEditing(null)
    form.reset(FORM_DEFAULT_VALUES)
  }

  async function onSubmit(values: MedicamentoHabitualFormValues) {
    const body: MedicamentoHabitualRequest = {
      medicamentoId: values.medicamentoId,
      ...(values.dosis ? { dosis: values.dosis } : {}),
      ...(values.frecuencia ? { frecuencia: values.frecuencia } : {}),
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body })
        toast.success('Medicamento habitual actualizado')
      } else {
        await createMutation.mutateAsync(body)
        toast.success('Medicamento habitual agregado')
      }
      setEditing(null)
      form.reset(FORM_DEFAULT_VALUES)
    } catch (error) {
      mapApiErrorToForm(error as ApiError, form.setError)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? 'Editar medicamento habitual' : 'Medicamentos habituales'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <MedicamentoHabitualForm
          form={form}
          onSubmit={onSubmit}
          onCancel={cancelEdit}
          isPending={createMutation.isPending || updateMutation.isPending}
        />

        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
          emptyMessage="No hay medicamentos habituales registrados"
          rowActions={(row) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-xs" onClick={() => {
                setEditing(row)
                form.reset({
                  medicamentoId: row.medicamentoId,
                  dosis: row.dosis ?? '',
                  frecuencia: row.frecuencia ?? '',
                })
              }}>
                <PencilIcon />
              </Button>
              <ConfirmDeleteDialog
                trigger={
                  <Button variant="ghost" size="icon-xs">
                    <Trash2Icon />
                  </Button>
                }
                title="Eliminar medicamento habitual"
                description={`¿Está seguro que desea eliminar "${row.medicamentoNombre}"?`}
                onConfirm={() =>
                  removeMutation.mutate(row.id, {
                    onError: () => toast.error('No se pudo eliminar el medicamento habitual'),
                  })
                }
                isPending={removeMutation.isPending}
                confirmLabel="Eliminar"
                pendingLabel="Eliminando..."
              />
            </div>
          )}
        />
      </CardContent>
    </Card>
  )
}
