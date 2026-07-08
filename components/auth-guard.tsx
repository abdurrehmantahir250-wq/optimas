"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
 import { Skeleton } from "@/components/ui/skeleton";

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/verify-otp"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isPublicPath(pathname)) {
      setAuthorized(true);
      setReady(true);
      return;
    }

    let active = true;

    fetch("/api/auth/session", { credentials: "include" })
      .then(async (response) => {
        if (!active) return;
        const data = await response.json().catch(() => ({}));
        if (response.ok && data?.authenticated) {
          setAuthorized(true);
          return;
        }
        const next = encodeURIComponent(pathname);
        router.replace(`/login?next=${next}`);
      })
      .catch(() => {
        if (!active) return;
        const next = encodeURIComponent(pathname);
        router.replace(`/login?next=${next}`);
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex bg-background text-foreground">
        <aside className="hidden xl:flex w-72 flex-col gap-4 border-r border-border bg-muted p-8">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <div className="space-y-3 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </aside>
        <main className="flex-1 p-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <div className="grid gap-4 lg:grid-cols-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
