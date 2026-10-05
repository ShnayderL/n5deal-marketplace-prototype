"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Soft page enter animation on client navigations. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("page-enter");
    // force reflow so animation restarts
    void root.offsetWidth;
    root.classList.add("page-enter");
    const t = window.setTimeout(() => root.classList.remove("page-enter"), 500);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return <div className="page-transition-root">{children}</div>;
}
