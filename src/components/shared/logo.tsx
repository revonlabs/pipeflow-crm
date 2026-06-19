import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_ASPECT_RATIO = 685 / 237;

interface LogoProps {
  height?: number;
  className?: string;
}

export function Logo({ height = 32, className }: LogoProps) {
  return (
    <Image
      src="/brand/logo-full.png"
      alt="Revon Studio CRM"
      width={Math.round(height * LOGO_ASPECT_RATIO)}
      height={height}
      className={cn("w-auto", className)}
      style={{ height }}
      priority
    />
  );
}
