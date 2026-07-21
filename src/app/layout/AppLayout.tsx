import { Outlet } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from './Sidebar'
import { MobileSidebarTrigger } from './MobileSidebarTrigger'

export function AppLayout() {
  return (
    <TooltipProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center border-b px-4 md:hidden">
            <MobileSidebarTrigger />
            <span className="ml-3 text-lg font-bold text-primary">HistoMed</span>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
