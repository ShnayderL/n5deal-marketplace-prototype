import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  size = "md",
  showTagline = false,
}: {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg" | "xl" | "header" | "hero";
  showTagline?: boolean;
}) {
  const heights = { sm: 24, md: 32, lg: 40, xl: 48, header: 25, hero: 112 };
  const h = heights[size];
  const aspect = 900 / 209;
  const isHero = size === "hero";

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 transition-transform duration-300 ease-out hover:scale-[1.02]",
        isHero && "block",
        className,
      )}
    >
      <Image
        src="/n5deal-logo.png"
        alt="N5Deal"
        width={Math.round(h * aspect)}
        height={h}
        className="h-auto w-auto object-contain object-left"
        style={{ height: h, width: "auto", maxWidth: isHero ? "min(100%, 480px)" : undefined }}
        priority={size === "header" || size === "hero"}
        unoptimized
      />
      {showTagline ? (
        <span className="hidden text-sm font-medium text-[var(--muted)] lg:inline">M&A Marketplace</span>
      ) : null}
    </Link>
  );
}
