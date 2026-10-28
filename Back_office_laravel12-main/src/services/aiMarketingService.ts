/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from "../types";

export interface GeneratedFacebookContent {
  postText: string;
  hashtags: string[];
  callToAction: string;
  source: "gemini-ai" | "template-fallback";
}

/**
 * Clean product data and generate structured marketing copy for Facebook
 */
export function buildDeterministicMarketingPost(product: Product, shopUrl: string = "http://localhost:30000", shopName: string = "PREMIUM SHOP Madagascar Official"): string {
  const priceVal = product.currentPrice || product.price || product.originalPrice || 0;
  const priceDisplay = priceVal > 0 ? `${priceVal.toLocaleString("fr-FR")} Ar` : "Sur demande";
  const stockDisplay = product.stock !== undefined && product.stock !== null && product.stock > 0 ? `${product.stock} unité(s)` : "";
  const categoryDisplay = product.category || "";
  const productDesc = product.description ? product.description.trim() : "";
  const websiteUrl = shopUrl || "http://localhost:30000";
  const whatsappNumber = "0347454871";

  let text = `🚀🔥 ${product.name} 🔥🚀\n\n`;
  if (productDesc) {
    text += `${productDesc}\n\n`;
  } else {
    text += `Découvrez dès maintenant ${product.name} disponible chez ${shopName} !\n\n`;
  }

  text += `Points forts :\n`;
  text += `✅ Qualité supérieure et sélectionnée avec soin\n`;
  if (categoryDisplay) {
    text += `✅ Catégorie : ${categoryDisplay}\n`;
  }
  text += `✅ Produit authentique et prêt à l'expédition\n\n`;

  if (priceDisplay) {
    text += `💰 Prix exceptionnel : **${priceDisplay}**\n`;
  }

  if (stockDisplay) {
    text += `📦 Stock disponible : ${stockDisplay}\n`;
  }

  text += `\n🛒 POUR COMMANDER OU OBTENIR PLUS D'INFORMATIONS :\n`;
  text += `🌐 Site web officiel : ${websiteUrl}\n`;
  text += `📲 WhatsApp direct : ${whatsappNumber} (https://wa.me/261347454871)\n`;
  text += `📩 Commandez en Message Privé (MP)\n`;
  text += `🚚 Livraison express à Antananarivo et envoi sécurisé en provinces\n`;

  const catTag = categoryDisplay ? `#${categoryDisplay.replace(/[^a-zA-Z0-9]/g, "")}` : "#Shopping";
  text += `\n#Madagascar #Antananarivo #VenteEnLigne #PremiumShop #ShoppingMada #ECommerceMada ${catTag}`;

  return text;
}
