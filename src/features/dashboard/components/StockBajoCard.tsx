import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useStockBajo } from '../hooks/use-dashboard-queries'

export function StockBajoCard() {
  const { data, isLoading, isError, refetch } = useStockBajo()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock bajo</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">No se pudieron cargar las alertas</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Sin alertas de stock bajo</p>
        ) : (
          <ul className="space-y-3">
            {data?.map((insumo) => (
              <li key={insumo.insumoId} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{insumo.insumoNombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {insumo.stockActual} / mínimo {insumo.stockMinimo}
                  </p>
                </div>
                <Badge variant="destructive">{insumo.stockActual}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
