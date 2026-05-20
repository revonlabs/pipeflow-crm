// Template de convite como HTML puro — sem react-dom/server para compatibilidade com Turbopack
export interface WorkspaceInviteEmailProps {
  workspaceName: string
  inviterName: string
  inviterEmail: string
  role: 'admin' | 'member'
  acceptUrl: string
  expiresInDays?: number
}

export function renderWorkspaceInviteEmail({
  workspaceName,
  inviterName,
  inviterEmail,
  role,
  acceptUrl,
  expiresInDays = 7,
}: WorkspaceInviteEmailProps): string {
  const roleLabel = role === 'admin' ? 'Administrador' : 'Membro'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Convite para ${workspaceName} — PipeFlow</title>
</head>
<body style="margin:0;padding:0;background:#0C0C0E;font-family:'Inter',Arial,sans-serif;color:#e5e7eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0C0C0E;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#141416;border-radius:12px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:20px;font-weight:700;color:#CAFF33;letter-spacing:-0.5px;">PipeFlow</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#f9fafb;">
                Você foi convidado para <span style="color:#CAFF33;">${workspaceName}</span>
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
                <strong style="color:#e5e7eb;">${inviterName}</strong>
                (${inviterEmail}) convidou você para colaborar no workspace
                <strong style="color:#e5e7eb;">${workspaceName}</strong>
                com o papel de <strong style="color:#e5e7eb;">${roleLabel}</strong>.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#CAFF33;">
                    <a href="${acceptUrl}"
                       style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#0C0C0E;text-decoration:none;border-radius:8px;">
                      Aceitar convite
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#6b7280;">
                Este convite expira em ${expiresInDays} dias. Se não era para você, ignore este e-mail.
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#4b5563;word-break:break-all;">
                Ou acesse: <a href="${acceptUrl}" style="color:#CAFF33;">${acceptUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:#4b5563;">
                © ${new Date().getFullYear()} PipeFlow CRM. Todos os direitos reservados.
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
