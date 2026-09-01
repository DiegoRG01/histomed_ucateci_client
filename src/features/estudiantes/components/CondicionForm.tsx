import type { UseFormReturn } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

export type CondicionFormValues = {
  nombre: string
  descripcion: string
  impideDonacionSangre: boolean
}

type CondicionFormProps = {
  form: UseFormReturn<CondicionFormValues, object, CondicionFormValues>
  onSubmit: (values: CondicionFormValues) => Promise<void>
  onCancel: () => void
  isPending: boolean
}

export function CondicionForm({ form, onSubmit, onCancel, isPending }: CondicionFormProps) {
  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v as CondicionFormValues))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="condicion-nombre">Nombre</Label>
        <Input id="condicion-nombre" {...form.register('nombre')} placeholder="Nombre de la condición" />
        {form.formState.errors.nombre && (
          <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="condicion-descripcion">Descripción</Label>
        <Textarea
          id="condicion-descripcion"
          {...form.register('descripcion')}
          placeholder="Descripción (opcional)"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="condicion-impide-donacion"
          checked={form.watch('impideDonacionSangre')}
          onCheckedChange={(checked) => form.setValue('impideDonacionSangre', checked === true)}
        />
        <Label htmlFor="condicion-impide-donacion" className="cursor-pointer">
          Impide donación de sangre
        </Label>
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
