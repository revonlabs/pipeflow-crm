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

// POST /message/sendText/{instance} com { number, text } — validado com
// chamada real contra a instância "Revon" (retornou 201 + payload com a
// mesma estrutura key/message.conversation do webhook de mensagens).
export async function sendTextMessage(input: SendTextMessageInput): Promise<void> {
  await evolutionFetch(`/message/sendText/${encodeURIComponent(input.instanceName)}`, {
    method: "POST",
    body: JSON.stringify({
      number: input.remoteJid,
      text: input.text,
    }),
  });
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
