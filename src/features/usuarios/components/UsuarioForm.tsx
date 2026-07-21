import type { UseFormReturn } from 'react-hook-form'
import { ROL_NOMBRES } from '../types'
import type { RolNombre } from '../types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

type UsuarioFormValues = {
  username: string
  password: string
  nombreCompleto: string
  email: string
  roles: RolNombre[]
}

export type { UsuarioFormValues }

type UsuarioFormProps = {
  form: UseFormReturn<UsuarioFormValues, object, UsuarioFormValues>
  onSubmit: (values: UsuarioFormValues) => Promise<void>
  onCancel: () => void
  isPending: boolean
}

export function UsuarioForm({ form, onSubmit, onCancel, isPending }: UsuarioFormProps) {
  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v as UsuarioFormValues))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" {...form.register('username')} placeholder="Nombre de usuario" />
        {form.formState.errors.username && (
          <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" {...form.register('password')} placeholder="Contraseña" />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nombreCompleto">Nombre completo</Label>
        <Input id="nombreCompleto" {...form.register('nombreCompleto')} placeholder="Nombre y apellidos" />
        {form.formState.errors.nombreCompleto && (
          <p className="text-sm text-destructive">{form.formState.errors.nombreCompleto.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register('email')} placeholder="correo@ejemplo.com" />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Roles</Label>
        <div className="grid grid-cols-2 gap-2">
          {ROL_NOMBRES.map((rol) => (
            <label key={rol} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.watch('roles')?.includes(rol)}
                onCheckedChange={(checked) => {
                  const current = form.getValues('roles') ?? []
                  if (checked) {
                    form.setValue('roles', [...current, rol])
                  } else {
                    form.setValue('roles', current.filter((r) => r !== rol))
                  }
                }}
              />
              {rol}
            </label>
          ))}
        </div>
        {form.formState.errors.roles && (
          <p className="text-sm text-destructive">{form.formState.errors.roles.message}</p>
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
