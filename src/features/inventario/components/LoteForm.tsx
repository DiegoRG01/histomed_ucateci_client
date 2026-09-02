import type { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { useInsumos } from '../hooks/useInventario'

type LoteFormValues = {
  insumoId: number
  numeroLote: string
  fechaVencimiento: string
  cantidadDisponible: number
}

export type { LoteFormValues }

type LoteFormProps = {
  form: UseFormReturn<LoteFormValues, object, LoteFormValues>
  onSubmit: (values: LoteFormValues) => Promise<void>
  onCancel: () => void
  isPending: boolean
}

export function LoteForm({ form, onSubmit, onCancel, isPending }: LoteFormProps) {
  const { data: insumosData } = useInsumos.useList()
  const insumos = insumosData?.content ?? []
  const insumoOptions: ComboboxOption[] = insumos.map((insumo) => ({
    value: String(insumo.id),
    label: insumo.nombre,
  }))

  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v as LoteFormValues))} className="space-y-4">
      <div className="space-y-2">
        <Label>Insumo</Label>
        <Combobox
          options={insumoOptions}
          value={form.watch('insumoId') ? String(form.watch('insumoId')) : ''}
          onChange={(value) => form.setValue('insumoId', Number(value))}
          placeholder="Seleccione un insumo"
          className="w-full"
        />
        {form.formState.errors.insumoId && (
          <p className="text-sm text-destructive">{form.formState.errors.insumoId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="numeroLote">N° Lote</Label>
        <Input id="numeroLote" {...form.register('numeroLote')} placeholder="Número de lote" />
        {form.formState.errors.numeroLote && (
          <p className="text-sm text-destructive">{form.formState.errors.numeroLote.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
        <Input
          id="fechaVencimiento"
          type="date"
          {...form.register('fechaVencimiento')}
        />
        {form.formState.errors.fechaVencimiento && (
          <p className="text-sm text-destructive">{form.formState.errors.fechaVencimiento.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cantidadDisponible">Cantidad Disponible</Label>
        <Input
          id="cantidadDisponible"
          type="number"
          min={0}
          {...form.register('cantidadDisponible', { valueAsNumber: true })}
          placeholder="0"
        />
        {form.formState.errors.cantidadDisponible && (
          <p className="text-sm text-destructive">{form.formState.errors.cantidadDisponible.message}</p>
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
