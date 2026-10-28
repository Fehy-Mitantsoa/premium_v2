/**
 * Service d'envoi automatique d'e-mails de confirmation de commande
 * Compatible Node.js / Express / Nodemailer avec templates HTML & Plain Text
 */

import nodemailer from "nodemailer";
import { Order, Customer, SystemSettings } from "../src/types";

export interface EmailRenderResult {
  subject: string;
  html: string;
  text: string;
  orderNumber: string;
  customerName: string;
  recipientEmail: string;
  totalFormatted: string;
  storeName: string;
  supportEmail: string;
}

export interface EmailSendResult {
  success: boolean;
  skipped?: boolean;
  messageId?: string;
  recipient?: string;
  sentAt?: string;
  error?: string;
  html?: string;
  text?: string;
  isSimulated?: boolean;
}

/**
 * Formate une date au format français standard
 */
export function formatFrenchDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
}

/**
 * Génère les contenus HTML et Plain Text du modèle d'e-mail professionnel
 */
export function generateOrderEmailTemplate(
  order: Order,
  customer?: Customer,
  settings?: SystemSettings,
  aiPersonalizedMessage?: string
): EmailRenderResult {
  const storeName = settings?.storeName || settings?.emailSenderName || "PREMIUM SHOP Madagascar";
  const supportEmail = settings?.emailSupportContact || settings?.emailSenderAddress || process.env.EMAIL_FROM || "andriamifehy18@gmail.com";
  const supportPhone = settings?.whatsappNumber || process.env.WHATSAPP_NUMBER || "0347454871";
  const orderNumber = order.orderNumber || order.id || "CMD-00000";
  
  // Résolution du nom du client
  let customerName = order.customerName || "";
  if (!customerName && customer) {
    customerName = `${customer.firstName} ${customer.lastName}`.trim();
  }
  if (!customerName) {
    customerName = "Cher client";
  }

  // Résolution de l'adresse e-mail
  const recipientEmail = order.email || order.userEmail || order.emailRecipient || customer?.email || settings?.emailSenderAddress || "andriamifehy18@gmail.com";

  // Résolution date de commande
  const orderDate = formatFrenchDate(order.orderDate || order.createdAt);

  // Résolution des montants et produits
  const products = (order.products || order.items || []).map(p => ({
    name: p.name || "Produit HighTech",
    quantity: Number(p.quantity || 1),
    price: Number(p.priceAtPurchase !== undefined ? p.priceAtPurchase : (p.price || 0)),
    image: p.image || ""
  }));

  const totalAmount = Number(order.totalAmount !== undefined ? order.totalAmount : (order.total || 0));
  const totalFormatted = `${totalAmount.toLocaleString("fr-FR")} Ar`;
  const shippingAddress = order.address || customer?.address || "Antananarivo, Madagascar";
  const paymentMethod = order.paymentMethod || "Mobile Money (MVola / Orange / Airtel)";
  const subject = `Confirmation de votre commande n°${orderNumber} - ${storeName}`;

  // Message IA personnalisé ou par défaut
  const aiNote = aiPersonalizedMessage && aiPersonalizedMessage.trim().length > 0
    ? aiPersonalizedMessage.trim()
    : `Nous vous remercions pour votre commande ! Notre système a bien enregistré votre demande n°${orderNumber} et nos équipes préparent vos articles avec le plus grand soin.`;

  // Construction de la version Plain Text (stricte conformité au modèle demandé)
  const plainProductsTable = products
    .map(p => `- ${p.name} (x${p.quantity}) : ${(p.price * p.quantity).toLocaleString("fr-FR")} Ar (${p.price.toLocaleString("fr-FR")} Ar / unité)`)
    .join("\n");

  const text = `Confirmation de votre commande n°${orderNumber} - ${storeName}

Bonjour ${customerName},

${aiNote}

Récapitulatif de votre commande :
${plainProductsTable}

Total : ${totalFormatted}

Adresse de livraison :
${shippingAddress}

Mode de paiement :
${paymentMethod} (Statut : ${order.paymentStatus || "En attente"})

Nous vous informerons dès que votre commande sera expédiée.

Merci de votre confiance !

Cordialement,
L'équipe ${storeName}
E-mail Support : ${supportEmail}
Téléphone / WhatsApp : ${supportPhone}
`;

  // Construction du template HTML responsive et soigné
  const productRowsHtml = products
    .map(
      p => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 16px; font-size: 14px; color: #1e293b; font-weight: 500;">
          <div style="font-size: 14px; font-weight: 600; color: #0f172a;">${p.name}</div>
          <div style="font-size: 12px; color: #64748b;">Prix unitaire : ${p.price.toLocaleString("fr-FR")} Ar</div>
        </td>
        <td style="padding: 12px 16px; font-size: 14px; color: #334155; text-align: center; font-weight: 600;">
          <span style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px;">x${p.quantity}</span>
        </td>
        <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; text-align: right; font-weight: 700;">
          ${(p.price * p.quantity).toLocaleString("fr-FR")} Ar
        </td>
      </tr>
    `
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding: 30px 0;
    }
    .main-card {
      background: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header-badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(52, 211, 153, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 28px 24px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 8px;
    }
    .intro-text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 20px;
    }
    .ai-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #10b981;
      padding: 14px 16px;
      border-radius: 0 10px 10px 0;
      margin-bottom: 22px;
      font-size: 13.5px;
      color: #166534;
      line-height: 1.55;
    }
    .table-container {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .table-header {
      background: #f1f5f9;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 700;
    }
    .footer {
      background: #f1f5f9;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-card">
      <!-- Header -->
      <div class="header">
        <div class="header-badge">✓ COMMANDE CONFIRMÉE</div>
        <h1>${storeName}</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Votre commande n° <strong>${orderNumber}</strong> est bien enregistrée</p>
      </div>

      <!-- Main Content -->
      <div class="content">
        <div class="greeting">Bonjour ${customerName},</div>
        
        <!-- AI LLM Personalized Confirmation Box -->
        <div class="ai-box">
          <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #15803d; margin-bottom: 4px;">
            🤖 Réponse Service Client Automatisé
          </div>
          ${aiNote}
        </div>

        <p class="intro-text">
          Nous avons bien reçu votre commande <strong>n°${orderNumber}</strong> effectuée le <strong>${orderDate}</strong>. Voici le récapitulatif complet de vos achats :
        </p>

        <!-- Product Table -->
        <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
          📦 Articles commandés
        </div>
        <table class="table-container">
          <thead>
            <tr class="table-header">
              <th style="padding: 10px 16px; text-align: left; border-radius: 8px 0 0 8px;">Article</th>
              <th style="padding: 10px 16px; text-align: center;">Qté</th>
              <th style="padding: 10px 16px; text-align: right; border-radius: 0 8px 8px 0;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${productRowsHtml}
          </tbody>
        </table>

        <!-- Total Banner -->
        <table style="width: 100%; background: #0f172a; color: #ffffff; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
          <tr>
            <td style="font-size: 15px; font-weight: 600; padding: 4px 10px;">Montant Total TTC :</td>
            <td style="font-size: 20px; font-weight: 800; text-align: right; color: #34d399; padding: 4px 10px;">${totalFormatted}</td>
          </tr>
        </table>

        <!-- Order details / Shipping and Payment -->
        <table style="width: 100%; border-spacing: 12px; margin-left: -12px; margin-right: -12px; margin-bottom: 16px;">
          <tr>
            <td style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; vertical-align: top; width: 50%;">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">📍 Adresse de livraison</div>
              <div style="font-size: 13px; color: #1e293b; font-weight: 500; line-height: 1.4;">${shippingAddress}</div>
            </td>
            <td style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; vertical-align: top; width: 50%;">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">💳 Mode de paiement</div>
              <div style="font-size: 13px; color: #1e293b; font-weight: 600;">${paymentMethod}</div>
              <div style="font-size: 11px; color: #10b981; font-weight: 600; margin-top: 2px;">Statut : ${order.paymentStatus || "En attente"}</div>
            </td>
          </tr>
        </table>

        <!-- Next step alert -->
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 13px; color: #1e40af; line-height: 1.5;">
          🚚 <strong>Suivi de commande :</strong> Notre service coursier vous avertira par message / téléphone dès le départ de la livraison.
        </div>

        <p style="font-size: 14px; color: #334155; margin-bottom: 16px;">
          Merci pour votre confiance !
        </p>

        <div style="font-size: 14px; color: #0f172a; line-height: 1.5;">
          Cordialement,<br>
          <strong>L'équipe ${storeName}</strong>
        </div>
      </div>

      <!-- Footer with Company Contact Info -->
      <div class="footer">
        <p style="margin: 0 0 6px 0; font-weight: 600; color: #475569;">Besoin d'aide ou d'informations sur votre commande ?</p>
        <p style="margin: 0 0 6px 0;">
          E-mail : <a href="mailto:${supportEmail}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${supportEmail}</a>
          &nbsp;•&nbsp; Service Client / WhatsApp : <strong style="color: #0f172a;">${supportPhone}</strong>
        </p>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} ${storeName} — Tous droits réservés.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  return {
    subject,
    html,
    text,
    orderNumber,
    customerName,
    recipientEmail,
    totalFormatted,
    storeName,
    supportEmail
  };
}

/**
 * Crée le transporteur Nodemailer (SMTP réel ou simulateur de transport)
 */
export function createMailTransporter(settings?: SystemSettings) {
  const host = settings?.emailSmtpHost || process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(settings?.emailSmtpPort || process.env.SMTP_PORT || 587);
  const user = (settings?.emailSmtpUser || process.env.SMTP_USER || "andriamifehy18@gmail.com").trim();
  const rawPass = (settings?.emailSmtpPassword || process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "aiiyhosoplaechbl").trim();
  // Strip spaces if user entered 4x4 format "aiiy hoso plae chbl"
  const pass = rawPass.replace(/\s+/g, "");
  const secure = settings?.emailSmtpSecure || process.env.SMTP_SECURE === "true" || port === 465;

  const isGmail = host.toLowerCase().includes("gmail");

  // Si des identifiants SMTP réels sont fournis avec un mot de passe non vide
  if (host && user && pass && pass.length > 0) {
    return {
      transporter: nodemailer.createTransport({
        ...(isGmail
          ? {
              service: "gmail",
              auth: { user, pass }
            }
          : {
              host,
              port,
              secure,
              auth: { user, pass },
              tls: { rejectUnauthorized: false }
            })
      }),
      isSimulated: false,
      host: isGmail ? "smtp.gmail.com (Gmail Service)" : host,
      user
    };
  }

  // Transporteur de simulation sécurisé (JSON transport / Fallback)
  return {
    transporter: nodemailer.createTransport({
      jsonTransport: true
    }),
    isSimulated: true,
    host: "smtp.simulated.internal (Mode Simulation - Mot de passe SMTP non configuré)",
    user: settings?.emailSenderAddress || process.env.EMAIL_FROM || process.env.SMTP_FROM || user
  };
}

/**
 * Envoie automatiquement l'e-mail de confirmation de commande avec prévention des doublons
 */
export async function sendOrderConfirmationEmail(
  order: Order,
  customer?: Customer,
  settings?: SystemSettings,
  force: boolean = false,
  aiPersonalizedMessage?: string
): Promise<EmailSendResult> {
  // Idempotence : Ne jamais envoyer deux fois la confirmation pour la même commande sauf si demandé explicitement
  if (order.emailSent && !force) {
    console.log(`[Email Confirmation] Commande #${order.id} : E-mail déjà envoyé le ${order.emailSentAt}. Ignoré pour éviter les doublons.`);
    return {
      success: true,
      skipped: true,
      sentAt: order.emailSentAt,
      recipient: order.email || order.userEmail || order.emailRecipient || customer?.email || "andriamifehy18@gmail.com",
      html: order.emailContentHtml,
      text: order.emailContentText
    };
  }

  // Vérifier si les notifications e-mails sont activées
  if (settings?.emailNotificationsEnabled === false) {
    console.log(`[Email Confirmation] Notifications e-mails désactivées dans les paramètres système.`);
    return {
      success: false,
      skipped: true,
      error: "Les notifications e-mails sont désactivées dans les paramètres de la boutique."
    };
  }

  try {
    const rendered = generateOrderEmailTemplate(order, customer, settings, aiPersonalizedMessage);
    const { transporter, isSimulated, host } = createMailTransporter(settings);

    const fromName = settings?.emailSenderName || settings?.storeName || "PREMIUM SHOP Madagascar";
    const fromAddress = settings?.emailSenderAddress || process.env.EMAIL_FROM || process.env.SMTP_FROM || "andriamifehy18@gmail.com";

    console.log(`[Email Confirmation] Préparation envoi e-mail pour commande #${rendered.orderNumber} vers ${rendered.recipientEmail} via ${host}...`);

    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: rendered.recipientEmail,
      replyTo: rendered.supportEmail,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html
    };

    const info = await transporter.sendMail(mailOptions);
    const sentAt = new Date().toISOString();

    if (isSimulated) {
      console.warn(`[Email Confirmation] ⚠️ Mode Simulation : L'e-mail pour la commande #${rendered.orderNumber} a été généré avec succès en interne, mais n'a pas été envoyé sur le web car le mot de passe SMTP (Google App Password) n'est pas encore renseigné.`);
    } else {
      console.log(`[Email Confirmation] ✅ E-mail envoyé avec succès sur le réseau SMTP pour commande #${rendered.orderNumber} (MessageId: ${info.messageId || 'real-' + Date.now()})`);
    }

    return {
      success: true,
      messageId: info.messageId || `msg_${Date.now()}`,
      recipient: rendered.recipientEmail,
      sentAt,
      html: rendered.html,
      text: rendered.text,
      isSimulated
    };
  } catch (err: any) {
    console.error(`[Email Confirmation] ❌ Erreur lors de l'envoi de l'e-mail de confirmation commande #${order.id}:`, err);
    
    let userFriendlyError = err?.message || "Erreur inconnue lors de l'envoi de l'e-mail de confirmation";
    if (userFriendlyError.includes("535") || userFriendlyError.includes("BadCredentials") || userFriendlyError.includes("Username and Password not accepted")) {
      userFriendlyError = "Échec d'authentification Google SMTP (535) : Google bloque les mots de passe de compte classiques. Vous devez générer un 'Mot de passe d'application' à 16 caractères sur https://myaccount.google.com/apppasswords et le renseigner dans Paramètres > Configuration SMTP.";
    }

    return {
      success: false,
      error: userFriendlyError
    };
  }
}

