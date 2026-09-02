import type { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { useMedicamentos } from '@/features/inventario/hooks/useInventario'
import type { TipoAlergia } from '../types'

type AlergiaFormValues = {
  nombre: string
  tipoAlergia: '' | TipoAlergia
  medicamentoId: number | null
}

export type { AlergiaFormValues }

type AlergiaFormProps = {
  form: UseFormReturn<AlergiaFormValues, object, AlergiaFormValues>
  onSubmit: (values: AlergiaFormValues) => Promise<void>
  onCancel: () => void
  isPending: boolean
}

const TIPOS_ALERGIA: TipoAlergia[] = ['MEDICAMENTO', 'ALIMENTO', 'AMBIENTAL', 'OTRO']

const TIPO_LABELS: Record<TipoAlergia, string> = {
  MEDICAMENTO: 'Medicamento',
  ALIMENTO: 'Alimento',
  AMBIENTAL: 'Ambiental',
  OTRO: 'Otro',
}

export { TIPO_LABELS }

export function AlergiaForm({ form, onSubmit, onCancel, isPending }: AlergiaFormProps) {
  const { data: medicamentosData } = useMedicamentos.useList({ size: 100 })
  const medicamentos = medicamentosData?.content ?? []
  const tipoAlergia = form.watch('tipoAlergia')
  const medicamentoId = form.watch('medicamentoId')

  const tipoOptions: ComboboxOption[] = TIPOS_ALERGIA.map((tipo) => ({
    value: tipo,
    label: TIPO_LABELS[tipo],
  }))

  const medicamentoOptions: ComboboxOption[] = medicamentos.map((medicamento) => ({
    value: String(medicamento.id),
    label: medicamento.nombre,
  }))

  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v as AlergiaFormValues))} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="alergia-nombre">Nombre</Label>
          <Input id="alergia-nombre" {...form.register('nombre')} placeholder="Nombre de la alergia" />
          {form.formState.errors.nombre && (
            <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Tipo de alergia</Label>
          <Combobox
            options={tipoOptions}
            value={tipoAlergia}
            onChange={(value) => {
              form.setValue('tipoAlergia', value as TipoAlergia)
              if (value !== 'MEDICAMENTO') {
                form.setValue('medicamentoId', null)
              }
            }}
            placeholder="Seleccione un tipo"
          />
          {form.formState.errors.tipoAlergia && (
            <p className="text-sm text-destructive">{form.formState.errors.tipoAlergia.message}</p>
          )}
        </div>

        {tipoAlergia === 'MEDICAMENTO' && (
          <div className="space-y-2">
            <Label>Medicamento</Label>
            <Combobox
              options={medicamentoOptions}
              value={medicamentoId ? String(medicamentoId) : ''}
              onChange={(value) => form.setValue('medicamentoId', value === '' ? null : Number(value))}
              placeholder="Seleccione un medicamento"
            />
            {form.formState.errors.medicamentoId && (
              <p className="text-sm text-destructive">{form.formState.errors.medicamentoId.message}</p>
            )}
          </div>
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
