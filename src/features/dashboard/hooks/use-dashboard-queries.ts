import { useQuery } from '@tanstack/react-query'
import {
  getStockBajo,
  getVencimientoProximo,
  getDistribucionGrupoSanguineo,
  getVisitasPorCarrera,
  getTotalEstudiantes,
} from '../api/dashboard-api'

export function useStockBajo() {
  return useQuery({ queryKey: ['dashboard', 'stock-bajo'], queryFn: getStockBajo })
}

export function useVencimientoProximo() {
  return useQuery({
    queryKey: ['dashboard', 'vencimiento-proximo'],
    queryFn: getVencimientoProximo,
  })
}

export function useDistribucionGrupoSanguineo() {
  return useQuery({
    queryKey: ['dashboard', 'distribucion-grupo-sanguineo'],
    queryFn: getDistribucionGrupoSanguineo,
  })
}

export function useVisitasPorCarrera() {
  return useQuery({
    queryKey: ['dashboard', 'visitas-por-carrera'],
    queryFn: getVisitasPorCarrera,
  })
}

export function useTotalEstudiantes() {
  return useQuery({
    queryKey: ['dashboard', 'total-estudiantes'],
    queryFn: getTotalEstudiantes,
  })
}
