import { NavLink } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { navSections } from '@/app/layout/nav-config'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Role } from '@/types/role'

type SidebarNavProps = {
  collapsed: boolean
  onNavigate?: () => void
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const { user } = useAuth()

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        user?.roles.some((r) => item.roles.includes(r as Role))
      ),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <nav className="flex-1 space-y-4 overflow-y-auto p-2">
      {visibleSections.map((section) => (
        <div key={section.label}>
          {!collapsed && (
            <div className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {section.label}
            </div>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const link = (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-l-2 border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  <item.icon className="size-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                )
              }

              return link
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
