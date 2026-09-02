import type { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
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

  const insumoOptions: ComboboxOption[] = insumos.map((insumo) => ({
    value: String(insumo.id),
    label: insumo.nombre,
  }))

  const loteId = form.watch('loteId')
  const loteOptions: ComboboxOption[] = lotes.map((lote) => ({
    value: String(lote.id),
    label: `${lote.numeroLote} — Disp: ${lote.cantidadDisponible}`,
    keywords: [lote.numeroLote],
  }))

  const tipoMovimientoOptions: ComboboxOption[] = [
    { value: 'ENTRADA', label: 'Entrada' },
    { value: 'SALIDA', label: 'Salida' },
    { value: 'AJUSTE', label: 'Ajuste' },
    { value: 'MERMA', label: 'Merma' },
  ]

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
        <Combobox
          options={insumoOptions}
          value={selectedInsumoId ? String(selectedInsumoId) : ''}
          onChange={(value) => {
            form.setValue('insumoId', Number(value))
            form.setValue('loteId', null)
          }}
          placeholder="Seleccione un insumo"
        />
        {form.formState.errors.insumoId && (
          <p className="text-sm text-destructive">{form.formState.errors.insumoId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Lote (opcional)</Label>
        <Combobox
          options={loteOptions}
          value={loteId ? String(loteId) : ''}
          onChange={(value) => form.setValue('loteId', value ? Number(value) : null)}
          disabled={!selectedInsumoId}
          placeholder="Sin lote"
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo de Movimiento</Label>
        <Combobox
          options={tipoMovimientoOptions}
          value={form.watch('tipo')}
          onChange={(value) => form.setValue('tipo', value as TipoMovimiento)}
          placeholder="Seleccione un tipo"
        />
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
        <Textarea
          id="motivo"
          {...form.register('motivo')}
          placeholder="Motivo del movimiento"
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
