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
import { useEnfermedades } from '../hooks/use-enfermedades'
import type { EnfermedadRequest, EnfermedadResponse } from '../types'
import { EnfermedadForm, type EnfermedadFormValues } from './EnfermedadForm'

const enfermedadSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  esCronica: z.boolean(),
  impideDonacionSangre: z.boolean(),
})

const FORM_DEFAULT_VALUES: EnfermedadFormValues = {
  nombre: '',
  esCronica: false,
  impideDonacionSangre: false,
}

type EnfermedadesSectionProps = {
  estudianteId: number
}

export function EnfermedadesSection({ estudianteId }: EnfermedadesSectionProps) {
  const enfermedadesHooks = useEnfermedades(estudianteId)
  const { data, isLoading } = enfermedadesHooks.useList()
  const createMutation = enfermedadesHooks.useCreate()
  const updateMutation = enfermedadesHooks.useUpdate()
  const removeMutation = enfermedadesHooks.useRemove()

  const [editing, setEditing] = useState<EnfermedadResponse | null>(null)

  const form = useForm<EnfermedadFormValues>({
    resolver: zodResolver(enfermedadSchema),
    defaultValues: FORM_DEFAULT_VALUES,
  })

  function booleanBadge(value: boolean) {
    return (
      <Badge variant={value ? 'destructive' : 'outline'}>{value ? 'Sí' : 'No'}</Badge>
    )
  }

  const columns: Column<EnfermedadResponse>[] = [
    { header: 'Nombre', cell: (row) => row.nombre },
    { header: 'Crónica', cell: (row) => booleanBadge(row.esCronica) },
    { header: 'Impide donación', cell: (row) => booleanBadge(row.impideDonacionSangre) },
  ]

  function cancelEdit() {
    setEditing(null)
    form.reset(FORM_DEFAULT_VALUES)
  }

  async function onSubmit(values: EnfermedadFormValues) {
    const body: EnfermedadRequest = {
      nombre: values.nombre,
      esCronica: values.esCronica,
      impideDonacionSangre: values.impideDonacionSangre,
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body })
        toast.success('Enfermedad actualizada')
      } else {
        await createMutation.mutateAsync(body)
        toast.success('Enfermedad agregada')
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
        <CardTitle>{editing ? 'Editar enfermedad' : 'Enfermedades'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <EnfermedadForm
          form={form}
          onSubmit={onSubmit}
          onCancel={cancelEdit}
          isPending={createMutation.isPending || updateMutation.isPending}
        />

        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
          emptyMessage="No hay enfermedades registradas"
          rowActions={(row) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-xs" onClick={() => {
                setEditing(row)
                form.reset({
                  nombre: row.nombre,
                  esCronica: row.esCronica,
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
                title="Eliminar enfermedad"
                description={`¿Está seguro que desea eliminar "${row.nombre}"?`}
                onConfirm={() =>
                  removeMutation.mutate(row.id, {
                    onError: () => toast.error('No se pudo eliminar la enfermedad'),
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
