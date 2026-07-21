import type { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInsumos, useLotes } from '../hooks/useInventario'
import type { TipoMovimiento } from '../types'

type MovimientoFormValues = {
  insumoId: number
  loteId: number | null
  tipo: TipoMovimiento
  cantidad: number
  motivo: string
}

export type { MovimientoFormValues }

type MovimientoFormProps = {
  form: UseFormReturn<MovimientoFormValues, object, MovimientoFormValues>
  onSubmit: (values: MovimientoFormValues) => Promise<void>
  onCancel: () => void
  isPending: boolean
}

export function MovimientoForm({ form, onSubmit, onCancel, isPending }: MovimientoFormProps) {
  const { data: insumosData } = useInsumos.useList()
  const insumos = insumosData?.content ?? []

  const { data: lotesData } = useLotes.useList()
  const selectedInsumoId = form.watch('insumoId')
  const lotes = (lotesData?.content ?? []).filter(
    (lote) => lote.insumoId === selectedInsumoId && lote.activo,
  )
  async function handleSubmit(values: MovimientoFormValues) {
    if (['SALIDA', 'AJUSTE', 'MERMA'].includes(values.tipo) && values.loteId) {
      const lote = lotes.find((l) => l.id === values.loteId)
      if (lote && values.cantidad > lote.cantidadDisponible) {
        form.setError('cantidad', {
          message: `La cantidad (${values.cantidad}) excede la disponible en el lote (${lote.cantidadDisponible})`,
        })
        return
      }
    }
    await onSubmit(values)
  }

  return (
    <form onSubmit={form.handleSubmit((v) => handleSubmit(v as MovimientoFormValues))} className="space-y-4">
      <div className="space-y-2">
        <Label>Insumo</Label>
        <Select
          value={form.watch('insumoId') ? String(form.watch('insumoId')) : ''}
          onValueChange={(value) => {
            form.setValue('insumoId', Number(value))
            form.setValue('loteId', null)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccione un insumo" />
          </SelectTrigger>
          <SelectContent>
            {insumos.map((insumo) => (
              <SelectItem key={insumo.id} value={String(insumo.id)}>
                {insumo.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.insumoId && (
          <p className="text-sm text-destructive">{form.formState.errors.insumoId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Lote (opcional)</Label>
        <Select
          value={form.watch('loteId') ? String(form.watch('loteId')) : ''}
          onValueChange={(value) => form.setValue('loteId', value ? Number(value) : null)}
          disabled={!selectedInsumoId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sin lote" />
          </SelectTrigger>
          <SelectContent>
            {lotes.map((lote) => (
              <SelectItem key={lote.id} value={String(lote.id)}>
                {lote.numeroLote} — Disp: {lote.cantidadDisponible}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tipo de Movimiento</Label>
        <Select
          value={form.watch('tipo')}
          onValueChange={(value) => form.setValue('tipo', value as TipoMovimiento)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccione un tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ENTRADA">Entrada</SelectItem>
            <SelectItem value="SALIDA">Salida</SelectItem>
            <SelectItem value="AJUSTE">Ajuste</SelectItem>
            <SelectItem value="MERMA">Merma</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.tipo && (
          <p className="text-sm text-destructive">{form.formState.errors.tipo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cantidad">Cantidad</Label>
        <Input
          id="cantidad"
          type="number"
          min={1}
          {...form.register('cantidad', { valueAsNumber: true })}
          placeholder="0"
        />
        {form.formState.errors.cantidad && (
          <p className="text-sm text-destructive">{form.formState.errors.cantidad.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="motivo">Motivo</Label>
        <textarea
          id="motivo"
          {...form.register('motivo')}
          placeholder="Motivo del movimiento"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {form.formState.errors.motivo && (
          <p className="text-sm text-destructive">{form.formState.errors.motivo.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
