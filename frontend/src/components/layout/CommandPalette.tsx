"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutDashboard, Cpu, AlertTriangle, BrainCircuit, GitBranch, FileText, BarChart3, Settings, Box } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

const pages = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { href: "/assets", label: "Assets", icon: Cpu, group: "Operations" },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle, group: "Operations" },
  { href: "/digital-twin", label: "Digital Twin", icon: Box, group: "Operations" },
  { href: "/ai-copilot", label: "AI Copilot", icon: BrainCircuit, group: "Intelligence" },
  { href: "/knowledge-graph", label: "Knowledge Graph", icon: GitBranch, group: "Intelligence" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, group: "Intelligence" },
  { href: "/reports", label: "Reports", icon: FileText, group: "Management" },
  { href: "/settings", label: "Settings", icon: Settings, group: "Management" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full max-w-sm justify-start text-sm text-muted-foreground shadow-none"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search pages...</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem key={page.href} value={page.label} onSelect={() => runCommand(page.href)}>
                <Icon className="mr-2 h-4 w-4" />
                <span>{page.label}</span>
              </CommandItem>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
