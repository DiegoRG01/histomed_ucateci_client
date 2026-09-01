import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useTotalEstudiantes } from '../hooks/use-dashboard-queries'

export function TotalEstudiantesKpi() {
  const { data, isLoading, isError, refetch } = useTotalEstudiantes()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total de estudiantes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-9 w-24" />
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">No se pudo cargar</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <p className="text-3xl font-bold text-primary">{data?.totalElements ?? 0}</p>
        )}
      </CardContent>
    </Card>
  )
}
