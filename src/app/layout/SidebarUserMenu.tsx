import { useAuth } from '@/features/auth/hooks/useAuth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut } from 'lucide-react'

type SidebarUserMenuProps = {
  collapsed: boolean
}

export function SidebarUserMenu({ collapsed }: SidebarUserMenuProps) {
  const { user, logout } = useAuth()

  if (!user) return null

  const initials = user.username.slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent">
          <Avatar size={collapsed ? 'default' : 'sm'}>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col items-start gap-0.5 overflow-hidden">
              <span className="truncate text-sm font-medium">{user.username}</span>
              <Badge variant="secondary" className="text-[10px]">
                {user.roles[0]}
              </Badge>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? 'right' : 'top'} align="start" className="w-48">
        <DropdownMenuItem onClick={logout}>
          <LogOut className="size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
