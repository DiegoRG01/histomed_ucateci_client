import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { navItems } from '@/app/layout/nav-config'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Role } from '@/types/role'

export function AppLayout() {
  const { user, logout } = useAuth()

  const visibleItems = navItems.filter((item) =>
    user?.roles.some((r) => item.roles.includes(r as Role))
  )

  return (
    <div className="flex h-screen">
      <aside className="flex w-64 flex-col border-r bg-muted/50">
        <div className="flex h-14 items-center border-b px-4">
          <span className="text-lg font-bold text-primary">HistoMed</span>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="mb-2 text-sm text-muted-foreground">{user?.username}</div>
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start gap-2">
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
