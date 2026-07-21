import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebarCollapsed } from './useSidebarCollapsed'
import { SidebarNav } from './SidebarNav'
import { SidebarUserMenu } from './SidebarUserMenu'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { collapsed, toggle } = useSidebarCollapsed()

  return (
    <aside
      className={cn(
        'hidden flex-col border-r bg-muted/50 transition-[width] duration-200 md:flex',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {collapsed ? (
          <span className="mx-auto text-lg font-bold text-secondary">H</span>
        ) : (
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary">HistoMed</span>
            <span className="text-[10px] text-muted-foreground">Dispensario UCATECI</span>
          </div>
        )}
      </div>
      <SidebarNav collapsed={collapsed} />
      <div className="border-t">
        <SidebarUserMenu collapsed={collapsed} />
        <div className="flex justify-center border-t px-2 py-2">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggle}
            className="text-muted-foreground"
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
        </div>
      </div>
    </aside>
  )
}
