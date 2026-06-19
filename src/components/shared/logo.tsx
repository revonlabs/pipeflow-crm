import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  iconSize?: number;
  brandTextSize?: number;
  tagTextSize?: number;
  className?: string;
}

export function Logo({
  iconSize = 32,
  brandTextSize = 17,
  tagTextSize = 11,
  className,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/brand/icon-streaks.png"
        alt=""
        width={iconSize}
        height={iconSize}
        className="shrink-0"
        priority
      />
      <span className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span
          className="font-[var(--font-sans,'Inter',sans-serif)] font-black tracking-[-0.02em] text-[#F0F8FF]"
          style={{ fontSize: brandTextSize }}
        >
          Revon
        </span>
        <span
          className="font-[var(--font-sans,'Inter',sans-serif)] font-light uppercase tracking-[0.10em] text-[#8BACD4]"
          style={{ fontSize: tagTextSize }}
        >
          Studio
        </span>
        <span
          className="font-[var(--font-sans,'Inter',sans-serif)] font-bold uppercase tracking-[0.10em] text-[#FF7043]"
          style={{ fontSize: tagTextSize }}
        >
          CRM
        </span>
      </span>
    </div>
  );
}
