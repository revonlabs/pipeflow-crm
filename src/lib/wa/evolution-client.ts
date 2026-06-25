import "server-only";

// Cliente HTTP da Evolution API. Sem SDK oficial confiável — fetch nativo.
// Auth: header `apikey` (confirmado em payload real de webhook recebido da
// instância "Revon" — server_url https://evolution.revonlabs.com.br).
// EVOLUTION_API_URL/EVOLUTION_API_KEY são globais por ambiente; cada
// instância é identificada por evolution_instance_name (wa_instances).

function getConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error("evolution_api_config_missing");
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey };
}

async function evolutionFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl, apiKey } = getConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    // Nunca incluir o corpo da resposta de erro na exceção: pode conter o
    // apikey ecoado (confirmado que a Evolution inclui apikey em payloads).
    throw new Error(`evolution_api_error:${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface SendTextMessageInput {
  instanceName: string;
  remoteJid: string;
  text: string;
}

export interface SendTextMessageResult {
  evolutionMessageId: string;
}

interface SendTextMessageResponse {
  key: { id: string };
}

// POST /message/sendText/{instance} com { number, text } — validado com
// chamada real contra a instância "Revon" (retornou 201 + payload com a
// mesma estrutura key/message.conversation do webhook de mensagens).
// key.id é o evolution_message_id — usado para preencher
// wa_messages.evolution_message_id (UNIQUE) na persistência da intervenção
// do admin, igual ao que o webhook já faz para mensagens recebidas.
export async function sendTextMessage(
  input: SendTextMessageInput
): Promise<SendTextMessageResult> {
  const response = await evolutionFetch<SendTextMessageResponse>(
    `/message/sendText/${encodeURIComponent(input.instanceName)}`,
    {
      method: "POST",
      body: JSON.stringify({
        number: input.remoteJid,
        text: input.text,
      }),
    }
  );

  return { evolutionMessageId: response.key.id };
}

export interface SetWebhookInput {
  instanceName: string;
  webhookUrl: string;
  events?: string[];
}

// POST /webhook/set/{instance} — validado com chamada real contra a
// instância "Revon" (retornou 201). `enabled: true` é obrigatório — sem ele
// a API responde 400 com 'webhook requires property "enabled"'.
export async function setInstanceWebhook(input: SetWebhookInput): Promise<void> {
  await evolutionFetch(`/webhook/set/${encodeURIComponent(input.instanceName)}`, {
    method: "POST",
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: input.webhookUrl,
        webhookByEvents: false,
        events: input.events ?? ["MESSAGES_UPSERT"],
      },
    }),
  });
}

export interface CreateInstanceInput {
  instanceName: string;
  webhookUrl: string;
  events?: string[];
}

export interface InstanceQrCode {
  base64: string;
  code: string;
  pairingCode: string | null;
}

// POST /instance/create — validado com chamada real (Sprint 5.5, instância
// "teste-sprint55"). O webhook embutido no payload É aplicado pela Evolution
// (confirmado: resposta trouxe webhook configurado), então setInstanceWebhook
// separado não é necessário neste fluxo — fica reservado para reconfigurar
// webhook de instâncias já existentes (ex: "trazer" a instância "Revon").
// Shape da resposta tem o QR aninhado em `qrcode` (diferente de
// getInstanceConnect, que retorna o QR direto na raiz — confirmado nos dois
// curls reais desta sessão).
export async function createInstance(input: CreateInstanceInput): Promise<InstanceQrCode> {
  const response = await evolutionFetch<{ qrcode: InstanceQrCode }>("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName: input.instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      webhook: {
        enabled: true,
        url: input.webhookUrl,
        webhookByEvents: false,
        events: input.events ?? ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"],
      },
    }),
  });

  return response.qrcode;
}

// GET /instance/connect/{instance} — regenera o QR de uma instância existente
// ainda não conectada. Shape da resposta NÃO tem o wrapper `qrcode` (confirmado
// em payload real: { base64, code, pairingCode, count } direto na raiz).
export async function getInstanceConnect(instanceName: string): Promise<InstanceQrCode> {
  return evolutionFetch<InstanceQrCode>(
    `/instance/connect/${encodeURIComponent(instanceName)}`,
    { method: "GET" }
  );
}

// DELETE /instance/delete/{instance} — validado com chamada real (retornou
// { status: "SUCCESS", error: false }).
export async function deleteInstance(instanceName: string): Promise<void> {
  await evolutionFetch(`/instance/delete/${encodeURIComponent(instanceName)}`, {
    method: "DELETE",
  });
}
