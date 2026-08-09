import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavMain } from './NavMain'
import { SidebarUserMenu } from './SidebarUserMenu'

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenuButton
          size="lg"
          asChild
          className="h-14 cursor-default hover:bg-transparent active:bg-transparent"
        >
          <div>
            <span className="hidden text-lg font-bold text-secondary group-data-[collapsible=icon]:block">
              H
            </span>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-lg font-bold text-primary">HistoMed</span>
              <span className="text-[10px] text-muted-foreground">
                Dispensario UCATECI
              </span>
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
