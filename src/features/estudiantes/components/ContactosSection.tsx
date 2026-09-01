import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { PencilIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { mapApiErrorToForm } from '@/lib/form-errors'
import type { ApiError } from '@/lib/api-client'
import { useContactosEstudiante } from '../hooks/use-contactos-estudiante'
import { useCreateContacto } from '../hooks/use-contactos'
import type { ContactoEstudianteResponse } from '../types'
import { ContactoForm, type ContactoFormValues } from './ContactoForm'

const contactoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  email: z.string(),
  parentesco: z.string(),
  esPrincipal: z.boolean(),
})

const FORM_DEFAULT_VALUES: ContactoFormValues = {
  nombre: '',
  telefono: '',
  email: '',
  parentesco: '',
  esPrincipal: false,
}

type ContactosSectionProps = {
  estudianteId: number
}

export function ContactosSection({ estudianteId }: ContactosSectionProps) {
  const contactosHooks = useContactosEstudiante(estudianteId)
  const { data, isLoading } = contactosHooks.useList()
  const createContactoEstudianteMutation = contactosHooks.useCreate()
  const updateMutation = contactosHooks.useUpdate()
  const removeMutation = contactosHooks.useRemove()

  const createContactoMutation = useCreateContacto()

  const [editing, setEditing] = useState<ContactoEstudianteResponse | null>(null)

  const form = useForm<ContactoFormValues>({
    resolver: zodResolver(contactoSchema),
    defaultValues: FORM_DEFAULT_VALUES,
  })

  const columns: Column<ContactoEstudianteResponse>[] = [
    { header: 'Nombre', cell: (row) => row.contactoNombre },
    { header: 'Teléfono', cell: (row) => row.contactoTelefono },
    { header: 'Parentesco', cell: (row) => row.parentesco ?? '—' },
    {
      header: 'Principal',
      cell: (row) => (row.esPrincipal ? <Badge variant="outline">Principal</Badge> : null),
    },
  ]

  function cancelEdit() {
    setEditing(null)
    form.reset(FORM_DEFAULT_VALUES)
  }

  async function onSubmit(values: ContactoFormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          body: {
            parentesco: values.parentesco || undefined,
            esPrincipal: values.esPrincipal,
          },
        })
        toast.success('Contacto actualizado')
      } else {
        const contacto = await createContactoMutation.mutateAsync({
          nombre: values.nombre,
          telefono: values.telefono,
          email: values.email || undefined,
        })
        await createContactoEstudianteMutation.mutateAsync({
          contactoId: contacto.id,
          parentesco: values.parentesco || undefined,
          esPrincipal: values.esPrincipal,
        })
        toast.success('Contacto agregado')
      }
      cancelEdit()
    } catch (error) {
      const apiError = error as ApiError
      mapApiErrorToForm(apiError, form.setError)
      const { errors } = form.formState
      const hasRenderedFieldError = Boolean(
        errors.nombre || errors.telefono || errors.email || errors.parentesco,
      )
      if (!hasRenderedFieldError && apiError.fieldErrors?.length) {
        toast.error('No se pudo guardar el contacto')
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? 'Editar contacto' : 'Contactos de emergencia'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ContactoForm
          form={form}
          onSubmit={onSubmit}
          onCancel={cancelEdit}
          isPending={
            createContactoMutation.isPending ||
            createContactoEstudianteMutation.isPending ||
            updateMutation.isPending
          }
          mode={editing ? 'editar' : 'crear'}
        />

        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
          emptyMessage="No hay contactos registrados"
          rowActions={(row) => (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon-xs" onClick={() => {
                setEditing(row)
                form.reset({
                  nombre: row.contactoNombre,
                  telefono: row.contactoTelefono,
                  email: row.contactoEmail ?? '',
                  parentesco: row.parentesco ?? '',
                  esPrincipal: row.esPrincipal,
                })
              }}>
                <PencilIcon />
              </Button>
              <ConfirmDeleteDialog
                trigger={
                  <Button variant="ghost" size="icon-xs">
                    <Trash2Icon />
                  </Button>
                }
                title="Eliminar contacto"
                description={`¿Está seguro que desea eliminar "${row.contactoNombre}"?`}
                onConfirm={() =>
                  removeMutation.mutate(row.id, {
                    onError: () => toast.error('No se pudo eliminar el contacto'),
                  })
                }
                isPending={removeMutation.isPending}
                confirmLabel="Eliminar"
                pendingLabel="Eliminando..."
              />
            </div>
          )}
        />
      </CardContent>
    </Card>
  )
}
