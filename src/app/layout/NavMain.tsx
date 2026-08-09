import { NavLink, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { navSections, type NavChildItem, type NavItem } from './nav-config'
import type { Role } from '@/types/role'

type NavLeafItem = NavItem & { path: string }
type NavParentItem = NavItem & { children: NavChildItem[] }

type VisibleSection = {
  label: string
  items: (NavLeafItem | NavParentItem)[]
}

function hasAnyRole(userRoles: Role[], itemRoles: Role[]) {
  return itemRoles.some((role) => userRoles.includes(role))
}

function isLeafItem(item: NavItem): item is NavLeafItem {
  return !item.children && item.path != null
}

function getVisibleSections(userRoles: Role[]): VisibleSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.flatMap((item): (NavLeafItem | NavParentItem)[] => {
        if (item.children) {
          const children = item.children.filter((child) =>
            hasAnyRole(userRoles, child.roles)
          )
          return children.length > 0 ? [{ ...item, children }] : []
        }
        return isLeafItem(item) && hasAnyRole(userRoles, item.roles)
          ? [item]
          : []
      }),
    }))
    .filter((section) => section.items.length > 0)
}

function isPathActive(path: string, pathname: string) {
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

type FlatItemProps = {
  item: NavLeafItem
  pathname: string
  onNavigate: () => void
}

function FlatItem({ item, pathname, onNavigate }: FlatItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isPathActive(item.path, pathname)}
        tooltip={item.label}
      >
        <NavLink to={item.path} end={item.path === '/'} onClick={onNavigate}>
          <item.icon />
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

type CollapsibleItemProps = {
  item: NavItem
  children: NavChildItem[]
  pathname: string
  onNavigate: () => void
}

function CollapsibleItem({
  item,
  children,
  pathname,
  onNavigate,
}: CollapsibleItemProps) {
  const isChildActive = children.some((child) =>
    isPathActive(child.path, pathname)
  )

  return (
    <Collapsible
      asChild
      // Only evaluated on mount; intentionally uncontrolled so the user's
      // open/close state survives route changes.
      defaultOpen={isChildActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.label}>
            <item.icon />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((child) => (
              <SidebarMenuSubItem key={child.path}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isPathActive(child.path, pathname)}
                >
                  <NavLink to={child.path} onClick={onNavigate}>
                    {child.label}
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMain() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const sections = getVisibleSections((user?.roles ?? []) as Role[])

  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                if (item.children) {
                  return (
                    <CollapsibleItem
                      key={item.label}
                      item={item}
                      children={item.children}
                      pathname={pathname}
                      onNavigate={handleNavigate}
                    />
                  )
                }
                return isLeafItem(item) ? (
                  <FlatItem
                    key={item.label}
                    item={item}
                    pathname={pathname}
                    onNavigate={handleNavigate}
                  />
                ) : null
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
