import { useAuth } from "@/features/auth/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";

export function SidebarUserMenu() {
  const { user, logout } = useAuth();
  const { state, isMobile } = useSidebar();

  if (!user) return null;

  const collapsed = state === "collapsed" && !isMobile;
  const initials = user.username.slice(0, 2).toUpperCase();

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
              <div
                className={
                  collapsed
                    ? "flex max-w-0 flex-col items-start gap-0.5 overflow-hidden opacity-0 -translate-x-2 transition-all duration-200 ease-linear pointer-events-none"
                    : "flex max-w-40 flex-col items-start gap-0.5 overflow-hidden opacity-100 translate-x-0 transition-all duration-200 ease-linear"
                }
              >
                <span className="truncate text-sm font-medium">
                  {user.username}
                </span>
                {/* {user.roles[0] ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {user.roles[0]}
                  </Badge>
                ) : null} */}
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={collapsed ? "right" : "top"}
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
  );
}
