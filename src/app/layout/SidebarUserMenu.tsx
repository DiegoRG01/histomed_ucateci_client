import { useAuth } from '@/features/auth/hooks/useAuth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { LogOut } from 'lucide-react'

export function SidebarUserMenu() {
  const { user, logout } = useAuth()
  const { state, isMobile } = useSidebar()

  if (!user) return null

  const collapsed = state === 'collapsed' && !isMobile
  const initials = user.username.slice(0, 2).toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={user.username}
              className="gap-3 data-[state=open]:bg-sidebar-accent"
            >
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                  <span className="truncate text-sm font-medium">
                    {user.username}
                  </span>
                  {user.roles[0] ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {user.roles[0]}
                    </Badge>
                  ) : null}
                </div>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={collapsed ? 'right' : 'top'}
            align="start"
            className="w-48"
          >
            <DropdownMenuItem onClick={logout}>
              <LogOut className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
