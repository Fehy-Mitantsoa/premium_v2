/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SupportedLanguage = 'mg' | 'fr' | 'en';

const MALAGASY_KEYWORDS = [
  'salama', 'manao ahoana', 'inona', 'vaovao', 'misy', 'solosaina', 'finday',
  'momba', 'fandefasana', 'entana', 'kaomandy', 'ohatrinona', 'laharana',
  'hafely', 'fomba', 'fandoavana', 'fiverenana', 'ho', 'ny', 'sy', 'ary',
  'mbamin', 'miankina', 'fa', 'satria', 'eto', 'anatananarivo', 'tanàna',
  'fitongilanana', 'vidiny', 'zavatra', 'aiza', 'rahoviana', 'antso'
];

const FRENCH_KEYWORDS = [
  'bonjour', 'salut', 'coucou', 'combien', 'livraison', 'commande', 'produit',
  'prix', 'ordinateur', 'telephone', 'suivi', 'retractation', 'remboursement',
  'casque', 'achat', 'garantie', 'frais', 'delai', 'payer', 'payement',
  'paiement', 'comment', 'quand', 'est-ce', 'pouvez', 'pouvez-vous', 'avez-vous'
];

const ENGLISH_KEYWORDS = [
  'hello', 'hi', 'hey', 'laptop', 'phone', 'price', 'delivery', 'shipping',
  'order', 'track', 'tracking', 'refund', 'return', 'cost', 'available',
  'stock', 'how', 'when', 'where', 'payment', 'discount', 'deal', 'can', 'you'
];

/**
 * Detects the dominant language in a user message.
 * Defaults to 'fr' if ambiguous.
 */
export function detectLanguage(text: string): SupportedLanguage {
  if (!text || !text.trim()) return 'fr';

  const cleanText = text.toLowerCase().trim();
  const words = cleanText.split(/\s+/);

  let mgScore = 0;
  let frScore = 0;
  let enScore = 0;

  for (const word of words) {
    const stripped = word.replace(/[^a-zàâéèêëîïôûùüçñ-]/g, '');
    if (!stripped) continue;

    if (MALAGASY_KEYWORDS.includes(stripped)) mgScore += 2;
    if (FRENCH_KEYWORDS.includes(stripped)) frScore += 2;
    if (ENGLISH_KEYWORDS.includes(stripped)) enScore += 2;

    // Malagasy specific endings & character patterns (e.g., -ko, -na, -ny, -ao, -o)
    if (stripped.endsWith('ny') || stripped.endsWith('ko') || stripped.endsWith('ao') || stripped.startsWith('mif')) {
      mgScore += 0.5;
    }
  }

  // Explicit Malagasy greetings or question markers
  if (cleanText.includes('salama') || cleanText.includes('manao ahoana') || cleanText.includes('ohatrinona') || cleanText.includes('inona no')) {
    mgScore += 3;
  }

  if (cleanText.includes('how much') || cleanText.includes('where is my') || cleanText.includes('what is the')) {
    enScore += 3;
  }

  if (cleanText.includes('est-ce') || cleanText.includes('combien coûte') || cleanText.includes('ou est')) {
    frScore += 3;
  }

  if (mgScore > frScore && mgScore > enScore) return 'mg';
  if (enScore > frScore && enScore > mgScore) return 'en';
  if (frScore > 0) return 'fr';

  return 'fr'; // default fallback
}
