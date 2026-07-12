"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { ThemeSwitch } from "./ThemeSwitch";
import { NotificationCenter } from "./NotificationCenter";
import { UserMenu } from "./UserMenu";
import { CommandPalette } from "./CommandPalette";
import { BreadcrumbNav } from "./BreadcrumbNav";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="hidden lg:block">
          <BreadcrumbNav />
        </div>
        <div className="lg:hidden">
          <BreadcrumbNav />
        </div>
        <div className="ml-auto lg:ml-4 flex-1 max-w-md">
          <CommandPalette />
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <ThemeSwitch />
        {user && <NotificationCenter />}
        {user && <UserMenu />}
      </div>
    </header>
  );
}
