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
import { useMedicamentos } from '@/features/inventario/hooks/useInventario'

export type MedicamentoHabitualFormValues = {
  medicamentoId: number
  dosis: string
  frecuencia: string
}

type MedicamentoHabitualFormProps = {
  form: UseFormReturn<MedicamentoHabitualFormValues, object, MedicamentoHabitualFormValues>
  onSubmit: (values: MedicamentoHabitualFormValues) => Promise<void>
  onCancel: () => void
  isPending: boolean
}

export function MedicamentoHabitualForm({
  form,
  onSubmit,
  onCancel,
  isPending,
}: MedicamentoHabitualFormProps) {
  const { data: medicamentosData } = useMedicamentos.useList({ size: 100 })
  const medicamentos = medicamentosData?.content ?? []
  const medicamentoId = form.watch('medicamentoId')

  return (
    <form
      onSubmit={form.handleSubmit((v) => onSubmit(v as MedicamentoHabitualFormValues))}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Medicamento</Label>
          <Select
            value={medicamentoId ? String(medicamentoId) : ''}
            onValueChange={(value) => form.setValue('medicamentoId', Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un medicamento" />
            </SelectTrigger>
            <SelectContent>
              {medicamentos.map((medicamento) => (
                <SelectItem key={medicamento.id} value={String(medicamento.id)}>
                  {medicamento.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.medicamentoId && (
            <p className="text-sm text-destructive">{form.formState.errors.medicamentoId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="medicamento-habitual-dosis">Dosis</Label>
          <Input
            id="medicamento-habitual-dosis"
            {...form.register('dosis')}
            placeholder="Dosis (opcional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="medicamento-habitual-frecuencia">Frecuencia</Label>
          <Input
            id="medicamento-habitual-frecuencia"
            {...form.register('frecuencia')}
            placeholder="Frecuencia (opcional)"
          />
        </div>
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
