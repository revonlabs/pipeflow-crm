import "server-only";

// WA_MASTER_KEY: obrigatória, nunca tem default. Gerar com `openssl rand -base64 32`
// e configurar como env var na Vercel (nunca no Supabase Vault, nunca no código).
// Ver README do módulo (seção "Criptografia").
export function getMasterKey(): string {
  const key = process.env.WA_MASTER_KEY;
  if (!key) {
    throw new Error("wa_master_key_missing");
  }
  return key;
}
