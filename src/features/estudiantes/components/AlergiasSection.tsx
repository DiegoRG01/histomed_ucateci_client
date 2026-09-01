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
import { useAlergias } from '../hooks/use-alergias'
import type { AlergiaRequest, AlergiaResponse, TipoAlergia } from '../types'
import { AlergiaForm, TIPO_LABELS, type AlergiaFormValues } from './AlergiaForm'

const alergiaSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    tipoAlergia: z
      .enum(['', 'MEDICAMENTO', 'ALIMENTO', 'AMBIENTAL', 'OTRO'])
      .refine((v) => v !== '', { message: 'Seleccione el tipo de alergia' }),
    medicamentoId: z.number().nullable(),
  })
  .refine((v) => v.tipoAlergia !== 'MEDICAMENTO' || v.medicamentoId !== null, {
    path: ['medicamentoId'],
    message: 'Seleccione el medicamento',
  })

const FORM_DEFAULT_VALUES: AlergiaFormValues = {
  nombre: '',
  tipoAlergia: '',
  medicamentoId: null,
}

type AlergiasSectionProps = {
  estudianteId: number
}

export function AlergiasSection({ estudianteId }: AlergiasSectionProps) {
  const alergiasHooks = useAlergias(estudianteId)
  const { data, isLoading } = alergiasHooks.useList()
  const createMutation = alergiasHooks.useCreate()
  const updateMutation = alergiasHooks.useUpdate()
  const removeMutation = alergiasHooks.useRemove()

  const [editing, setEditing] = useState<AlergiaResponse | null>(null)

  const form = useForm<AlergiaFormValues>({
    resolver: zodResolver(alergiaSchema),
    defaultValues: FORM_DEFAULT_VALUES,
  })

  const columns: Column<AlergiaResponse>[] = [
    { header: 'Nombre', cell: (row) => row.nombre },
    {
      header: 'Tipo',
      cell: (row) => TIPO_LABELS[row.tipoAlergia] ?? row.tipoAlergia,
    },
  ]

  function cancelEdit() {
    setEditing(null)
    form.reset(FORM_DEFAULT_VALUES)
  }

  async function onSubmit(values: AlergiaFormValues) {
    const body: AlergiaRequest = {
      nombre: values.nombre,
      tipoAlergia: values.tipoAlergia as TipoAlergia,
      ...(values.medicamentoId !== null ? { medicamentoId: values.medicamentoId } : {}),
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body })
        toast.success('Alergia actualizada')
      } else {
        await createMutation.mutateAsync(body)
        toast.success('Alergia agregada')
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
        <CardTitle>{editing ? 'Editar alergia' : 'Alergias'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <AlergiaForm
          form={form}
          onSubmit={onSubmit}
          onCancel={cancelEdit}
          isPending={createMutation.isPending || updateMutation.isPending}
        />

        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
          emptyMessage="No hay alergias registradas"
          rowActions={(row) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-xs" onClick={() => {
                setEditing(row)
                form.reset({
                  nombre: row.nombre,
                  tipoAlergia: row.tipoAlergia,
                  medicamentoId: row.medicamentoId,
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
                title="Eliminar alergia"
                description={`¿Está seguro que desea eliminar "${row.nombre}"?`}
                onConfirm={() =>
                  removeMutation.mutate(row.id, {
                    onError: () => toast.error('No se pudo eliminar la alergia'),
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
