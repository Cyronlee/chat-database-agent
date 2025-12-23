"use client"

import * as React from "react"
import {
  Database,
  Sparkles,
  BarChart3,
  Users,
  LineChart,
  FileText,
} from "lucide-react"
import Link from "next/link"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getAuthStatus } from "@/api-clients/auth"
import type { AuthUser } from "@/api-clients/auth"

const baseNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Agent",
    url: "/agent",
    icon: Sparkles,
  },
  {
    title: "Data Studio",
    url: "/data-studio",
    icon: BarChart3,
  },
  {
    title: "Custom Charts",
    url: "/custom-charts",
    icon: LineChart,
  },
]

const adminNavItems = [
  {
    title: "User Management",
    url: "/admin/users",
    icon: Users,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [authEnabled, setAuthEnabled] = React.useState(false)

  React.useEffect(() => {
    getAuthStatus().then((status) => {
      setUser(status.user)
      setAuthEnabled(status.authEnabled)
    })
  }, [])

  const navItems = React.useMemo(() => {
    if (user?.isAdmin) {
      return [...baseNavItems, ...adminNavItems]
    }
    return baseNavItems
  }, [user?.isAdmin])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Sparkles className="size-4" />
                </div>
                <span className="truncate text-lg font-semibold">
                  Database Agent
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>{authEnabled && <NavUser user={user} />}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
