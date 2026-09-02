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
  useUnidadesMedida,
  useCreateUnidadMedida,
  useUpdateUnidadMedida,
  useRemoveUnidadMedida,
} from '../hooks/useUnidadesMedida'
import type { UnidadMedida } from '../types'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  abreviatura: z.string().min(1, 'La abreviatura es obligatoria'),
  descripcion: z.string(),
})

type FormValues = z.infer<typeof schema>

export function UnidadMedidaListPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<UnidadMedida | null>(null)

  const { data, isLoading } = useUnidadesMedida()
  const createMutation = useCreateUnidadMedida()
  const updateMutation = useUpdateUnidadMedida()
  const removeMutation = useRemoveUnidadMedida()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', abreviatura: '', descripcion: '' },
  })

  const columns: Column<UnidadMedida>[] = [
    { header: 'ID', cell: (row) => row.id },
    { header: 'Nombre', cell: (row) => row.nombre },
    { header: 'Abreviatura', cell: (row) => row.abreviatura },
    { header: 'Descripción', cell: (row) => row.descripcion },
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
    form.reset({ nombre: '', abreviatura: '', descripcion: '' })
    setDialogOpen(true)
  }

  function openEdit(row: UnidadMedida) {
    setEditing(row)
    form.reset({ nombre: row.nombre, abreviatura: row.abreviatura, descripcion: row.descripcion })
    setDialogOpen(true)
  }

  async function onSubmit(values: FormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body: values })
        toast.success('Unidad de medida actualizada')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Unidad de medida creada')
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
        title="Unidades de Medida"
        action={
          <Button onClick={openCreate}>
            <PlusIcon className="size-4" />
            Nueva
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        emptyMessage="No hay unidades de medida registradas"
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
              title="Desactivar unidad de medida"
              description={`¿Está seguro que desea desactivar la unidad "${row.nombre}"?`}
              onConfirm={() => removeMutation.mutate(row.id)}
              isPending={removeMutation.isPending}
            />
          </div>
        )}
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Editar unidad de medida' : 'Nueva unidad de medida'}
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...form.register('nombre')} placeholder="Nombre de la unidad de medida" />
            {form.formState.errors.nombre && (
              <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="abreviatura">Abreviatura</Label>
            <Input id="abreviatura" {...form.register('abreviatura')} placeholder="Abreviatura" />
            {form.formState.errors.abreviatura && (
              <p className="text-sm text-destructive">{form.formState.errors.abreviatura.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input id="descripcion" {...form.register('descripcion')} placeholder="Descripción" />
            {form.formState.errors.descripcion && (
              <p className="text-sm text-destructive">{form.formState.errors.descripcion.message}</p>
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
