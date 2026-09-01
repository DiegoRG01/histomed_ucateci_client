import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { mapApiErrorToForm } from '@/lib/form-errors'
import type { ApiError } from '@/lib/api-client'
import { useEstudiantes } from '../hooks/use-estudiantes'
import type {
  CreateEstudianteRequest,
  EstudianteResponse,
  GrupoSanguineo,
  Sexo,
} from '../types'
import { EstudianteForm, type EstudianteFormValues } from './EstudianteForm'

const schema = z.object({
  matricula: z.string().min(1, 'La matrícula es obligatoria'),
  cedula: z.string().min(1, 'La cédula es obligatoria'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  fechaNacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
  sexo: z.enum(['', 'M', 'F', 'OTRO']).refine((v) => v !== '', { message: 'Seleccione un sexo' }),
  grupoSanguineo: z
    .enum(['', 'O_POS', 'O_NEG', 'A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG'])
    .refine((v) => v !== '', { message: 'Seleccione un grupo sanguíneo' }),
  email: z.string().min(1, 'El email es obligatorio').email('Ingrese un email válido'),
  telefono: z.string(),
  carreraId: z.number().min(1, 'Seleccione una carrera'),
  seguroMedicoId: z.number().nullable(),
})

const FORM_DEFAULT_VALUES: EstudianteFormValues = {
  matricula: '',
  cedula: '',
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  sexo: '',
  grupoSanguineo: '',
  email: '',
  telefono: '',
  carreraId: 0,
  seguroMedicoId: null,
}

function resetValuesFrom(row: EstudianteResponse): EstudianteFormValues {
  return {
    matricula: row.matricula,
    cedula: row.cedula,
    nombre: row.nombre,
    apellido: row.apellido,
    fechaNacimiento: row.fechaNacimiento,
    sexo: row.sexo as Sexo,
    grupoSanguineo: row.grupoSanguineo as GrupoSanguineo,
    email: row.email,
    telefono: row.telefono,
    carreraId: row.carreraId,
    seguroMedicoId: row.seguroMedicoId,
  }
}

type DatosPersonalesTabProps = {
  estudiante: EstudianteResponse | null
  onCreated: (result: EstudianteResponse) => void
}

export function DatosPersonalesTab({ estudiante, onCreated }: DatosPersonalesTabProps) {
  const createMutation = useEstudiantes.useCreate()
  const updateMutation = useEstudiantes.useUpdate()

  const form = useForm<EstudianteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: estudiante ? resetValuesFrom(estudiante) : FORM_DEFAULT_VALUES,
  })

  useEffect(() => {
    if (estudiante && !form.formState.isDirty) form.reset(resetValuesFrom(estudiante))
  }, [estudiante, form])

  async function onSubmit(values: EstudianteFormValues) {
    const body: CreateEstudianteRequest = {
      matricula: values.matricula,
      cedula: values.cedula,
      nombre: values.nombre,
      apellido: values.apellido,
      fechaNacimiento: values.fechaNacimiento,
      sexo: values.sexo as Sexo,
      grupoSanguineo: values.grupoSanguineo as GrupoSanguineo,
      email: values.email,
      telefono: values.telefono || undefined,
      carreraId: values.carreraId,
      seguroMedicoId: values.seguroMedicoId ?? undefined,
    }
    try {
      if (estudiante) {
        const updated = await updateMutation.mutateAsync({ id: estudiante.id, body })
        toast.success('Estudiante actualizado')
        form.reset(resetValuesFrom(updated))
        onCreated(updated)
      } else {
        const created = await createMutation.mutateAsync(body)
        toast.success('Estudiante creado. Ahora puede completar sus referencias e historial clínico.')
        onCreated(created)
      }
    } catch (error) {
      mapApiErrorToForm(error as ApiError, form.setError)
    }
  }

  return (
    <EstudianteForm
      form={form}
      onSubmit={onSubmit}
      onCancel={() => history.back()}
      isPending={createMutation.isPending || updateMutation.isPending}
    />
  )
}
