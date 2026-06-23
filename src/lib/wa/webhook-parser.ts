import "server-only";

// Estrutura confirmada com payloads reais capturados da instância "Revon"
// (texto simples e imagem). Tipos de mídia não capturados ainda (áudio,
// vídeo, documento) são tratados como messageType desconhecido — ver
// parseWaWebhookEvent. Não assumir estrutura para esses até confirmar com
// payload real.

interface EvolutionMessageKey {
  remoteJid: string;
  fromMe: boolean;
  id: string;
}

interface EvolutionMediaMessage {
  url: string;
  mimetype: string;
  base64?: string;
  fileLength?: { low: number; high: number; unsigned: boolean };
}

interface EvolutionMessageContent {
  conversation?: string;
  imageMessage?: EvolutionMediaMessage;
  audioMessage?: EvolutionMediaMessage;
  videoMessage?: EvolutionMediaMessage;
  documentMessage?: EvolutionMediaMessage;
}

export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: EvolutionMessageKey;
    pushName?: string;
    message: EvolutionMessageContent;
    messageType: string;
    messageTimestamp: number;
  };
  apikey?: string;
  [key: string]: unknown;
}

export type WaContentType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "unsupported";

export interface ParsedWaMessage {
  evolutionMessageId: string;
  remoteJid: string;
  fromMe: boolean;
  pushName: string | null;
  contentType: WaContentType;
  contentText: string | null;
  media: { base64: string; mimetype: string } | null;
  timestampWa: Date;
}

const MEDIA_FIELD_BY_TYPE: Record<string, { field: keyof EvolutionMessageContent; contentType: WaContentType }> = {
  imageMessage: { field: "imageMessage", contentType: "image" },
  audioMessage: { field: "audioMessage", contentType: "audio" },
  videoMessage: { field: "videoMessage", contentType: "video" },
  documentMessage: { field: "documentMessage", contentType: "document" },
};

// Remove o apikey do corpo antes de qualquer persistência/log — a Evolution
// ecoa o apikey da instância no próprio payload do webhook (confirmado em
// captura real), nunca deve ir para wa_webhook_queue.payload nem logs.
export function sanitizeWebhookPayload(payload: EvolutionWebhookPayload): Record<string, unknown> {
  const { apikey, ...rest } = payload;
  void apikey;
  return rest;
}

export function parseWaWebhookEvent(payload: EvolutionWebhookPayload): ParsedWaMessage | null {
  if (payload.event !== "messages.upsert") {
    return null;
  }

  const { key, message, messageType, messageTimestamp, pushName } = payload.data;

  if (message.conversation !== undefined) {
    return {
      evolutionMessageId: key.id,
      remoteJid: key.remoteJid,
      fromMe: key.fromMe,
      pushName: pushName ?? null,
      contentType: "text",
      contentText: message.conversation,
      media: null,
      timestampWa: new Date(messageTimestamp * 1000),
    };
  }

  const mediaEntry = MEDIA_FIELD_BY_TYPE[messageType];
  if (mediaEntry) {
    const mediaMessage = message[mediaEntry.field] as EvolutionMediaMessage | undefined;
    if (!mediaMessage?.base64) {
      // Sem base64 inline — não temos como recuperar a mídia depois (a url
      // do WhatsApp expira e exige mediaKey pra decriptar). Tratar como
      // mensagem perdida/não suportada em vez de tentar adivinhar.
      return {
        evolutionMessageId: key.id,
        remoteJid: key.remoteJid,
        fromMe: key.fromMe,
        pushName: pushName ?? null,
        contentType: "unsupported",
        contentText: null,
        media: null,
        timestampWa: new Date(messageTimestamp * 1000),
      };
    }

    return {
      evolutionMessageId: key.id,
      remoteJid: key.remoteJid,
      fromMe: key.fromMe,
      pushName: pushName ?? null,
      contentType: mediaEntry.contentType,
      contentText: null,
      media: { base64: mediaMessage.base64, mimetype: mediaMessage.mimetype },
      timestampWa: new Date(messageTimestamp * 1000),
    };
  }

  // messageType desconhecido (ex: tipos ainda não capturados em payload
  // real: sticker, contact, location, reaction...). Não assumir estrutura —
  // marcar como não suportado em vez de arriscar parsear campo errado.
  return {
    evolutionMessageId: key.id,
    remoteJid: key.remoteJid,
    fromMe: key.fromMe,
    pushName: pushName ?? null,
    contentType: "unsupported",
    contentText: null,
    media: null,
    timestampWa: new Date(messageTimestamp * 1000),
  };
}
