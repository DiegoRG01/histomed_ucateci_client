import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useEstudianteFicha } from '../hooks/use-estudiante-ficha'
import { useEstudiantes } from '../hooks/use-estudiantes'

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  )
}

function ListaChips({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground uppercase">{titulo}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin registro</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, index) => (
            <Badge key={`${item}-${index}`} variant="outline" className="max-w-full break-words whitespace-normal">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export function EstudianteFichaPage() {
  const { id } = useParams<{ id: string }>()
  const numericId = id ? Number(id) : undefined
  const navigate = useNavigate()
  const { user } = useAuth()
  const roles = user?.roles ?? []
  const puedeEditar = roles.includes('ADMIN') || roles.includes('ENFERMERIA')
  const esAdmin = roles.includes('ADMIN')

  const { data: ficha, isLoading, isError, refetch } = useEstudianteFicha(numericId)
  const removeMutation = useEstudiantes.useRemove()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ficha de emergencia" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  if (isError || !ficha) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ficha de emergencia" />
        <Card>
          <CardContent>
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                No se pudo cargar la ficha del estudiante
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => refetch()}>
                  Reintentar
                </Button>
                <Button asChild>
                  <Link to="/dashboard">Volver al dashboard</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  function handleDesactivar(estudianteId: number) {
    removeMutation.mutate(estudianteId, {
      onSuccess: () => {
        toast.success('Estudiante desactivado')
        navigate('/dashboard')
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ficha de emergencia"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {puedeEditar && (
              <Button variant="outline" onClick={() => navigate(`/estudiantes/${numericId}/editar`)}>
                <PencilIcon /> Editar
              </Button>
            )}
            {esAdmin && (
              <ConfirmDeleteDialog
                trigger={
                  <Button variant="outline">
                    <Trash2Icon /> Desactivar
                  </Button>
                }
                title="Desactivar estudiante"
                description={`¿Está seguro que desea desactivar a "${ficha.nombre} ${ficha.apellido}"?`}
                onConfirm={() => handleDesactivar(ficha.estudianteId)}
                isPending={removeMutation.isPending}
              />
            )}
            <Button variant="outline" asChild>
              <Link to="/dashboard">
                <ArrowLeftIcon /> Volver
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {ficha.nombre} {ficha.apellido}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Email" value={ficha.email} />
            <InfoItem label="Teléfono" value={ficha.telefono} />
            <InfoItem label="Carrera" value={ficha.carrera} />
            <InfoItem label="Seguro médico" value={ficha.seguroMedico} />
            <InfoItem label="Grupo sanguíneo" value={ficha.grupoSanguineo} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial clínico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ListaChips titulo="Alergias" items={ficha.alergias} />
            <ListaChips titulo="Condiciones físicas" items={ficha.condicionesFisicas} />
            <ListaChips titulo="Enfermedades crónicas" items={ficha.enfermedadesCronicas} />
            <ListaChips titulo="Medicamentos habituales" items={ficha.medicamentosHabituales} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contacto y referencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem label="Médico de referencia" value={ficha.medicoReferencia} />
              <InfoItem label="Contacto principal" value={ficha.contactoPrincipal} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aptitud de donación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ficha.aptitudDonacion.apto ? (
                <Badge>Apto para donar</Badge>
              ) : (
                <Badge variant="destructive">No apto para donar</Badge>
              )}
              {ficha.aptitudDonacion.motivos.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {ficha.aptitudDonacion.motivos.map((motivo, index) => (
                    <li key={`${motivo}-${index}`}>{motivo}</li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
