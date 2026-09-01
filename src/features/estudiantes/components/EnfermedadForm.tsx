import type { UseFormReturn } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

export type EnfermedadFormValues = {
  nombre: string
  esCronica: boolean
  impideDonacionSangre: boolean
}

type EnfermedadFormProps = {
  form: UseFormReturn<EnfermedadFormValues, object, EnfermedadFormValues>
  onSubmit: (values: EnfermedadFormValues) => Promise<void>
  onCancel: () => void
  isPending: boolean
}

export function EnfermedadForm({ form, onSubmit, onCancel, isPending }: EnfermedadFormProps) {
  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v as EnfermedadFormValues))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="enfermedad-nombre">Nombre</Label>
        <Input id="enfermedad-nombre" {...form.register('nombre')} placeholder="Nombre de la enfermedad" />
        {form.formState.errors.nombre && (
          <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Checkbox
            id="enfermedad-cronica"
            checked={form.watch('esCronica')}
            onCheckedChange={(checked) => form.setValue('esCronica', checked === true)}
          />
          <Label htmlFor="enfermedad-cronica" className="cursor-pointer">
            Crónica
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="enfermedad-impide-donacion"
            checked={form.watch('impideDonacionSangre')}
            onCheckedChange={(checked) => form.setValue('impideDonacionSangre', checked === true)}
          />
          <Label htmlFor="enfermedad-impide-donacion" className="cursor-pointer">
            Impide donación de sangre
          </Label>
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
