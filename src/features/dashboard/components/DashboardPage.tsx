import { PageHeader } from '@/components/shared/PageHeader'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Role } from '@/types/role'
import { StudentQuickSearch } from './StudentQuickSearch'
import { TotalEstudiantesKpi } from './TotalEstudiantesKpi'
import { StockBajoCard } from './StockBajoCard'
import { VencimientoProximoCard } from './VencimientoProximoCard'
import { GrupoSanguineoChart } from './GrupoSanguineoChart'
import { VisitasPorCarreraChart } from './VisitasPorCarreraChart'

const ESTUDIANTES_ROLES: Role[] = ['ADMIN', 'ENFERMERIA', 'CONSULTA']

export function DashboardPage() {
  const { user } = useAuth()
  const roles = user?.roles ?? []
  const puedeVerEstudiantes = roles.some((r) => ESTUDIANTES_ROLES.includes(r as Role))

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />
      <div className="flex flex-col-reverse gap-6 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          {puedeVerEstudiantes && <TotalEstudiantesKpi />}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <StockBajoCard />
            <VencimientoProximoCard />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GrupoSanguineoChart />
            <VisitasPorCarreraChart />
          </div>
        </div>
        {puedeVerEstudiantes && (
          <div className="w-full lg:w-80 lg:shrink-0">
            <StudentQuickSearch />
          </div>
        )}
      </div>
    </div>
  )
}
