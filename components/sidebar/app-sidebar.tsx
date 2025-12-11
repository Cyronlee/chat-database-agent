"use client"

import * as React from "react"
import {
  MessageCircle,
  Database,
  GalleryVerticalEnd,
  Home,
  BarChart3,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Jira Report Agent",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Jira Sync",
      url: "/jira-sync",
      icon: Database,
    },
    {
      title: "Data Studio",
      url: "/data-studio",
      icon: BarChart3,
    },
  ],
  conversations: [
    {
      name: "Design Engineering",
      url: "#",
      icon: MessageCircle,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: MessageCircle,
    },
    {
      name: "Travel",
      url: "#",
      icon: MessageCircle,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavConversations conversations={data.conversations} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
