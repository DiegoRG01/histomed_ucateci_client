import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
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
import { mapApiErrorToForm } from '@/lib/form-errors'
import type { ApiError } from '@/lib/api-client'
import { useLotes, useInsumos } from '../hooks/useInventario'
import { useMovimientos, useCreateMovimiento } from '../hooks/useMovimientos'
import type { MovimientoInventario } from '../types'
import { MovimientoForm, type MovimientoFormValues } from './MovimientoForm'

const schema = z.object({
  insumoId: z.number().min(1, 'Seleccione un insumo'),
  loteId: z.number().nullable(),
  tipo: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA']),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  motivo: z.string().min(1, 'El motivo es obligatorio'),
})

const tipoBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ENTRADA: 'default',
  SALIDA: 'destructive',
  AJUSTE: 'secondary',
  MERMA: 'outline',
}

export function MovimientoInventarioListPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: movimientosData, isLoading } = useMovimientos()
  const { data: lotesData } = useLotes.useList()
  const { data: insumosData } = useInsumos.useList()
  const createMutation = useCreateMovimiento()

  const form = useForm<MovimientoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      insumoId: 0,
      loteId: null,
      tipo: 'ENTRADA',
      cantidad: 1,
      motivo: '',
    },
  })

  function getLoteNumero(loteId: number | null): string {
    if (!loteId) return 'Sin lote'
    const lote = lotesData?.content?.find((l) => l.id === loteId)
    return lote?.numeroLote ?? `Lote #${loteId}`
  }

  function getInsumoNombre(insumoId: number): string {
    const insumo = insumosData?.content?.find((i) => i.id === insumoId)
    return insumo?.nombre ?? `Insumo #${insumoId}`
  }

  const columns: Column<MovimientoInventario>[] = [
    { header: 'ID', cell: (row) => row.id },
    { header: 'Insumo', cell: (row) => getInsumoNombre(row.insumoId) },
    { header: 'Lote', cell: (row) => getLoteNumero(row.loteId) },
    {
      header: 'Tipo',
      cell: (row) => (
        <Badge variant={tipoBadgeVariant[row.tipo] ?? 'secondary'}>
          {row.tipo}
        </Badge>
      ),
    },
    { header: 'Cantidad', cell: (row) => row.cantidad },
    { header: 'Fecha', cell: (row) => row.fecha },
    { header: 'Motivo', cell: (row) => row.motivo },
    { header: 'Usuario ID', cell: (row) => row.usuarioId },
  ]

  function openCreate() {
    form.reset({
      insumoId: 0,
      loteId: null,
      tipo: 'ENTRADA',
      cantidad: 1,
      motivo: '',
    })
    setDialogOpen(true)
  }

  async function onSubmit(values: MovimientoFormValues) {
    try {
      const tipo = values.tipo as MovimientoInventario['tipo']
      await createMutation.mutateAsync({
        insumoId: values.insumoId,
        loteId: values.loteId,
        tipo,
        cantidad: values.cantidad,
        motivo: values.motivo,
      })
      toast.success('Movimiento registrado')
      setDialogOpen(false)
      form.reset()
    } catch (error) {
      mapApiErrorToForm(error as ApiError, form.setError)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos de Inventario"
        action={
          <Button onClick={openCreate}>
            <PlusIcon className="size-4" />
            Nuevo
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={movimientosData ?? []}
        isLoading={isLoading}
        emptyMessage="No hay movimientos registrados"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Registrar movimiento"
      >
        <MovimientoForm
          form={form}
          onSubmit={onSubmit}
          onCancel={() => setDialogOpen(false)}
          isPending={createMutation.isPending}
        />
      </FormDialog>
    </div>
  )
}
