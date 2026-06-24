// Template do resumo diário do módulo WhatsApp — HTML puro, sem react-dom/server
// (mesma convenção de workspace-invite.tsx, compatibilidade com Turbopack).
export interface WaDailyDigestEmailProps {
  workspaceName: string
  periodLabel: string
  totalIn: number
  totalOut: number
  uniqueContacts: number
  conversationsStarted: number
  conversationsUnanswered1h: number
  dashboardUrl: string
}

export function renderWaDailyDigestEmail({
  workspaceName,
  periodLabel,
  totalIn,
  totalOut,
  uniqueContacts,
  conversationsStarted,
  conversationsUnanswered1h,
  dashboardUrl,
}: WaDailyDigestEmailProps): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resumo de WhatsApp — ${workspaceName}</title>
</head>
<body style="margin:0;padding:0;background:#060B14;font-family:'Inter',Arial,sans-serif;color:#e5e7eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060B14;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0D1B2E;border-radius:12px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:20px;font-weight:700;color:#FF7043;letter-spacing:-0.5px;">Revon Studio CRM</span>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#f9fafb;">
                Resumo de WhatsApp — <span style="color:#FF7043;">${workspaceName}</span>
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
                Período: ${periodLabel}
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;">
                    <p style="margin:0;font-size:12px;color:#8BACD4;">Mensagens recebidas</p>
                    <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#3BFFA0;">${totalIn}</p>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;">
                    <p style="margin:0;font-size:12px;color:#8BACD4;">Mensagens enviadas</p>
                    <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#4A90E2;">${totalOut}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;">
                    <p style="margin:0;font-size:12px;color:#8BACD4;">Contatos únicos</p>
                    <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#f9fafb;">${uniqueContacts}</p>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;">
                    <p style="margin:0;font-size:12px;color:#8BACD4;">Conversas iniciadas</p>
                    <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#f9fafb;">${conversationsStarted}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;background:rgba(255,171,64,0.08);border:1px solid rgba(255,171,64,0.2);border-radius:8px;">
                    <p style="margin:0;font-size:12px;color:#FFAB40;">Sem resposta há mais de 1h</p>
                    <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#FFAB40;">${conversationsUnanswered1h}</p>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#FF7043;">
                    <a href="${dashboardUrl}"
                       style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#060B14;text-decoration:none;border-radius:8px;">
                      Ver dashboard completo
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:#4b5563;">
                © ${new Date().getFullYear()} Revon Studio CRM. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
