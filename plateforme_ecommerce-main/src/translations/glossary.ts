/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fr from './fr.json';
import mg from './mg.json';
import en from './en.json';

export type LanguageCode = 'fr' | 'mg' | 'en';

export const translations: Record<LanguageCode, typeof fr> = {
  fr,
  mg: mg as typeof fr,
  en: en as typeof fr,
};

export const MULTILINGUAL_GLOSSARY = {
  mg: {
    product: 'entana (produit)',
    order: 'fandaminana (commande)',
    delivery: 'fandefasana entana (livraison)',
    return: 'famerenana entana (retour)',
    payment: 'fandoavam-bola (paiement)',
    cart: 'harona (panier)',
    price: 'vidiny (prix)',
    discount: 'fampidinana vidy (promotion)',
    warranty: 'antoka (garantie)',
    invoice: 'fanamarinana fividianana (facture)',
  },
  fr: {
    product: 'produit',
    order: 'commande',
    delivery: 'livraison',
    return: 'retour',
    payment: 'paiement',
    cart: 'panier',
    price: 'prix',
    discount: 'promotion',
    warranty: 'garantie',
    invoice: 'facture',
  },
  en: {
    product: 'product',
    order: 'order',
    delivery: 'delivery',
    return: 'return',
    payment: 'payment',
    cart: 'cart',
    price: 'price',
    discount: 'discount',
    warranty: 'warranty',
    invoice: 'invoice',
  },
};

export function getTranslation(lang: LanguageCode, path: keyof typeof fr.general): string {
  const selected = translations[lang] || translations.fr;
  return selected.general[path] || translations.fr.general[path];
}
