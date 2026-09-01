import { useState } from 'react'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  DataTable,
  type Column,
} from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormDialog } from '@/components/shared/FormDialog'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { mapApiErrorToForm } from '@/lib/form-errors'
import type { ApiError } from '@/lib/api-client'
import {
  useTiposMedicamento,
  useCreateTipoMedicamento,
  useUpdateTipoMedicamento,
  useRemoveTipoMedicamento,
} from '../hooks/useTiposMedicamento'
import type { TipoMedicamento } from '../types'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
})

type FormValues = z.infer<typeof schema>

export function TipoMedicamentoListPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TipoMedicamento | null>(null)

  const { data, isLoading } = useTiposMedicamento()
  const createMutation = useCreateTipoMedicamento()
  const updateMutation = useUpdateTipoMedicamento()
  const removeMutation = useRemoveTipoMedicamento()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '' },
  })

  const columns: Column<TipoMedicamento>[] = [
    { header: 'ID', cell: (row) => row.id },
    { header: 'Nombre', cell: (row) => row.nombre },
    {
      header: 'Estado',
      cell: (row) => (
        <Badge variant={row.activo ? 'default' : 'secondary'}>
          {row.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ]

  function openCreate() {
    setEditing(null)
    form.reset({ nombre: '' })
    setDialogOpen(true)
  }

  function openEdit(row: TipoMedicamento) {
    setEditing(row)
    form.reset({ nombre: row.nombre })
    setDialogOpen(true)
  }

  async function onSubmit(values: FormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body: values })
        toast.success('Tipo de medicamento actualizado')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Tipo de medicamento creado')
      }
      setDialogOpen(false)
      form.reset()
    } catch (error) {
      mapApiErrorToForm(error as ApiError, form.setError)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Medicamento"
        action={
          <Button onClick={openCreate}>
            <PlusIcon className="size-4" />
            Nuevo
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.content ?? []}
        isLoading={isLoading}
        emptyMessage="No hay tipos de medicamento registrados"
        rowActions={(row) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => openEdit(row)}
            >
              <PencilIcon />
            </Button>
            <ConfirmDeleteDialog
              trigger={
                <Button variant="ghost" size="icon-xs">
                  <Trash2Icon />
                </Button>
              }
              title="Desactivar tipo de medicamento"
              description={`¿Está seguro que desea desactivar "${row.nombre}"?`}
              onConfirm={() => removeMutation.mutate(row.id)}
              isPending={removeMutation.isPending}
            />
          </div>
        )}
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Editar tipo de medicamento' : 'Nuevo tipo de medicamento'}
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...form.register('nombre')} placeholder="Nombre del tipo de medicamento" />
            {form.formState.errors.nombre && (
              <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </FormDialog>
    </div>
  )
}