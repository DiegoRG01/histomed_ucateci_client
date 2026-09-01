import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { PencilIcon, Trash2Icon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { mapApiErrorToForm } from '@/lib/form-errors'
import type { ApiError } from '@/lib/api-client'
import { useCondiciones } from '../hooks/use-condiciones'
import type { CondicionFisicaRequest, CondicionFisicaResponse } from '../types'
import { CondicionForm, type CondicionFormValues } from './CondicionForm'

const condicionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string(),
  impideDonacionSangre: z.boolean(),
})

const FORM_DEFAULT_VALUES: CondicionFormValues = {
  nombre: '',
  descripcion: '',
  impideDonacionSangre: false,
}

type CondicionesSectionProps = {
  estudianteId: number
}

export function CondicionesSection({ estudianteId }: CondicionesSectionProps) {
  const condicionesHooks = useCondiciones(estudianteId)
  const { data, isLoading } = condicionesHooks.useList()
  const createMutation = condicionesHooks.useCreate()
  const updateMutation = condicionesHooks.useUpdate()
  const removeMutation = condicionesHooks.useRemove()

  const [editing, setEditing] = useState<CondicionFisicaResponse | null>(null)

  const form = useForm<CondicionFormValues>({
    resolver: zodResolver(condicionSchema),
    defaultValues: FORM_DEFAULT_VALUES,
  })

  const columns: Column<CondicionFisicaResponse>[] = [
    { header: 'Nombre', cell: (row) => row.nombre },
    { header: 'Descripción', cell: (row) => row.descripcion ?? '—' },
    {
      header: 'Impide donación',
      cell: (row) => (
        <Badge variant={row.impideDonacionSangre ? 'destructive' : 'outline'}>
          {row.impideDonacionSangre ? 'Sí' : 'No'}
        </Badge>
      ),
    },
  ]

  function cancelEdit() {
    setEditing(null)
    form.reset(FORM_DEFAULT_VALUES)
  }

  async function onSubmit(values: CondicionFormValues) {
    const body: CondicionFisicaRequest = {
      nombre: values.nombre,
      ...(values.descripcion ? { descripcion: values.descripcion } : {}),
      impideDonacionSangre: values.impideDonacionSangre,
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body })
        toast.success('Condición actualizada')
      } else {
        await createMutation.mutateAsync(body)
        toast.success('Condición agregada')
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
        <CardTitle>{editing ? 'Editar condición' : 'Condiciones físicas'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <CondicionForm
          form={form}
          onSubmit={onSubmit}
          onCancel={cancelEdit}
          isPending={createMutation.isPending || updateMutation.isPending}
        />

        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
          emptyMessage="No hay condiciones físicas registradas"
          rowActions={(row) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-xs" onClick={() => {
                setEditing(row)
                form.reset({
                  nombre: row.nombre,
                  descripcion: row.descripcion ?? '',
                  impideDonacionSangre: row.impideDonacionSangre,
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
                title="Eliminar condición"
                description={`¿Está seguro que desea eliminar "${row.nombre}"?`}
                onConfirm={() =>
                  removeMutation.mutate(row.id, {
                    onError: () => toast.error('No se pudo eliminar la condición'),
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
