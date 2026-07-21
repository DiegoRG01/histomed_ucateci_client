import type { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTiposMedicamento } from '@/features/catalogos/hooks/useTiposMedicamento'
import type { TipoInsumo } from '../types'

type MedicamentoFormValues = {
  nombre: string
  tipo: TipoInsumo
  unidadMedida: string
  stockMinimo: number
  controlado: boolean
  concentracion: string
  viaAdministracion: string
  tiposMedicamentoIds: number[]
}

export type { MedicamentoFormValues }

type MedicamentoFormProps = {
  form: UseFormReturn<MedicamentoFormValues, object, MedicamentoFormValues>
  onSubmit: (values: MedicamentoFormValues) => Promise<void>
  onCancel: () => void
  isPending: boolean
}

export function MedicamentoForm({ form, onSubmit, onCancel, isPending }: MedicamentoFormProps) {
  const { data: tiposData } = useTiposMedicamento()
  const tiposMedicamento = tiposData?.content ?? []

  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v as MedicamentoFormValues))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" {...form.register('nombre')} placeholder="Nombre del medicamento" />
        {form.formState.errors.nombre && (
          <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select
          value={form.watch('tipo')}
          onValueChange={(value) => form.setValue('tipo', value as TipoInsumo)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccione un tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEDICAMENTO">Medicamento</SelectItem>
            <SelectItem value="INSUMO">Insumo</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.tipo && (
          <p className="text-sm text-destructive">{form.formState.errors.tipo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="unidadMedida">Unidad de Medida</Label>
        <Input id="unidadMedida" {...form.register('unidadMedida')} placeholder="Unidad de medida" />
        {form.formState.errors.unidadMedida && (
          <p className="text-sm text-destructive">{form.formState.errors.unidadMedida.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="stockMinimo">Stock Mínimo</Label>
        <Input
          id="stockMinimo"
          type="number"
          min={0}
          {...form.register('stockMinimo', { valueAsNumber: true })}
          placeholder="0"
        />
        {form.formState.errors.stockMinimo && (
          <p className="text-sm text-destructive">{form.formState.errors.stockMinimo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="concentracion">Concentración</Label>
        <Input id="concentracion" {...form.register('concentracion')} placeholder="Concentración (opcional)" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="viaAdministracion">Vía de Administración</Label>
        <Input id="viaAdministracion" {...form.register('viaAdministracion')} placeholder="Vía de administración (opcional)" />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="controlado"
          checked={form.watch('controlado')}
          onCheckedChange={(checked) => form.setValue('controlado', checked === true)}
        />
        <Label htmlFor="controlado" className="cursor-pointer">Controlado</Label>
      </div>

      {tiposMedicamento.length > 0 && (
        <div className="space-y-2">
          <Label>Tipos de Medicamento</Label>
          <div className="grid grid-cols-2 gap-2">
            {tiposMedicamento.map((tipo) => (
              <label key={tipo.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.watch('tiposMedicamentoIds')?.includes(tipo.id)}
                  onCheckedChange={(checked) => {
                    const current = form.getValues('tiposMedicamentoIds') ?? []
                    if (checked) {
                      form.setValue('tiposMedicamentoIds', [...current, tipo.id])
                    } else {
                      form.setValue('tiposMedicamentoIds', current.filter((id) => id !== tipo.id))
                    }
                  }}
                />
                {tipo.nombre}
              </label>
            ))}
          </div>
        </div>
      )}

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
