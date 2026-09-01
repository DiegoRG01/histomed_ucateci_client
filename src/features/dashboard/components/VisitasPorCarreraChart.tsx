import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useVisitasPorCarrera } from '../hooks/use-dashboard-queries'

export function VisitasPorCarreraChart() {
  const { data, isLoading, isError, refetch } = useVisitasPorCarrera()

  const max = data?.reduce((acc, item) => Math.max(acc, item.cantidad), 0) ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitas por carrera</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">No se pudo cargar el gráfico</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos de visitas por carrera</p>
        ) : (
          <ul className="space-y-3">
            {data?.map((item) => (
              <li key={item.carrera}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{item.carrera}</span>
                  <span className="text-muted-foreground">{item.cantidad}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${max > 0 ? (item.cantidad / max) * 100 : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
