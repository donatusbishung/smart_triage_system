"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { LogOut, LayoutDashboard } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "triage_session=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-16 px-6">
          {/* Left: brand */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight">
                Smart<span className="text-black">Triage</span>
              </span>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </div>

          {/* Right: user + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-sm font-medium">Agent Smith</span>
              <span className="text-xs text-muted-foreground">
                agent@smarttriage.com
              </span>
            </div>
            <Avatar className="h-9 w-9 border-2 border-brand-500/20">
              <AvatarFallback className="bg-brand-500/10 text-brand-600 text-sm font-bold">
                AS
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive cursor-pointer"
              id="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
