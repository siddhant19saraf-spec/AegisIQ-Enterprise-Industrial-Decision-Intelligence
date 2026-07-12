"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Cpu, AlertTriangle, BrainCircuit, GitBranch,
  FileText, BarChart3, Settings, Box, Menu, ChevronRight,
  ChevronDown, Search, Star, Bell, Ambulance, Shield,
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  keywords?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, keywords: "home overview kpi metrics" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/assets", label: "Assets", icon: Cpu, keywords: "equipment machines devices" },
      { href: "/incidents", label: "Incidents", icon: AlertTriangle, keywords: "alerts issues problems tickets" },
      { href: "/emergency", label: "Emergency", icon: Ambulance, keywords: "sos safety ambulance alert danger" },
      { href: "/notifications", label: "Notifications", icon: Bell, keywords: "alerts updates messages" },
      { href: "/digital-twin", label: "Digital Twin", icon: Box, keywords: "simulation replica" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/ai-copilot", label: "AI Copilot", icon: BrainCircuit, keywords: "ai assistant help" },
      { href: "/knowledge-graph", label: "Knowledge Graph", icon: GitBranch, keywords: "relationships connections" },
      { href: "/decisions", label: "Decision Engine", icon: BrainCircuit, keywords: "recommendations decisions intelligence" },
      { href: "/analytics", label: "Analytics", icon: BarChart3, keywords: "charts reports insights data" },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/reports", label: "Reports", icon: FileText, keywords: "pdf export documents" },
      { href: "/admin", label: "Admin", icon: Shield, keywords: "system users roles administration" },
      { href: "/settings", label: "Settings", icon: Settings, keywords: "preferences configuration" },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("sidebar-favorites") ?? "[]");
    }
    return [];
  });

  const toggleCollapse = useCallback((label: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((href: string) => {
    setFavorites((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      localStorage.setItem("sidebar-favorites", JSON.stringify(next));
      return next;
    });
  }, []);

  const allItems = useMemo(() => NAV_GROUPS.flatMap((g) => g.items), []);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return NAV_GROUPS.map((g) => ({ ...g, items: g.items }));
    const q = searchQuery.toLowerCase();
    return NAV_GROUPS
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) =>
            i.label.toLowerCase().includes(q) ||
            i.keywords?.toLowerCase().includes(q) ||
            i.href.includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [searchQuery]);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
          AQ
        </div>
        <span className="text-sm font-semibold tracking-wide">AegisIQ</span>
      </div>

      <div className="border-b border-sidebar-border px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sidebar-foreground/40" />
          <Input
            placeholder="Search navigation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-sidebar-border bg-sidebar-muted pl-8 text-xs placeholder:text-sidebar-foreground/40"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-3">

          {favorites.length > 0 && !searchQuery && (
            <div>
              <p className="mb-1 flex items-center gap-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                <Star className="h-3 w-3" />
                Favorites
              </p>
              <div className="space-y-0.5">
                {favorites.map((href) => {
                  const item = allItems.find((i) => i.href === href);
                  if (!item) return null;
                  const Icon = item.icon;
                  const isActive = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-sidebar-accent text-white shadow-sm"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      <button
                        onClick={(e) => { e.preventDefault(); toggleFavorite(href); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </button>
                    </Link>
                  );
                })}
              </div>
              <div className="my-2 border-t border-sidebar-border" />
            </div>
          )}

          {filteredGroups.map((group) => {
            const isCollapsed = collapsed.has(group.label);
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleCollapse(group.label)}
                  className="flex w-full items-center gap-1 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {group.label}
                </button>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-0.5 overflow-hidden"
                    >
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        const isFav = favorites.includes(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                              isActive
                                ? "bg-sidebar-accent text-white shadow-sm"
                                : "text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1 truncate">{item.label}</span>
                            {isActive && <ChevronRight className="h-3 w-3" />}
                            <button
                              onClick={(e) => { e.preventDefault(); toggleFavorite(item.href); }}
                              className={cn(
                                "opacity-0 group-hover:opacity-100 transition-opacity",
                                isFav && "opacity-100",
                              )}
                            >
                              <Star className={cn("h-3 w-3", isFav ? "fill-amber-400 text-amber-400" : "text-sidebar-foreground/40")} />
                            </button>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-md bg-sidebar-muted px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-[11px] font-medium text-sidebar-foreground/60">System Operational</p>
          </div>
          <p className="text-[11px] text-sidebar-foreground/40">v0.1.0</p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [open, setOpen] = useState(false);

  if (isDesktop) {
    return (
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <SidebarNav />
      </aside>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
