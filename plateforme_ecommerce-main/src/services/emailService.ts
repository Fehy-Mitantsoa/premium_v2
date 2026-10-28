/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import nodemailer from 'nodemailer';

interface SendVerificationEmailOptions {
  toEmail: string;
  userName: string;
  code: string;
  expiresInMinutes?: number;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports (587, 25)
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return transporter;
}

export async function sendVerificationEmail({
  toEmail,
  userName,
  code,
  expiresInMinutes = 10
}: SendVerificationEmailOptions): Promise<{ success: boolean; simulated?: boolean; messageId?: string; error?: string }> {
  const sender = process.env.EMAIL_FROM || '"Vahaolana Mora" <no-reply@vahaolana-mora.com>';
  const transport = getTransporter();

  const formattedCode = code.split('').join(' ');

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de confirmation - Vahaolana Mora</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #059669; padding: 28px 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 32px; }
    .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
    .text { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .code-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #047857; margin: 0; }
    .expiry { font-size: 13px; color: #64748b; margin-top: 10px; font-weight: 500; }
    .warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #92400e; margin-top: 24px; }
    .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛍️ Vahaolana Mora</h1>
    </div>
    <div class="content">
      <div class="greeting">Bonjour ${userName || 'Cher(e) Client(e)'},</div>
      <p class="text">
        Merci d'avoir initié votre inscription sur <strong>Vahaolana Mora</strong>. 
        Pour finaliser la création de votre compte et vérifier votre adresse email, veuillez saisir le code de sécurité ci-dessous :
      </p>
      
      <div class="code-box">
        <div class="code">${code}</div>
        <div class="expiry">⏳ Ce code est valable pendant ${expiresInMinutes} minutes</div>
      </div>

      <div class="warning">
        🔒 <strong>Consigne de sécurité :</strong> Ne partagez jamais ce code. Notre équipe ne vous demandera jamais votre code de vérification.
      </div>

      <p class="text" style="margin-top: 24px; font-size: 13px; color: #64748b;">
        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Vahaolana Mora E-Commerce. Tous droits réservés.
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `Bonjour ${userName || 'Client'},

Votre code de confirmation Vahaolana Mora est : ${code}

Ce code est valable pendant ${expiresInMinutes} minutes.
Pour votre sécurité, ne partagez jamais ce code.

Si vous n'avez pas demandé ce code, ignorez simplement ce message.

L'équipe Vahaolana Mora.`;

  // Always log code clearly in server logs for dev/debug convenience
  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL DE VÉRIFICATION] Pour: ${toEmail}`);
  console.log(`🔑 [CODE À 6 CHIFFRES]: >>> ${code} <<<`);
  console.log(`⏳ Valide 10 minutes`);
  console.log(`======================================================\n`);

  if (!transport) {
    console.log(`ℹ️ [SMTP INFO] Identifiants SMTP non définis dans l'environnement. Le code ci-dessus est valide pour le test.`);
    return {
      success: true,
      simulated: true,
      messageId: 'simulated_' + Date.now()
    };
  }

  try {
    const info = await transport.sendMail({
      from: sender,
      to: toEmail,
      subject: `Votre code de vérification Vahaolana Mora : ${code}`,
      text: textContent,
      html: htmlContent
    });

    console.log(`✅ [EMAIL SENT] Message envoyé avec succès à ${toEmail} (ID: ${info.messageId})`);
    return {
      success: true,
      simulated: false,
      messageId: info.messageId
    };
  } catch (err: any) {
    console.error(`❌ [EMAIL ERROR] Erreur lors de l'envoi SMTP à ${toEmail}:`, err.message);
    // Return simulated success so the flow doesn't break if SMTP configuration is wrong, but with error note
    return {
      success: true,
      simulated: true,
      error: err.message
    };
  }
}
