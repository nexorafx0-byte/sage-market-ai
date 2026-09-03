import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Brain,
  BookOpen,
  ShieldCheck,
  Wallet,
  FlaskConical,
  Tags,
  LineChart,
  CandlestickChart,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const analysisItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI analýza trhu", url: "/analyza", icon: Brain },
  { title: "Grafy", url: "/grafy", icon: CandlestickChart },
  { title: "Backtesting", url: "/backtesting", icon: FlaskConical },
];

const tradingItems = [
  { title: "AI Journal", url: "/journal", icon: BookOpen },
  { title: "Risk manager", url: "/risk", icon: ShieldCheck },
  { title: "Funded účty", url: "/ucty", icon: Wallet },
  { title: "Cenník", url: "/cennik", icon: Tags },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const renderItems = (items: typeof analysisItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
            <Link to={item.url} className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LineChart className="h-4 w-4" />
          </span>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Trading Analyzer</div>
              <div className="text-[11px] text-muted-foreground">AI platforma</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Analýza</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(analysisItems)}</SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Obchodovanie</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(tradingItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
