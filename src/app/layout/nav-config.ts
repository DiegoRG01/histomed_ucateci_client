import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  GraduationCap,
  Eye,
  Heart,
  Package,
  ClipboardList,
  BarChart3,
  Users,
  LayoutGrid,
  Shield,
} from 'lucide-react'
import type { Role } from '@/types/role'

export type NavChildItem = {
  label: string
  path: string
  roles: Role[]
}

export type NavItem = {
  label: string
  path?: string
  icon: LucideIcon
  roles: Role[]
  children?: NavChildItem[]
}

export type NavSection = {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ENFERMERIA', 'ALMACEN', 'CONSULTA'] },
    ],
  },
  {
    label: 'Clínico',
    items: [
      { label: 'Estudiantes', path: '/estudiantes', icon: GraduationCap, roles: ['ADMIN', 'ENFERMERIA', 'CONSULTA'] },
      { label: 'Visitas', path: '/visitas', icon: Eye, roles: ['ADMIN', 'ENFERMERIA', 'CONSULTA'] },
      { label: 'Donaciones', path: '/donaciones', icon: Heart, roles: ['ADMIN', 'ENFERMERIA'] },
    ],
  },
  {
    label: 'Inventario',
    items: [
      {
        label: 'Inventario',
        icon: Package,
        roles: ['ADMIN', 'ALMACEN'],
        children: [
          { label: 'Medicamentos', path: '/inventario/medicamentos', roles: ['ADMIN', 'ALMACEN'] },
          { label: 'Lotes', path: '/inventario/lotes', roles: ['ADMIN', 'ALMACEN'] },
          { label: 'Movimientos', path: '/inventario/movimientos', roles: ['ADMIN', 'ALMACEN'] },
        ],
      },
      { label: 'Requisiciones', path: '/requisiciones', icon: ClipboardList, roles: ['ADMIN', 'ALMACEN', 'ENFERMERIA'] },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { label: 'Reportes', path: '/reportes', icon: BarChart3, roles: ['ADMIN', 'ENFERMERIA', 'ALMACEN', 'CONSULTA'] },
    ],
  },
  {
    label: 'Administración',
    items: [
      { label: 'Usuarios', path: '/usuarios', icon: Users, roles: ['ADMIN'] },
      { label: 'Catálogos', path: '/catalogos/tipos-medicamento', icon: LayoutGrid, roles: ['ADMIN', 'ALMACEN'] },
      { label: 'Auditoría', path: '/auditoria', icon: Shield, roles: ['ADMIN'] },
    ],
  },
]
