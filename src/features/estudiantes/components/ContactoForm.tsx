import type { UseFormReturn } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

export type ContactoFormValues = {
  nombre: string
  telefono: string
  email: string
  parentesco: string
  esPrincipal: boolean
}

type ContactoFormProps = {
  form: UseFormReturn<ContactoFormValues, object, ContactoFormValues>
  onSubmit: (values: ContactoFormValues) => Promise<void>
  onCancel: () => void
  isPending: boolean
  mode: 'crear' | 'editar'
}

export function ContactoForm({ form, onSubmit, onCancel, isPending, mode }: ContactoFormProps) {
  const editando = mode === 'editar'

  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v as ContactoFormValues))} className="space-y-4">
      {editando && (
        <p className="text-xs text-muted-foreground">
          El nombre, teléfono y email pertenecen al catálogo de contactos y no pueden modificarse aquí.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contacto-nombre">Nombre</Label>
          <Input
            id="contacto-nombre"
            {...form.register('nombre')}
            disabled={editando}
            placeholder="Nombre del contacto"
          />
          {form.formState.errors.nombre && (
            <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contacto-telefono">Teléfono</Label>
          <Input
            id="contacto-telefono"
            {...form.register('telefono')}
            disabled={editando}
            placeholder="Teléfono del contacto"
          />
          {form.formState.errors.telefono && (
            <p className="text-sm text-destructive">{form.formState.errors.telefono.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contacto-email">Email</Label>
          <Input
            id="contacto-email"
            {...form.register('email')}
            disabled={editando}
            placeholder="Email (opcional)"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contacto-parentesco">Parentesco</Label>
          <Input
            id="contacto-parentesco"
            {...form.register('parentesco')}
            placeholder="Parentesco (opcional)"
          />
          {form.formState.errors.parentesco && (
            <p className="text-sm text-destructive">{form.formState.errors.parentesco.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="contacto-es-principal"
          checked={form.watch('esPrincipal')}
          onCheckedChange={(checked) => form.setValue('esPrincipal', checked === true)}
        />
        <Label htmlFor="contacto-es-principal" className="cursor-pointer">
          Contacto principal
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
