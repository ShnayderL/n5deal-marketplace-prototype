import Image from "next/image";
import { jurisdictionCode } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Flag({
  jurisdiction,
  size = 20,
  className,
}: {
  jurisdiction: string;
  size?: number;
  className?: string;
}) {
  const code = jurisdictionCode(jurisdiction).toLowerCase();
  const height = Math.round(size * 0.75);
  return (
    <Image
      src={`https://flagcdn.com/w80/${code}.png`}
      alt={`${jurisdiction} flag`}
      width={size}
      height={height}
      className={cn("inline-block shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(15,23,42,0.12)]", className)}
      style={{ width: size, height }}
    />
  );
}
