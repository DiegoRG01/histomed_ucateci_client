import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useDistribucionGrupoSanguineo } from '../hooks/use-dashboard-queries'

const CHART_COLORS = [
  '#0057A8',
  '#C9A227',
  '#16A34A',
  '#F59E0B',
  '#DC2626',
  '#6366F1',
  '#0EA5E9',
  '#8B5CF6',
]

export function GrupoSanguineoChart() {
  const { data, isLoading, isError, refetch } = useDistribucionGrupoSanguineo()

  const total = data?.reduce((acc, item) => acc + item.cantidad, 0) ?? 0
  let acumulado = 0
  const gradiente =
    data?.map((item, index) => {
      const inicio = (acumulado / Math.max(total, 1)) * 100
      acumulado += item.cantidad
      const fin = (acumulado / Math.max(total, 1)) * 100
      return `${CHART_COLORS[index % CHART_COLORS.length]} ${inicio}% ${fin}%`
    }) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución grupo sanguíneo</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-6">
            <Skeleton className="size-32 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">No se pudo cargar el gráfico</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos de grupo sanguíneo</p>
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            <div
              className="size-32 shrink-0 rounded-full"
              style={{ background: `conic-gradient(${gradiente.join(', ')})` }}
              role="img"
              aria-label="Distribución de grupos sanguíneos"
            />
            <ul className="min-w-40 flex-1 space-y-1.5 text-sm">
              {data?.map((item, index) => {
                const pct = total > 0 ? Math.round((item.cantidad / total) * 100) : 0
                return (
                  <li
                    key={item.grupoSanguineo}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      {item.grupoSanguineo}
                    </span>
                    <span className="text-muted-foreground">
                      {item.cantidad} ({pct}%)
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
