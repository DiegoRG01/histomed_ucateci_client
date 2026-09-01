import type { UseFormReturn } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type MedicoReferenciaFormValues = {
  nombre: string
  especialidad: string
  telefono: string
  hospitalClinica: string
}

export type { MedicoReferenciaFormValues }

type MedicoReferenciaFormProps = {
  form: UseFormReturn<MedicoReferenciaFormValues, object, MedicoReferenciaFormValues>
  onSubmit: (values: MedicoReferenciaFormValues) => Promise<void>
  isPending: boolean
}

export function MedicoReferenciaForm({ form, onSubmit, isPending }: MedicoReferenciaFormProps) {
  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v as MedicoReferenciaFormValues))} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="medico-nombre">Nombre</Label>
          <Input id="medico-nombre" {...form.register('nombre')} placeholder="Nombre del médico" />
          {form.formState.errors.nombre && (
            <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="medico-especialidad">Especialidad</Label>
          <Input
            id="medico-especialidad"
            {...form.register('especialidad')}
            placeholder="Especialidad"
          />
          {form.formState.errors.especialidad && (
            <p className="text-sm text-destructive">{form.formState.errors.especialidad.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="medico-telefono">Teléfono</Label>
          <Input id="medico-telefono" {...form.register('telefono')} placeholder="Teléfono" />
          {form.formState.errors.telefono && (
            <p className="text-sm text-destructive">{form.formState.errors.telefono.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="medico-hospital">Hospital / Clínica</Label>
          <Input
            id="medico-hospital"
            {...form.register('hospitalClinica')}
            placeholder="Hospital o clínica"
          />
          {form.formState.errors.hospitalClinica && (
            <p className="text-sm text-destructive">{form.formState.errors.hospitalClinica.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
