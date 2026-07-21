import type { LucideIcon } from 'lucide-react'
import {
  GraduationCap,
  Package,
  ClipboardList,
  Eye,
  BarChart3,
  Users,
  LayoutGrid,
} from 'lucide-react'
import type { Role } from '@/types/role'

export type NavItem = {
  label: string
  path: string
  icon: LucideIcon
  roles: Role[]
}

export const navItems: NavItem[] = [
  { label: 'Estudiantes', path: '/', icon: GraduationCap, roles: ['ADMIN', 'CONSULTA'] },
  { label: 'Inventario', path: '/inventario', icon: Package, roles: ['ADMIN', 'ALMACEN'] },
  { label: 'Requisiciones', path: '/requisiciones', icon: ClipboardList, roles: ['ADMIN', 'ALMACEN', 'ENFERMERIA'] },
  { label: 'Visitas', path: '/visitas', icon: Eye, roles: ['ADMIN', 'CONSULTA'] },
  { label: 'Reportes', path: '/reportes', icon: BarChart3, roles: ['ADMIN'] },
  { label: 'Usuarios', path: '/usuarios', icon: Users, roles: ['ADMIN'] },
  { label: 'Catálogos', path: '/catalogos', icon: LayoutGrid, roles: ['ADMIN'] },
]
