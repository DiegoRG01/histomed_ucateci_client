import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { PaginationBar } from '@/components/shared/Pagination'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useEstudiantes } from '../hooks/use-estudiantes'
import type { EstudianteResponse } from '../types'
import { EstudianteFormDialog } from './EstudianteFormDialog'

export function EstudianteListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtro, setFiltro] = useState('')
  const [debouncedFiltro, setDebouncedFiltro] = useState('')
  const [page, setPage] = useState(0)

  const { user } = useAuth()
  const roles = user?.roles ?? []
  const puedeEscribir = roles.includes('ADMIN') || roles.includes('ENFERMERIA')
  const esAdmin = roles.includes('ADMIN')

  const { data, isLoading } = useEstudiantes.useList({ filtro: debouncedFiltro, page, size: 10 })
  const removeMutation = useEstudiantes.useRemove()

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedFiltro(filtro.trim()), 300)
    return () => clearTimeout(timeout)
  }, [filtro])

  const [prevDebouncedFiltro, setPrevDebouncedFiltro] = useState(debouncedFiltro)
  if (prevDebouncedFiltro !== debouncedFiltro) {
    setPrevDebouncedFiltro(debouncedFiltro)
    setPage(0)
  }

  const modoNuevo = searchParams.has('nuevo')
  const editarParam = searchParams.get('editar')
  const editarId =
    editarParam !== null && editarParam !== '' && Number.isInteger(Number(editarParam))
      ? Number(editarParam)
      : undefined

  const enPagina =
    editarId !== undefined ? data?.content.find((est) => est.id === editarId) : undefined
  const { data: editarData } = useEstudiantes.useGetById(
    editarId !== undefined && !enPagina ? editarId : undefined,
  )
  const editing = enPagina ?? editarData ?? null
  const dialogOpen = modoNuevo || editing !== null

  function handleDialogOpenChange(open: boolean) {
    if (open) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('nuevo')
        next.delete('editar')
        return next
      },
      { replace: true },
    )
  }

  function openCreate() {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('nuevo', '1')
        next.delete('editar')
        return next
      },
      { replace: true },
    )
  }

  function openEdit(row: EstudianteResponse) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('editar', String(row.id))
        next.delete('nuevo')
        return next
      },
      { replace: true },
    )
  }

  const columns: Column<EstudianteResponse>[] = [
    { header: 'Matrícula', cell: (row) => row.matricula },
    { header: 'Cédula', cell: (row) => row.cedula },
    { header: 'Nombre completo', cell: (row) => `${row.nombre} ${row.apellido}` },
    { header: 'Carrera', cell: (row) => row.carreraNombre },
    { header: 'Grupo sanguíneo', cell: (row) => row.grupoSanguineo },
    { header: 'Seguro médico', cell: (row) => row.seguroMedicoNombre ?? '—' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estudiantes"
        action={
          puedeEscribir ? (
            <Button onClick={openCreate}>
              <PlusIcon className="size-4" />
              Nuevo
            </Button>
          ) : undefined
        }
      />

      <div className="relative max-w-md">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por matrícula, nombre o apellido..."
          className="pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.content ?? []}
        isLoading={isLoading}
        emptyMessage="No hay estudiantes registrados"
        rowActions={
          puedeEscribir
            ? (row) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(row)}>
                    <PencilIcon />
                  </Button>
                  {esAdmin && (
                    <ConfirmDeleteDialog
                      trigger={
                        <Button variant="ghost" size="icon-xs">
                          <Trash2Icon />
                        </Button>
                      }
                      title="Desactivar estudiante"
                      description={`¿Está seguro que desea desactivar a "${row.nombre} ${row.apellido}"?`}
                      onConfirm={() => removeMutation.mutate(row.id)}
                      isPending={removeMutation.isPending}
                    />
                  )}
                </div>
              )
            : undefined
        }
      />

      <PaginationBar
        page={data?.number ?? 0}
        totalPages={data?.totalPages ?? 0}
        onPageChange={setPage}
      />

      <EstudianteFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        editing={editing}
      />
    </div>
  )
}
