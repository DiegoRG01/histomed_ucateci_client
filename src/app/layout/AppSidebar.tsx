import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavMain } from "./NavMain";
import { SidebarUserMenu } from "./SidebarUserMenu";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex-row items-center border-b">
        <SidebarMenuButton
          size="lg"
          asChild
          className="h-14 flex-1 cursor-default hover:bg-transparent active:bg-transparent"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <SidebarTrigger className="hidden shrink-0 md:flex group-data-[collapsible=icon]" />

            <div className="flex min-w-0 flex-col overflow-hidden transition-all duration-200 ease-linear group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:-translate-x-2 group-data-[collapsible=icon]:pointer-events-none">
              <span className="text-lg font-bold text-primary whitespace-nowrap">
                HistoMed
              </span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
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
  );
}
