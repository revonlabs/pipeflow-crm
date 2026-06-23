import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// WA_MASTER_KEY: obrigatória, nunca tem default. Gerar com `openssl rand -base64 32`
// e configurar como env var na Vercel (nunca no Supabase Vault, nunca no código).
// Ver README do módulo (seção "Criptografia").
function getMasterKey(): string {
  const key = process.env.WA_MASTER_KEY;
  if (!key) {
    throw new Error("wa_master_key_missing");
  }
  return key;
}

// REGRA INEGOCIÁVEL: nenhuma função abaixo deve logar `key`, `plaintext` ou
// `ciphertext`. Erros do Postgres já voltam genéricos ("wa_crypto_error" —
// ver migration 024, funções *_rpc); aqui também só logamos contexto (ids),
// nunca os parâmetros de uma chamada de cripto.

type WaSupabaseClient = SupabaseClient<Database>;

export async function encryptWaContent(
  supabase: WaSupabaseClient,
  plaintext: string | null,
  workspaceId: string,
  keyVersion: number = 1
): Promise<string | null> {
  if (plaintext === null) return null;

  const { data, error } = await supabase.rpc("wa_encrypt_content_rpc", {
    p_plaintext: plaintext,
    p_workspace_id: workspaceId,
    p_key_version: keyVersion,
    p_master_key: getMasterKey(),
  });

  if (error) {
    throw new Error("wa_encrypt_failed");
  }

  return data as string;
}

export async function decryptWaContent(
  supabase: WaSupabaseClient,
  ciphertext: string | null,
  workspaceId: string,
  keyVersion: number = 1
): Promise<string | null> {
  if (ciphertext === null) return null;

  const { data, error } = await supabase.rpc("wa_decrypt_content_rpc", {
    p_ciphertext: ciphertext,
    p_workspace_id: workspaceId,
    p_key_version: keyVersion,
    p_master_key: getMasterKey(),
  });

  if (error) {
    throw new Error("wa_decrypt_failed");
  }

  return data as string | null;
}
