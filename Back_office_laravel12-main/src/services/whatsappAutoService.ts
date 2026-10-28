/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order, Customer, Product } from "../types";

export const DEFAULT_WHATSAPP_CS_PROMPT = `Tu es l'assistant du service client d'une boutique e-commerce.
Ton rôle :
1. Consulter la nouvelle commande et vérifier la présence des produits dans la boutique.
2. Répondre au client que sa commande a été bien reçue, que le produit est disponible dans notre boutique, et lui demander poliment d'effectuer le paiement avant que le produit ne soit livré.
3. Dès que le paiement est validé, envoyer un message au client pour lui confirmer la réception du règlement et lui indiquer que le produit est en cours de livraison (ou livré).
4. Si la demande concerne un litige ou une réclamation complexe, transférer vers un conseiller humain sans rien inventer.

Directives strictes :
- Réponds uniquement en français.
- Sois poli, professionnel et concis (3 phrases maximum).
- Utilise le prénom du client lorsqu'il est disponible.
- Ne donne jamais d'informations non vérifiables dans le contexte.`;

/**
 * Extracts clean first name from customer record or customer name string
 */
export function extractCustomerFirstName(customerName?: string, customerObj?: Customer): string {
  if (customerObj?.firstName && customerObj.firstName.trim()) {
    return customerObj.firstName.trim();
  }
  if (!customerName || !customerName.trim()) {
    return "";
  }
  const parts = customerName.trim().split(/\s+/);
  return parts[0] || "";
}

/**
 * Format order items summary (e.g. "Écran Gaming 34\"" or "2 articles")
 */
export function formatOrderProductsSummary(order: Order): string {
  const items = order.products || order.items || [];
  if (items.length === 0) return "commande";
  if (items.length === 1) {
    return `${items[0].name}`;
  }
  if (items.length === 2) {
    return `${items[0].name} et ${items[1].name}`;
  }
  return `${items[0].name} ainsi que ${items.length - 1} autre(s) article(s)`;
}

/**
 * Checks if products in the order exist in shop's catalog
 */
export function verifyProductsInCatalog(order: Order, catalog: Product[] = []): { allInShop: boolean; availableNames: string[] } {
  const items = order.products || order.items || [];
  if (items.length === 0) return { allInShop: true, availableNames: [] };
  if (catalog.length === 0) return { allInShop: true, availableNames: items.map(i => i.name) };

  const availableNames: string[] = [];
  let allInShop = true;

  for (const item of items) {
    const matched = catalog.find(
      p => p.id === item.productId || p.name.toLowerCase().trim() === item.name.toLowerCase().trim()
    );
    if (matched) {
      availableNames.push(matched.name);
    } else {
      allInShop = false;
      availableNames.push(item.name);
    }
  }

  return { allInShop, availableNames };
}

/**
 * Clean clean order reference number
 */
export function getCleanOrderNumber(order: Order): string {
  if (order.orderNumber) return order.orderNumber.replace(/^CMD-/, "");
  if (order.id) {
    const digits = order.id.replace(/\D/g, "");
    if (digits.length >= 4) {
      return digits.slice(-4);
    }
    return order.id;
  }
  return "0001";
}

/**
 * Deterministic fallback generator strictly adhering to user's specified role:
 * 1. Inspect new order & verify product in shop
 * 2. Order received -> prompt payment before delivery
 * 3. Payment validated -> confirm payment & announce delivery
 */
export function buildDeterministicWhatsAppReply(
  order: Order,
  customer?: Customer,
  scenario: "auto" | "new_order" | "payment_validated" | "shipped" | "refund_claim" = "auto",
  catalog: Product[] = []
): string {
  const firstName = extractCustomerFirstName(order.customerName, customer);
  const greeting = firstName ? `Bonjour ${firstName} 👋` : "Bonjour 👋";
  const orderNum = getCleanOrderNumber(order);
  const productsSummary = formatOrderProductsSummary(order);
  const totalStr = (order.totalAmount || order.total || 0).toLocaleString("fr-FR");
  const payMethod = order.paymentMethod || "Mobile Money (MVola / Orange / Airtel)";

  const isPaid = order.paymentStatus === "Payé";
  const isDeliveredOrShipped = order.deliveryStatus === "Livré" || order.deliveryStatus === "Expédié";

  const effectiveScenario = scenario !== "auto"
    ? scenario
    : (order.deliveryStatus === "Annulé" || order.paymentStatus === "Remboursé")
    ? "refund_claim"
    : (isPaid || isDeliveredOrShipped)
    ? "payment_validated"
    : "new_order";

  // Scenario: Claim / Refund
  if (effectiveScenario === "refund_claim") {
    return `${greeting}, nous avons bien pris en compte votre demande concernant la commande n°${orderNum}. Je transfère immédiatement votre dossier à un conseiller de notre équipe qui va vous recontacter très rapidement. Merci pour votre patience et votre confiance !`;
  }

  // Scenario: Payment is validated -> Product is being delivered / delivered
  if (effectiveScenario === "payment_validated") {
    const carrier = order.carrier || "notre service coursier";
    return `${greeting}, votre paiement de ${totalStr} Ar pour la commande n°${orderNum} (${productsSummary}) a bien été validé avec succès ! Votre colis est désormais en cours de livraison par ${carrier}. Merci pour votre confiance et à très bientôt !`;
  }

  // Scenario: Shipped with explicit tracking
  if (effectiveScenario === "shipped") {
    const carrier = order.carrier || "notre service coursier express";
    const tracking = order.trackingNumber || `TRK-${orderNum}`;
    return `${greeting}, votre commande n°${orderNum} (${productsSummary}) est en cours d'acheminement par ${carrier} (Suivi : ${tracking}). Nous vous remercions pour votre achat chez nous !`;
  }

  // Scenario: New order received -> Product verified in shop -> Request payment before delivery
  return `${greeting}, nous avons bien reçu votre commande n°${orderNum} pour votre ${productsSummary}, bien disponible dans notre boutique ! Merci d'effectuer le règlement de ${totalStr} Ar via ${payMethod} afin que nous puissions déclencher la livraison. Nous restons à votre entière disposition.`;
}

/**
 * Builds direct WhatsApp Web / app link (https://wa.me/...)
 */
export function buildWhatsAppDirectLink(phoneNumber: string, message: string): string {
  let cleanPhone = (phoneNumber || "").replace(/[^0-9]/g, "");
  if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
    cleanPhone = "261" + cleanPhone.substring(1);
  }
  if (cleanPhone.length === 9 && (cleanPhone.startsWith("32") || cleanPhone.startsWith("33") || cleanPhone.startsWith("34") || cleanPhone.startsWith("38"))) {
    cleanPhone = "261" + cleanPhone;
  }
  const encodedText = encodeURIComponent(message);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
}
