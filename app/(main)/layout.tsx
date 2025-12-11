import { SidebarLayout } from "@/components/layout/sidebar-layout"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SidebarLayout>{children}</SidebarLayout>
}
