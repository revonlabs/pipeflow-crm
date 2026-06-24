"use client";

import { useEffect, useState } from "react";
import { FileText, ImageOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getWaMediaSignedUrlAction } from "@/lib/actions/wa-conversations";
import type { WaMessageContentType } from "@/types";

interface MessageMediaProps {
  mediaPath: string;
  mediaMime: string | null;
  // O worker (Sprint 1) pode persistir "unsupported" para tipos de mídia
  // ainda não suportados pelo parser (ex.: location/contact com layout
  // diferente) — fora do CHECK constraint declarado, mas tratado aqui
  // defensivamente em vez de quebrar a tela.
  contentType: WaMessageContentType | "unsupported";
}

export function MessageMedia({ mediaPath, mediaMime, contentType }: MessageMediaProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getWaMediaSignedUrlAction(mediaPath).then((result) => {
      if (!active) return;
      if ("url" in result) {
        setUrl(result.url);
      } else {
        setError(true);
      }
    });
    return () => {
      active = false;
    };
  }, [mediaPath]);

  if (contentType === "unsupported") {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <ImageOff className="h-4 w-4" />
        Mídia não suportada
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <ImageOff className="h-4 w-4" />
        Não foi possível carregar a mídia
      </div>
    );
  }

  if (!url) {
    return <Skeleton className="h-40 w-56 rounded-md" />;
  }

  if (contentType === "image" || contentType === "sticker") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" loading="lazy" className="max-h-72 max-w-full rounded-md" />;
  }

  if (contentType === "audio") {
    return <audio controls src={url} className="max-w-full" />;
  }

  if (contentType === "video") {
    return <video controls src={url} className="max-h-72 max-w-full rounded-md" />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
    >
      <FileText className="h-4 w-4 shrink-0" />
      {mediaMime ?? "Documento"}
    </a>
  );
}
