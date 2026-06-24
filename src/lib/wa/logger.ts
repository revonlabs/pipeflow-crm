import "server-only";

type LogLevel = "info" | "warn" | "error";

interface WaLogFields {
  workspaceId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

// Logger mínimo, JSON estruturado para stdout (spec §11.1).
// PROIBIDO logar aqui: content_text, telefone completo, token, webhook_secret.
// Só IDs e metadados — quem chama é responsável por não passar PII em `fields`.
function log(level: LogLevel, msg: string, fields: WaLogFields = {}): void {
  const line = JSON.stringify({
    level,
    msg,
    workspace_id: fields.workspaceId,
    user_id: fields.userId,
    request_id: fields.requestId,
    ...omitKnownKeys(fields),
    timestamp: new Date().toISOString(),
  });

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

function omitKnownKeys(fields: WaLogFields): Record<string, unknown> {
  const { workspaceId, userId, requestId, ...rest } = fields;
  void workspaceId;
  void userId;
  void requestId;
  return rest;
}

export const waLogger = {
  info: (msg: string, fields?: WaLogFields) => log("info", msg, fields),
  warn: (msg: string, fields?: WaLogFields) => log("warn", msg, fields),
  error: (msg: string, fields?: WaLogFields) => log("error", msg, fields),
};
