"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { ReactNode } from "react";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto ml-0 lg:ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
