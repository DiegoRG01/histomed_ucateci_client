import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover'
import { useEstudianteSearch } from '@/features/estudiantes/hooks/use-estudiante-search'

const LISTBOX_ID = 'quick-search-listbox'

export function StudentQuickSearch() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('')
  const [debouncedFiltro, setDebouncedFiltro] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedFiltro(filtro.trim()), 300)
    return () => clearTimeout(timeout)
  }, [filtro])

  const { data, isLoading, isFetching, isError, refetch } = useEstudianteSearch(debouncedFiltro)
  const resultados = data?.content ?? []

  function handleSelect(estudianteId: number) {
    setOpen(false)
    setFiltro('')
    navigate(`/estudiantes/${estudianteId}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Buscar estudiante..."
            className="pl-9"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls={
              debouncedFiltro.length >= 2 && resultados.length > 0 ? LISTBOX_ID : undefined
            }
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-[var(--radix-popper-anchor-width)] p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement | null
          if (target?.closest('[data-slot="popover-anchor"]')) {
            event.preventDefault()
          }
        }}
      >
        {debouncedFiltro.length < 2 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Escribe al menos 2 caracteres para buscar
          </p>
        ) : isError ? (
          <div className="space-y-2 p-4">
            <p className="text-sm text-destructive">No se pudo completar la búsqueda</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : resultados.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No se encontraron estudiantes
          </p>
        ) : (
          <ul
            id={LISTBOX_ID}
            role="listbox"
            aria-label="Resultados de búsqueda"
            className="max-h-64 overflow-auto p-1"
          >
            {resultados.map((estudiante) => (
              <li key={estudiante.id} role="option">
                <button
                  type="button"
                  onClick={() => handleSelect(estudiante.id)}
                  className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-accent"
                >
                  <span className="text-sm font-medium">
                    {estudiante.nombre} {estudiante.apellido}
                  </span>
                  <span className="text-xs text-muted-foreground">{estudiante.matricula}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
