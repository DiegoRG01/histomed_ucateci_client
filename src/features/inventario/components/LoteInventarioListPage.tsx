import { useState } from 'react'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import { useLotes } from '../hooks/useInventario'
import type { LoteInventario } from '../types'
import { LoteForm, type LoteFormValues } from './LoteForm'

const schema = z.object({
  insumoId: z.number().min(1, 'Seleccione un insumo'),
  numeroLote: z.string().min(1, 'El número de lote es obligatorio'),
  fechaVencimiento: z.string().min(1, 'La fecha de vencimiento es obligatoria'),
  cantidadDisponible: z.number().min(0, 'La cantidad debe ser mayor o igual a 0'),
})

export function LoteInventarioListPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LoteInventario | null>(null)

  const { data, isLoading } = useLotes.useList()
  const createMutation = useLotes.useCreate()
  const updateMutation = useLotes.useUpdate()
  const removeMutation = useLotes.useRemove()

  const form = useForm<LoteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      insumoId: 0,
      numeroLote: '',
      fechaVencimiento: '',
      cantidadDisponible: 0,
    },
  })

  const columns: Column<LoteInventario>[] = [
    { header: 'ID', cell: (row) => row.id },
    { header: 'Insumo', cell: (row) => row.insumoNombre },
    { header: 'N° Lote', cell: (row) => row.numeroLote },
    { header: 'Fecha Vencimiento', cell: (row) => row.fechaVencimiento },
    { header: 'Cantidad', cell: (row) => row.cantidadDisponible },
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
    form.reset({
      insumoId: 0,
      numeroLote: '',
      fechaVencimiento: '',
      cantidadDisponible: 0,
    })
    setDialogOpen(true)
  }

  function openEdit(row: LoteInventario) {
    setEditing(row)
    form.reset({
      insumoId: row.insumoId,
      numeroLote: row.numeroLote,
      fechaVencimiento: row.fechaVencimiento,
      cantidadDisponible: row.cantidadDisponible,
    })
    setDialogOpen(true)
  }

  async function onSubmit(values: LoteFormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body: values })
        toast.success('Lote actualizado')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Lote creado')
      }
      setDialogOpen(false)
      form.reset()
    } catch (error) {
      mapApiErrorToForm(error as ApiError, form.setError)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lotes de Inventario"
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
        emptyMessage="No hay lotes registrados"
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
              title="Desactivar lote"
              description={`¿Está seguro que desea desactivar el lote "${row.numeroLote}"?`}
              onConfirm={() => removeMutation.mutate(row.id)}
              isPending={removeMutation.isPending}
            />
          </div>
        )}
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Editar lote' : 'Nuevo lote'}
      >
        <LoteForm
          form={form}
          onSubmit={onSubmit}
          onCancel={() => setDialogOpen(false)}
          isPending={isPending}
        />
      </FormDialog>
    </div>
  )
}