/**
 * Génère le template d'e-mail officiel pour la confirmation et le reçu de statut de paiement
 */
export function generatePaymentStatusEmailTemplate(
  order: Order,
  customer?: Customer,
  settings?: SystemSettings,
  aiPersonalizedMessage?: string,
  newPaymentStatus: string = "Payé"
): EmailRenderResult {
  const storeName = settings?.storeName || settings?.emailSenderName || "PREMIUM SHOP Madagascar";
  const supportEmail = settings?.emailSupportContact || settings?.emailSenderAddress || process.env.EMAIL_FROM || "andriamifehy18@gmail.com";
  const supportPhone = settings?.whatsappNumber || process.env.WHATSAPP_NUMBER || "0347454871";
  const orderNumber = order.orderNumber || order.id || "CMD-00000";
  
  let customerName = order.customerName || "";
  if (!customerName && customer) {
    customerName = `${customer.firstName} ${customer.lastName}`.trim();
  }
  if (!customerName) {
    customerName = "Cher client";
  }

  const recipientEmail = order.email || order.userEmail || order.emailRecipient || customer?.email || settings?.emailSenderAddress || "andriamifehy18@gmail.com";
  const paymentDate = formatFrenchDate(new Date().toISOString());

  const products = (order.products || order.items || []).map(p => ({
    name: p.name || "Article",
    quantity: Number(p.quantity || 1),
    price: Number(p.priceAtPurchase !== undefined ? p.priceAtPurchase : (p.price || 0))
  }));

  const totalAmount = Number(order.totalAmount !== undefined ? order.totalAmount : (order.total || 0));
  const totalFormatted = `${totalAmount.toLocaleString("fr-FR")} Ar`;
  const paymentMethod = order.paymentMethod || "Mobile Money";
  const refTransaction = order.transactionReference || `REC-${Date.now().toString().slice(-6)}`;

  const isApproved = newPaymentStatus === "Payé" || newPaymentStatus === "Validé" || newPaymentStatus === "approved";
  const statusLabel = isApproved ? "Paiement Validé & Reçu" : newPaymentStatus;
  const statusColor = isApproved ? "#10b981" : "#f59e0b";
  const badgeBg = isApproved ? "#ecfdf5" : "#fef3c7";
  const badgeBorder = isApproved ? "#a7f3d0" : "#fde68a";
  const badgeTextColor = isApproved ? "#065f46" : "#92400e";

  const subject = isApproved
    ? `✅ Reçu de Paiement & Confirmation - Commande n°${orderNumber} | ${storeName}`
    : `Statut de Paiement Mis à Jour - Commande n°${orderNumber} | ${storeName}`;

  const defaultMsg = isApproved
    ? `Nous avons le plaisir de vous confirmer la bonne réception et validation de votre règlement de ${totalFormatted} pour votre commande n°${orderNumber}. Vos articles sont dès à présent pris en charge par notre service logistique pour préparation et expédition immédiate.`
    : `Le statut de règlement pour votre commande n°${orderNumber} a été mis à jour dans notre système : ${statusLabel}.`;

  const aiNote = aiPersonalizedMessage && aiPersonalizedMessage.trim().length > 0
    ? aiPersonalizedMessage.trim()
    : defaultMsg;

  const plainProducts = products
    .map(p => `- ${p.name} (x${p.quantity}) : ${(p.price * p.quantity).toLocaleString("fr-FR")} Ar`)
    .join("\n");

  const text = `REÇU DE PAIEMENT & STATUT DE COMMANDE - ${storeName}
Numéro de commande : ${orderNumber}
Date de validation : ${paymentDate}

Bonjour ${customerName},

${aiNote}

===========================================
DÉTAILS DU RÈGLEMENT VALIDÉ
===========================================
Montant réglé : ${totalFormatted}
Statut du paiement : ${statusLabel}
Moyen de paiement : ${paymentMethod}
Référence transaction : ${refTransaction}

Articles concernés :
${plainProducts}

Adresse de livraison : ${order.address || customer?.address || "Antananarivo, Madagascar"}
Statut de la livraison : ${order.deliveryStatus || "En cours de préparation"}

Merci pour votre confiance !
L'équipe ${storeName}
Support E-mail : ${supportEmail}
Service Client & WhatsApp : ${supportPhone}
`;

  const productRowsHtml = products
    .map(
      p => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 14px; font-size: 13.5px; color: #1e293b; font-weight: 500;">
          ${p.name}
        </td>
        <td style="padding: 10px 14px; font-size: 13.5px; color: #334155; text-align: center; font-weight: 600;">
          x${p.quantity}
        </td>
        <td style="padding: 10px 14px; font-size: 13.5px; color: #0f172a; text-align: right; font-weight: 700;">
          ${(p.price * p.quantity).toLocaleString("fr-FR")} Ar
        </td>
      </tr>
    `
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #334155;">
  <div style="width: 100%; background-color: #f8fafc; padding: 30px 0;">
    <div style="background: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.35); padding: 4px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          ✓ REÇU DE PAIEMENT VALIDÉ
        </div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
          Paiement Approuvé & Confirmé
        </h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #d1fae5;">
          Commande n° <strong>${orderNumber}</strong> • ${storeName}
        </p>
      </div>

      <!-- Main Body -->
      <div style="padding: 28px 24px;">
        <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
          Bonjour ${customerName},
        </div>

        <!-- AI Note Box -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 0 10px 10px 0; margin-bottom: 22px; font-size: 13.5px; color: #166534; line-height: 1.55;">
          ${aiNote}
        </div>

        <!-- Payment Highlight Receipt Box -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 22px;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
            🧾 Attestation de Règlement
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Statut du règlement :</td>
              <td style="padding: 6px 0; text-align: right;">
                <span style="background: ${badgeBg}; color: ${badgeTextColor}; border: 1px solid ${badgeBorder}; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 12px;">
                  ✓ ${statusLabel}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Montant total réglé :</td>
              <td style="padding: 6px 0; text-align: right; font-size: 16px; font-weight: 800; color: #0f172a;">
                ${totalFormatted}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Moyen de paiement :</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1e293b;">
                ${paymentMethod}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Date de validation :</td>
              <td style="padding: 6px 0; text-align: right; color: #334155;">
                ${paymentDate}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Référence transaction :</td>
              <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 700; color: #475569;">
                ${refTransaction}
              </td>
            </tr>
          </table>
        </div>

        <!-- Products Summary -->
        <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
          📦 Articles de votre commande
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #64748b;">
              <th style="padding: 8px 14px; text-align: left;">Article</th>
              <th style="padding: 8px 14px; text-align: center;">Qté</th>
              <th style="padding: 8px 14px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${productRowsHtml}
          </tbody>
        </table>

        <!-- Shipping & Next Step Alert -->
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 22px; font-size: 13px; color: #1e40af; line-height: 1.5;">
          🚀 <strong>Prochaine étape :</strong> Votre commande passe immédiatement en expédition vers l'adresse <strong>${order.address || customer?.address || "Antananarivo, Madagascar"}</strong>.
        </div>

        <p style="font-size: 14px; color: #334155; margin-bottom: 16px;">
          Merci pour votre confiance !
        </p>

        <div style="font-size: 14px; color: #0f172a; line-height: 1.5;">
          Cordialement,<br>
          <strong>L'équipe ${storeName}</strong>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 6px 0; font-weight: 600; color: #475569;">Une question sur votre reçu ou votre livraison ?</p>
        <p style="margin: 0 0 6px 0;">
          E-mail : <a href="mailto:${supportEmail}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${supportEmail}</a>
          &nbsp;•&nbsp; Service Client / WhatsApp : <strong style="color: #0f172a;">${supportPhone}</strong>
        </p>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} ${storeName} — Tous droits réservés.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  return {
    subject,
    html,
    text,
    orderNumber,
    customerName,
    recipientEmail,
    totalFormatted,
    storeName,
    supportEmail
  };
}

/**
 * Envoie l'e-mail de confirmation et reçu de paiement au client
 */
export async function sendPaymentStatusNotificationEmail(
  order: Order,
  customer?: Customer,
  settings?: SystemSettings,
  force: boolean = false,
  aiPersonalizedMessage?: string,
  newPaymentStatus: string = "Payé"
): Promise<EmailSendResult> {
  if (settings?.emailNotificationsEnabled === false) {
    return {
      success: false,
      skipped: true,
      error: "Notifications e-mails désactivées dans les paramètres"
    };
  }

  try {
    const rendered = generatePaymentStatusEmailTemplate(order, customer, settings, aiPersonalizedMessage, newPaymentStatus);
    const { transporter, isSimulated, host } = createMailTransporter(settings);

    const fromName = settings?.emailSenderName || settings?.storeName || "PREMIUM SHOP Madagascar";
    const fromAddress = settings?.emailSenderAddress || process.env.EMAIL_FROM || process.env.SMTP_FROM || "andriamifehy18@gmail.com";

    console.log(`[Payment Email] Envoi reçu de paiement commande #${rendered.orderNumber} vers ${rendered.recipientEmail} via ${host}...`);

    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: rendered.recipientEmail,
      replyTo: rendered.supportEmail,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html
    };

    const info = await transporter.sendMail(mailOptions);
    const sentAt = new Date().toISOString();

    return {
      success: true,
      messageId: info.messageId || `pay_msg_${Date.now()}`,
      recipient: rendered.recipientEmail,
      sentAt,
      html: rendered.html,
      text: rendered.text,
      isSimulated
    };
  } catch (err: any) {
    console.error(`[Payment Email] ❌ Erreur lors de l'envoi de l'e-mail de paiement commande #${order.id}:`, err);
    return {
      success: false,
      error: err?.message || "Erreur lors de l'envoi de l'e-mail de confirmation de paiement"
    };
  }
}
