"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

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
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-mono text-xs">
        Verifying session...
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
