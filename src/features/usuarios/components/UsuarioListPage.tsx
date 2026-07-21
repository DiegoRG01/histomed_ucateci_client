import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { FormDialog } from '@/components/shared/FormDialog'
import { UsuarioForm } from './UsuarioForm'
import { mapApiErrorToForm } from '@/lib/form-errors'
import type { ApiError } from '@/lib/api-client'
import { useUsuarios, useCreateUsuario } from '../hooks/useUsuarios'
import type { Usuario } from '../types'
import type { UsuarioFormValues } from './UsuarioForm'

const schema = z.object({
  username: z.string().min(1, 'El username es obligatorio'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombreCompleto: z.string().min(1, 'El nombre completo es obligatorio'),
  email: z.string().email('Ingrese un email válido'),
  roles: z.custom<UsuarioFormValues['roles']>((val) => Array.isArray(val) && val.length > 0, {
    message: 'Seleccione al menos un rol',
  }),
})

export function UsuarioListPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading } = useUsuarios()
  const createMutation = useCreateUsuario()

  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '', nombreCompleto: '', email: '', roles: [] },
  })

  const columns: Column<Usuario>[] = [
    { header: 'ID', cell: (row) => row.id },
    { header: 'Username', cell: (row) => row.username },
    { header: 'Nombre completo', cell: (row) => row.nombreCompleto },
    { header: 'Email', cell: (row) => row.email },
    {
      header: 'Roles',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.map((r) => (
            <Badge key={r} variant="secondary">{r}</Badge>
          ))}
        </div>
      ),
    },
    {
      header: 'Estado',
      cell: (row) => (
        <Badge variant={row.activo ? 'default' : 'secondary'}>
          {row.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ]

  function openCreate() {
    form.reset({ username: '', password: '', nombreCompleto: '', email: '', roles: [] })
    setDialogOpen(true)
  }

  async function onSubmit(values: UsuarioFormValues) {
    try {
      await createMutation.mutateAsync(values)
      toast.success('Usuario creado')
      setDialogOpen(false)
      form.reset()
    } catch (error) {
      mapApiErrorToForm(error as ApiError, form.setError)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        action={
          <Button onClick={openCreate}>
            <PlusIcon className="size-4" />
            Nuevo
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        emptyMessage="No hay usuarios registrados"
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Nuevo usuario"
      >
        <UsuarioForm
          form={form}
          onSubmit={onSubmit}
          onCancel={() => setDialogOpen(false)}
          isPending={createMutation.isPending}
        />
      </FormDialog>
    </div>
  )
}
