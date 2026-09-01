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
import { useMedicamentos } from '../hooks/useInventario'
import type { Medicamento } from '../types'
import { MedicamentoForm, type MedicamentoFormValues } from './MedicamentoForm'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipo: z.enum(['MEDICAMENTO', 'INSUMO']),
  unidadMedida: z.string().min(1, 'La unidad de medida es obligatoria'),
  stockMinimo: z.number().min(0, 'El stock mínimo debe ser mayor o igual a 0'),
  controlado: z.boolean(),
  concentracion: z.string(),
  viaAdministracion: z.string(),
  tiposMedicamentoIds: z.array(z.number()).min(1, 'Seleccione al menos un tipo de medicamento'),
})

export function MedicamentoListPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Medicamento | null>(null)

  const { data, isLoading } = useMedicamentos.useList()
  const createMutation = useMedicamentos.useCreate()
  const updateMutation = useMedicamentos.useUpdate()
  const removeMutation = useMedicamentos.useRemove()

  const form = useForm<MedicamentoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      tipo: 'MEDICAMENTO',
      unidadMedida: '',
      stockMinimo: 0,
      controlado: false,
      concentracion: '',
      viaAdministracion: '',
      tiposMedicamentoIds: [],
    },
  })

  const columns: Column<Medicamento>[] = [
    { header: 'ID', cell: (row) => row.id },
    { header: 'Nombre', cell: (row) => row.nombre },
    { header: 'Tipo', cell: (row) => row.tipo },
    { header: 'Unidad Medida', cell: (row) => row.unidadMedida },
    { header: 'Stock Mínimo', cell: (row) => row.stockMinimo },
    {
      header: 'Controlado',
      cell: (row) => (
        <Badge variant={row.controlado ? 'default' : 'secondary'}>
          {row.controlado ? 'Sí' : 'No'}
        </Badge>
      ),
    },
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
      nombre: '',
      tipo: 'MEDICAMENTO',
      unidadMedida: '',
      stockMinimo: 0,
      controlado: false,
      concentracion: '',
      viaAdministracion: '',
      tiposMedicamentoIds: [],
    })
    setDialogOpen(true)
  }

  function openEdit(row: Medicamento) {
    setEditing(row)
    form.reset({
      nombre: row.nombre,
      tipo: row.tipo,
      unidadMedida: row.unidadMedida,
      stockMinimo: row.stockMinimo,
      controlado: row.controlado,
      concentracion: row.concentracion,
      viaAdministracion: row.viaAdministracion,
      tiposMedicamentoIds: row.tiposMedicamentoIds,
    })
    setDialogOpen(true)
  }

  async function onSubmit(values: MedicamentoFormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body: values })
        toast.success('Medicamento actualizado')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Medicamento creado')
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
        title="Medicamentos"
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
        emptyMessage="No hay medicamentos registrados"
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
              title="Desactivar medicamento"
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
        title={editing ? 'Editar medicamento' : 'Nuevo medicamento'}
      >
        <MedicamentoForm
          form={form}
          onSubmit={onSubmit}
          onCancel={() => setDialogOpen(false)}
          isPending={isPending}
        />
      </FormDialog>
    </div>
  )
}
