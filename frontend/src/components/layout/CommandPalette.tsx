"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, Cpu, AlertTriangle, BrainCircuit, GitBranch,
  FileText, BarChart3, Settings, Box, Bell, Command,
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

interface PageEntry {
  href: string;
  label: string;
  icon: React.ElementType;
  group: string;
  keywords: string;
}

const PAGES: PageEntry[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview", keywords: "home overview kpi metrics" },
  { href: "/assets", label: "Assets", icon: Cpu, group: "Operations", keywords: "equipment machines devices" },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle, group: "Operations", keywords: "alerts issues problems tickets" },
  { href: "/notifications", label: "Notifications", icon: Bell, group: "Operations", keywords: "alerts updates messages" },
  { href: "/digital-twin", label: "Digital Twin", icon: Box, group: "Operations", keywords: "simulation replica" },
  { href: "/ai-copilot", label: "AI Copilot", icon: BrainCircuit, group: "Intelligence", keywords: "ai assistant help" },
  { href: "/knowledge-graph", label: "Knowledge Graph", icon: GitBranch, group: "Intelligence", keywords: "relationships connections" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, group: "Intelligence", keywords: "charts reports insights data" },
  { href: "/reports", label: "Reports", icon: FileText, group: "Management", keywords: "pdf export documents" },
  { href: "/settings", label: "Settings", icon: Settings, group: "Management", keywords: "preferences configuration" },
];

const ACTIONS = [
  { id: "new-asset", label: "New Asset", action: "/assets" },
  { id: "new-incident", label: "Report Incident", action: "/incidents" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [favorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("sidebar-favorites") ?? "[]");
    }
    return [];
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const favoritePages = useMemo(
    () => PAGES.filter((p) => favorites.includes(p.href)),
    [favorites],
  );

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full max-w-sm justify-start text-sm text-muted-foreground shadow-none"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search pages and actions...</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {favoritePages.length > 0 && (
            <>
              <CommandGroup heading="Favorites">
                {favoritePages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <CommandItem key={page.href} value={`fav-${page.label}`} onSelect={() => runCommand(page.href)}>
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{page.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}
          <CommandGroup heading="Quick Actions">
            {ACTIONS.map((a) => (
              <CommandItem key={a.id} value={a.label} onSelect={() => runCommand(a.action)}>
                <Command className="mr-2 h-4 w-4" />
                <span>{a.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Pages">
            {PAGES.map((page) => {
              const Icon = page.icon;
              return (
                <CommandItem key={page.href} value={`${page.label} ${page.keywords}`} onSelect={() => runCommand(page.href)}>
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{page.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground/60">{page.group}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
