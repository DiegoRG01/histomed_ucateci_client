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
import { useCarreras } from '@/features/catalogos/hooks/useCarreras'
import { useSegurosMedicos } from '@/features/catalogos/hooks/useSegurosMedicos'
import type { GrupoSanguineo, Sexo } from '../types'

type EstudianteFormValues = {
  matricula: string
  cedula: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  sexo: '' | Sexo
  grupoSanguineo: '' | GrupoSanguineo
  email: string
  telefono: string
  carreraId: number
  seguroMedicoId: number | null
}

export type { EstudianteFormValues }

type EstudianteFormProps = {
  form: UseFormReturn<EstudianteFormValues, object, EstudianteFormValues>
  onSubmit: (values: EstudianteFormValues) => Promise<void>
  onCancel: () => void
  isPending: boolean
}

const SEXOS: Sexo[] = ['M', 'F', 'OTRO']
const GRUPOS_SANGUINEOS: GrupoSanguineo[] = [
  'O_POS',
  'O_NEG',
  'A_POS',
  'A_NEG',
  'B_POS',
  'B_NEG',
  'AB_POS',
  'AB_NEG',
]

export function EstudianteForm({ form, onSubmit, onCancel, isPending }: EstudianteFormProps) {
  const { data: carrerasData } = useCarreras()
  const carreras = carrerasData ?? []
  const { data: segurosData } = useSegurosMedicos()
  const seguros = segurosData ?? []

  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v as EstudianteFormValues))} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="matricula">Matrícula</Label>
          <Input id="matricula" {...form.register('matricula')} placeholder="Matrícula" />
          {form.formState.errors.matricula && (
            <p className="text-sm text-destructive">{form.formState.errors.matricula.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cedula">Cédula</Label>
          <Input id="cedula" {...form.register('cedula')} placeholder="Cédula" />
          {form.formState.errors.cedula && (
            <p className="text-sm text-destructive">{form.formState.errors.cedula.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" {...form.register('nombre')} placeholder="Nombre" />
          {form.formState.errors.nombre && (
            <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido</Label>
          <Input id="apellido" {...form.register('apellido')} placeholder="Apellido" />
          {form.formState.errors.apellido && (
            <p className="text-sm text-destructive">{form.formState.errors.apellido.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
          <Input id="fechaNacimiento" type="date" {...form.register('fechaNacimiento')} />
          {form.formState.errors.fechaNacimiento && (
            <p className="text-sm text-destructive">{form.formState.errors.fechaNacimiento.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Sexo</Label>
          <Select
            value={form.watch('sexo')}
            onValueChange={(value) => form.setValue('sexo', value as Sexo)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un sexo" />
            </SelectTrigger>
            <SelectContent>
              {SEXOS.map((sexo) => (
                <SelectItem key={sexo} value={sexo}>
                  {sexo === 'OTRO' ? 'Otro' : sexo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.sexo && (
            <p className="text-sm text-destructive">{form.formState.errors.sexo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Grupo sanguíneo</Label>
          <Select
            value={form.watch('grupoSanguineo')}
            onValueChange={(value) => form.setValue('grupoSanguineo', value as GrupoSanguineo)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un grupo sanguíneo" />
            </SelectTrigger>
            <SelectContent>
              {GRUPOS_SANGUINEOS.map((grupo) => (
                <SelectItem key={grupo} value={grupo}>
                  {grupo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.grupoSanguineo && (
            <p className="text-sm text-destructive">{form.formState.errors.grupoSanguineo.message}</p>
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
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" {...form.register('telefono')} placeholder="Teléfono (opcional)" />
        </div>

        <div className="space-y-2">
          <Label>Carrera</Label>
          <Select
            value={form.watch('carreraId') ? String(form.watch('carreraId')) : ''}
            onValueChange={(value) => form.setValue('carreraId', Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione una carrera" />
            </SelectTrigger>
            <SelectContent>
              {carreras.map((carrera) => (
                <SelectItem key={carrera.id} value={String(carrera.id)}>
                  {carrera.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.carreraId && (
            <p className="text-sm text-destructive">{form.formState.errors.carreraId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Seguro médico</Label>
          <Select
            value={form.watch('seguroMedicoId') ? String(form.watch('seguroMedicoId')) : ''}
            onValueChange={(value) =>
              form.setValue('seguroMedicoId', value === '' ? null : Number(value))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sin seguro médico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin seguro médico</SelectItem>
              {seguros.map((seguro) => (
                <SelectItem key={seguro.id} value={String(seguro.id)}>
                  {seguro.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.seguroMedicoId && (
            <p className="text-sm text-destructive">{form.formState.errors.seguroMedicoId.message}</p>
          )}
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
