import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { InfoIcon } from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useEstudiantes } from '../hooks/use-estudiantes'
import type { EstudianteResponse } from '../types'
import { DatosPersonalesTab } from './DatosPersonalesTab'
import { ReferenciasTab } from './ReferenciasTab'
import { HistorialClinicoTab } from './HistorialClinicoTab'

export function EstudianteFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const parsedId = id ? Number(id) : undefined
  const estudianteIdFromUrl =
    parsedId !== undefined && Number.isInteger(parsedId) ? parsedId : undefined

  const { data: estudianteData, isLoading } = useEstudiantes.useGetById(estudianteIdFromUrl)
  const [creado, setCreado] = useState<EstudianteResponse | null>(null)
  const [activeTab, setActiveTab] = useState('datos-personales')

  const estudiante = estudianteIdFromUrl ? (estudianteData ?? null) : creado
  const estudianteId = estudiante?.id
  const subRecursosHabilitados = estudianteId !== undefined

  function handleCreated(result: EstudianteResponse) {
    if (!estudianteIdFromUrl) {
      setCreado(result)
      setActiveTab('referencias')
      navigate(`/estudiantes/${result.id}/editar`, { replace: true })
    }
  }

  if (id !== undefined && estudianteIdFromUrl === undefined) {
    return <Navigate to="/estudiantes" replace />
  }

  if (estudianteIdFromUrl && isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Editar estudiante" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={estudianteIdFromUrl ? 'Editar estudiante' : 'Nuevo estudiante'} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="datos-personales">Datos personales</TabsTrigger>
          <BloqueableTabsTrigger value="referencias" habilitado={subRecursosHabilitados}>
            Referencias
          </BloqueableTabsTrigger>
          <BloqueableTabsTrigger value="historial-clinico" habilitado={subRecursosHabilitados}>
            Historial clínico
          </BloqueableTabsTrigger>
        </TabsList>

        <TabsContent value="datos-personales">
          <DatosPersonalesTab estudiante={estudiante} onCreated={handleCreated} />
        </TabsContent>

        <TabsContent value="referencias">
          {estudianteId !== undefined && <ReferenciasTab estudianteId={estudianteId} />}
        </TabsContent>

        <TabsContent value="historial-clinico">
          {estudianteId !== undefined && <HistorialClinicoTab estudianteId={estudianteId} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BloqueableTabsTrigger({
  value,
  habilitado,
  children,
}: {
  value: string
  habilitado: boolean
  children: ReactNode
}) {
  if (habilitado) {
    return <TabsTrigger value={value}>{children}</TabsTrigger>
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex flex-1">
          <TabsTrigger value={value} disabled className="w-full gap-1">
            {children}
            <InfoIcon className="size-3.5" />
          </TabsTrigger>
        </span>
      </TooltipTrigger>
      <TooltipContent>Guarde los datos personales primero para habilitar esta sección</TooltipContent>
    </Tooltip>
  )
}
