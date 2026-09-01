import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useVencimientoProximo } from '../hooks/use-dashboard-queries'

function formatFecha(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('es-DO')
}

function diasParaVencer(iso: string) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vence = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(vence.getTime())) return null
  return Math.ceil((vence.getTime() - hoy.getTime()) / 86400000)
}

export function VencimientoProximoCard() {
  const { data, isLoading, isError, refetch } = useVencimientoProximo()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vencimientos próximos (30 días)</CardTitle>
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
          <p className="text-sm text-muted-foreground">Sin vencimientos próximos</p>
        ) : (
          <ul className="space-y-3">
            {data?.map((lote) => {
              const dias = diasParaVencer(lote.fechaVencimiento)
              const texto = dias === 0 ? 'Vence hoy' : dias === 1 ? 'Vence mañana' : `${dias} días`
              return (
                <li key={lote.loteId} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{lote.insumoNombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Lote {lote.numeroLote} · {formatFecha(lote.fechaVencimiento)} ·{' '}
                      {lote.cantidadDisponible} u.
                    </p>
                  </div>
                  {dias !== null &&
                    (dias <= 10 ? (
                      <Badge variant="destructive">{texto}</Badge>
                    ) : (
                      <Badge variant="secondary">{texto}</Badge>
                    ))}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
